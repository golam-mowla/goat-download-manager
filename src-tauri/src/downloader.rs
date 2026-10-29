use reqwest::header::{ACCEPT_RANGES, CONTENT_DISPOSITION, CONTENT_LENGTH, RANGE, USER_AGENT};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};
use tokio::fs::{self, File, OpenOptions};
use tokio::io::{AsyncReadExt, AsyncSeekExt, AsyncWriteExt, SeekFrom};
use tokio::sync::{broadcast, RwLock};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChunkProgress {
    pub index: usize,
    pub start: u64,
    pub end: u64,
    pub downloaded: u64,
    pub total: u64,
    pub percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UrlMetadata {
    pub url: String,
    pub filename: String,
    pub total_size: Option<u64>,
    pub supports_ranges: bool,
    pub content_type: Option<String>,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadTask {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub save_path: String,
    pub total_bytes: u64,
    pub downloaded_bytes: u64,
    pub percent: f64,
    pub speed_bps: u64,
    pub speed_formatted: String,
    pub eta_formatted: String,
    pub status: String, // "queued" | "downloading" | "paused" | "assembling" | "completed" | "error" | "cancelled"
    pub category: String, // "all" | "video" | "audio" | "docs" | "compressed" | "programs"
    pub chunk_count: usize,
    pub chunks: Vec<ChunkProgress>,
    pub speed_history: Vec<u64>,
    pub error_message: Option<String>,
    pub created_at: String,
}

pub struct ActiveDownloadControl {
    pub cancel_sender: broadcast::Sender<()>,
    pub is_paused: Arc<AtomicBool>,
}

#[derive(Clone)]
pub struct EngineState {
    pub tasks: Arc<RwLock<HashMap<String, DownloadTask>>>,
    pub controls: Arc<RwLock<HashMap<String, ActiveDownloadControl>>>,
    pub client: reqwest::Client,
}

impl EngineState {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(60))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());

        Self {
            tasks: Arc::new(RwLock::new(HashMap::new())),
            controls: Arc::new(RwLock::new(HashMap::new())),
            client,
        }
    }
}

pub fn detect_category(filename: &str) -> String {
    let ext = Path::new(filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "mp4" | "mkv" | "avi" | "mov" | "webm" | "flv" | "wmv" | "m4v" => "video".to_string(),
        "mp3" | "wav" | "flac" | "aac" | "ogg" | "m4a" | "opus" | "wma" => "audio".to_string(),
        "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "txt" | "epub" | "csv" => "docs".to_string(),
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" | "iso" => "compressed".to_string(),
        "exe" | "msi" | "apk" | "dmg" | "deb" | "rpm" | "appimage" => "programs".to_string(),
        _ => "docs".to_string(),
    }
}

pub fn format_speed(bytes_per_sec: u64) -> String {
    if bytes_per_sec >= 1024 * 1024 * 1024 {
        format!("{:.2} GB/s", bytes_per_sec as f64 / (1024.0 * 1024.0 * 1024.0))
    } else if bytes_per_sec >= 1024 * 1024 {
        format!("{:.2} MB/s", bytes_per_sec as f64 / (1024.0 * 1024.0))
    } else if bytes_per_sec >= 1024 {
        format!("{:.1} KB/s", bytes_per_sec as f64 / 1024.0)
    } else {
        format!("{} B/s", bytes_per_sec)
    }
}

pub fn format_eta(seconds: u64) -> String {
    if seconds >= 3600 {
        format!("{}h {}m", seconds / 3600, (seconds % 3600) / 60)
    } else if seconds >= 60 {
        format!("{}m {}s", seconds / 60, seconds % 60)
    } else {
        format!("{}s", seconds)
    }
}

pub async fn probe_url(client: &reqwest::Client, url: &str) -> Result<UrlMetadata, String> {
    let req = client.head(url)
        .header(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GDM/1.0.0");

    let resp = match req.send().await {
        Ok(r) if r.status().is_success() => r,
        _ => {
            // Fallback to GET with Range: bytes=0-0 if HEAD fails or is rejected
            client.get(url)
                .header(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GDM/1.0.0")
                .header(RANGE, "bytes=0-0")
                .send()
                .await
                .map_err(|e| format!("Failed to probe URL: {}", e))?
        }
    };

    let headers = resp.headers();

    // Check Accept-Ranges or 206 Partial Content
    let supports_ranges = if resp.status() == reqwest::StatusCode::PARTIAL_CONTENT {
        true
    } else if let Some(val) = headers.get(ACCEPT_RANGES) {
        val.to_str().unwrap_or("").to_lowercase().contains("bytes")
    } else {
        false
    };

    // Total content length
    let mut total_size = None;
    if let Some(cl) = headers.get(CONTENT_LENGTH) {
        if let Ok(str_val) = cl.to_str() {
            if let Ok(size) = str_val.parse::<u64>() {
                total_size = Some(size);
            }
        }
    }

    // Try Content-Range if Content-Length was 1 (from bytes=0-0 probe)
    if total_size == Some(1) || total_size.is_none() {
        if let Some(cr) = headers.get("content-range") {
            if let Ok(cr_str) = cr.to_str() {
                // e.g., bytes 0-0/1234567
                if let Some(pos) = cr_str.rfind('/') {
                    if let Ok(size) = cr_str[pos + 1..].trim().parse::<u64>() {
                        total_size = Some(size);
                    }
                }
            }
        }
    }

    // Detect filename from Content-Disposition or URL path
    let mut filename = "download.bin".to_string();
    if let Some(cd) = headers.get(CONTENT_DISPOSITION) {
        if let Ok(cd_str) = cd.to_str() {
            if let Some(idx) = cd_str.find("filename=") {
                let mut name = cd_str[idx + 9..].trim().trim_matches('"').to_string();
                if let Some(semi) = name.find(';') {
                    name = name[..semi].trim().trim_matches('"').to_string();
                }
                if !name.is_empty() {
                    filename = name;
                }
            }
        }
    }

    if filename == "download.bin" {
        if let Ok(parsed) = reqwest::Url::parse(url) {
            let path_segments: Vec<&str> = parsed.path_segments().map(|c| c.collect()).unwrap_or_default();
            if let Some(last) = path_segments.last() {
                if !last.trim().is_empty() {
                    filename = last.to_string();
                }
            }
        }
    }

    let content_type = headers.get("content-type")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let category = detect_category(&filename);

    Ok(UrlMetadata {
        url: url.to_string(),
        filename,
        total_size,
        supports_ranges,
        content_type,
        category,
    })
}

pub async fn execute_multithreaded_download(
    app: AppHandle,
    state: EngineState,
    task_id: String,
) -> Result<(), String> {
    let (url, _filename, save_path, total_bytes, mut chunk_count) = {
        let tasks = state.tasks.read().await;
        let task = tasks.get(&task_id).ok_or("Task not found")?;
        (
            task.url.clone(),
            task.filename.clone(),
            task.save_path.clone(),
            task.total_bytes,
            task.chunk_count,
        )
    };

    // If total_bytes is 0 or ranges unsupported, force single stream
    if total_bytes < 1024 * 1024 || chunk_count <= 1 {
        chunk_count = 1;
    }

    let temp_dir = std::env::temp_dir().join(format!("gdm_chunks_{}", task_id));
    fs::create_dir_all(&temp_dir).await.map_err(|e| e.to_string())?;

    // Create cancel broadcast channel
    let (cancel_tx, _cancel_rx) = broadcast::channel::<()>(4);
    let is_paused = Arc::new(AtomicBool::new(false));

    {
        let mut controls = state.controls.write().await;
        controls.insert(
            task_id.clone(),
            ActiveDownloadControl {
                cancel_sender: cancel_tx.clone(),
                is_paused: is_paused.clone(),
            },
        );
    }

    // Initialize chunks
    let chunk_size = if total_bytes > 0 {
        total_bytes / chunk_count as u64
    } else {
        0
    };

    let mut chunk_ranges: Vec<(usize, u64, u64)> = Vec::new();
    for i in 0..chunk_count {
        let start = i as u64 * chunk_size;
        let end = if i == chunk_count - 1 {
            total_bytes.saturating_sub(1)
        } else {
            (i as u64 + 1) * chunk_size - 1
        };
        chunk_ranges.push((i, start, end));
    }

    let shared_downloaded = Arc::new(AtomicU64::new(0));
    let mut chunk_join_handles = Vec::new();

    for (index, start, end) in chunk_ranges {
        let client = state.client.clone();
        let url = url.clone();
        let part_file_path = temp_dir.join(format!("chunk_{}.part", index));
        let mut chunk_cancel = cancel_tx.subscribe();
        let shared_downloaded = shared_downloaded.clone();

        let handle = tokio::spawn(async move {
            let mut file = OpenOptions::new()
                .create(true)
                .write(true)
                .read(true)
                .open(&part_file_path)
                .await
                .map_err(|e| e.to_string())?;

            let current_len = file.metadata().await.map(|m| m.len()).unwrap_or(0);
            shared_downloaded.fetch_add(current_len, Ordering::Relaxed);

            let chunk_start = start + current_len;
            if chunk_start > end && end > 0 {
                return Ok(());
            }

            let mut req = client.get(&url)
                .header(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GDM/1.0.0");

            if end > 0 {
                req = req.header(RANGE, format!("bytes={}-{}", chunk_start, end));
            }

            let mut resp = req.send().await.map_err(|e| e.to_string())?;
            if !resp.status().is_success() && resp.status() != reqwest::StatusCode::PARTIAL_CONTENT {
                return Err(format!("Chunk {} HTTP error {}", index, resp.status()));
            }

            file.seek(SeekFrom::End(0)).await.map_err(|e| e.to_string())?;

            while let Some(chunk_res) = resp.chunk().await.transpose() {
                tokio::select! {
                    _ = chunk_cancel.recv() => {
                        return Err("Cancelled".to_string());
                    }
                    res = async { chunk_res } => {
                        let bytes = res.map_err(|e| e.to_string())?;
                        file.write_all(&bytes).await.map_err(|e| e.to_string())?;
                        shared_downloaded.fetch_add(bytes.len() as u64, Ordering::Relaxed);
                    }
                }
            }

            file.flush().await.map_err(|e| e.to_string())?;
            Ok::<(), String>(())
        });

        chunk_join_handles.push(handle);
    }

    // Monitor progress loop
    let progress_task_id = task_id.clone();
    let monitor_app = app.clone();
    let monitor_state = state.clone();
    let monitor_downloaded = shared_downloaded.clone();
    let mut monitor_cancel = cancel_tx.subscribe();

    tokio::spawn(async move {
        let mut last_downloaded = monitor_downloaded.load(Ordering::Relaxed);
        let mut last_instant = Instant::now();
        let mut speed_window: Vec<u64> = Vec::new();

        loop {
            tokio::select! {
                _ = monitor_cancel.recv() => {
                    break;
                }
                _ = tokio::time::sleep(Duration::from_millis(300)) => {
                    let current_downloaded = monitor_downloaded.load(Ordering::Relaxed);
                    let now = Instant::now();
                    let elapsed = now.duration_since(last_instant).as_secs_f64();

                    let bytes_diff = current_downloaded.saturating_sub(last_downloaded);
                    let speed = if elapsed > 0.0 {
                        (bytes_diff as f64 / elapsed) as u64
                    } else {
                        0
                    };

                    last_downloaded = current_downloaded;
                    last_instant = now;

                    speed_window.push(speed);
                    if speed_window.len() > 20 {
                        speed_window.remove(0);
                    }

                    let mut tasks = monitor_state.tasks.write().await;
                    if let Some(t) = tasks.get_mut(&progress_task_id) {
                        t.downloaded_bytes = current_downloaded;
                        t.percent = if t.total_bytes > 0 {
                            ((current_downloaded as f64 / t.total_bytes as f64) * 100.0).min(100.0)
                        } else {
                            0.0
                        };
                        t.speed_bps = speed;
                        t.speed_formatted = format_speed(speed);
                        t.speed_history = speed_window.clone();

                        let remaining = t.total_bytes.saturating_sub(current_downloaded);
                        t.eta_formatted = if speed > 0 && remaining > 0 {
                            format_eta(remaining / speed)
                        } else {
                            "--".to_string()
                        };

                        let _ = monitor_app.emit("gdm://progress", t.clone());
                    } else {
                        break;
                    }
                }
            }
        }
    });

    // Await all chunks
    let mut chunk_errors = Vec::new();
    for handle in chunk_join_handles {
        match handle.await {
            Ok(Ok(())) => {}
            Ok(Err(e)) => chunk_errors.push(e),
            Err(e) => chunk_errors.push(e.to_string()),
        }
    }

    // Stop progress monitor
    let _ = cancel_tx.send(());

    if !chunk_errors.is_empty() {
        if is_paused.load(Ordering::Relaxed) {
            let mut tasks = state.tasks.write().await;
            if let Some(t) = tasks.get_mut(&task_id) {
                t.status = "paused".to_string();
                t.speed_bps = 0;
                t.speed_formatted = "0 B/s".to_string();
                let _ = app.emit("gdm://progress", t.clone());
            }
            return Ok(());
        }

        let err_msg = chunk_errors.join("; ");
        let mut tasks = state.tasks.write().await;
        if let Some(t) = tasks.get_mut(&task_id) {
            t.status = "error".to_string();
            t.error_message = Some(err_msg.clone());
            let _ = app.emit("gdm://progress", t.clone());
        }
        return Err(err_msg);
    }

    // --- IDM-Style Assembly Phase ---
    {
        let mut tasks = state.tasks.write().await;
        if let Some(t) = tasks.get_mut(&task_id) {
            t.status = "assembling".to_string();
            let _ = app.emit("gdm://progress", t.clone());
        }
    }

    let target_dest = PathBuf::from(&save_path);
    if let Some(parent) = target_dest.parent() {
        fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;
    }

    let mut dest_file = File::create(&target_dest).await.map_err(|e| e.to_string())?;
    let mut merge_buf = vec![0u8; 128 * 1024]; // 128 KB chunk merge buffer

    for i in 0..chunk_count {
        let part_file_path = temp_dir.join(format!("chunk_{}.part", i));
        if let Ok(mut part_file) = File::open(&part_file_path).await {
            loop {
                let n = part_file.read(&mut merge_buf).await.map_err(|e| e.to_string())?;
                if n == 0 { break; }
                dest_file.write_all(&merge_buf[..n]).await.map_err(|e| e.to_string())?;
            }
        }
    }

    dest_file.flush().await.map_err(|e| e.to_string())?;
    drop(dest_file);

    // Clean up temporary segment directory
    let _ = fs::remove_dir_all(&temp_dir).await;

    // Mark completed
    {
        let mut tasks = state.tasks.write().await;
        if let Some(t) = tasks.get_mut(&task_id) {
            t.status = "completed".to_string();
            t.percent = 100.0;
            t.speed_bps = 0;
            t.speed_formatted = "Done".to_string();
            t.eta_formatted = "0s".to_string();
            let _ = app.emit("gdm://completed", t.clone());
            let _ = app.emit("gdm://progress", t.clone());
        }
    }

    Ok(())
}
