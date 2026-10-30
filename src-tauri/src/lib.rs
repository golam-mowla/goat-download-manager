pub mod downloader;
pub mod media;
pub mod queue;

use downloader::{DownloadTask, EngineState, UrlMetadata};
use media::{AppUrlState, DownloadState};
use serde_json::json;
use std::collections::HashMap;
use std::env;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{command, AppHandle, Emitter, Manager, State};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use std::process::Command;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

// ---------------------------------------------------------------------------
// HTTP Downloader Commands
// ---------------------------------------------------------------------------

#[command]
async fn probe_http_url(
    state: State<'_, EngineState>,
    url: String,
) -> Result<UrlMetadata, String> {
    downloader::probe_url(&state.client, &url).await
}

#[command]
async fn start_http_download(
    app: AppHandle,
    state: State<'_, EngineState>,
    url: String,
    filename: Option<String>,
    save_folder: Option<String>,
    chunk_count: Option<usize>,
) -> Result<String, String> {
    let meta = downloader::probe_url(&state.client, &url).await.unwrap_or(UrlMetadata {
        url: url.clone(),
        filename: "download.bin".to_string(),
        total_size: None,
        supports_ranges: false,
        content_type: None,
        category: "docs".to_string(),
    });

    let resolved_name = filename
        .filter(|n| !n.trim().is_empty())
        .unwrap_or(meta.filename);

    let resolved_folder = save_folder
        .filter(|f| !f.trim().is_empty())
        .unwrap_or_else(|| {
            dirs_or_default_downloads()
        });

    let save_path = PathBuf::from(&resolved_folder).join(&resolved_name).to_string_lossy().to_string();
    let total_bytes = meta.total_size.unwrap_or(0);
    let chunks = chunk_count.unwrap_or(if meta.supports_ranges && total_bytes > 2 * 1024 * 1024 { 8 } else { 1 });
    let category = downloader::detect_category(&resolved_name);

    let task_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let task = DownloadTask {
        id: task_id.clone(),
        url,
        filename: resolved_name,
        save_path,
        total_bytes,
        downloaded_bytes: 0,
        percent: 0.0,
        speed_bps: 0,
        speed_formatted: "0 B/s".to_string(),
        eta_formatted: "--".to_string(),
        status: "queued".to_string(),
        category,
        chunk_count: chunks,
        chunks: Vec::new(),
        speed_history: Vec::new(),
        error_message: None,
        created_at: now,
    };

    queue::enqueue_download(app, state.inner().clone(), task).await
}

#[command]
async fn pause_http_download(
    app: AppHandle,
    state: State<'_, EngineState>,
    task_id: String,
) -> Result<(), String> {
    queue::pause_download(app, state.inner().clone(), task_id).await
}

#[command]
async fn resume_http_download(
    app: AppHandle,
    state: State<'_, EngineState>,
    task_id: String,
) -> Result<(), String> {
    queue::resume_download(app, state.inner().clone(), task_id).await
}

#[command]
async fn cancel_http_download(
    app: AppHandle,
    state: State<'_, EngineState>,
    task_id: String,
) -> Result<(), String> {
    queue::cancel_download(app, state.inner().clone(), task_id).await
}

#[command]
async fn remove_http_download(
    app: AppHandle,
    state: State<'_, EngineState>,
    task_id: String,
    delete_file: Option<bool>,
) -> Result<(), String> {
    queue::remove_download(app, state.inner().clone(), task_id, delete_file.unwrap_or(false)).await
}

#[command]
async fn get_all_downloads(
    state: State<'_, EngineState>,
) -> Result<Vec<DownloadTask>, String> {
    let tasks = state.tasks.read().await;
    let mut list: Vec<DownloadTask> = tasks.values().cloned().collect();
    list.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(list)
}

#[command]
fn get_default_download_dir() -> String {
    dirs_or_default_downloads()
}

fn dirs_or_default_downloads() -> String {
    #[cfg(target_os = "windows")]
    {
        if let Ok(user_profile) = env::var("USERPROFILE") {
            let path = PathBuf::from(user_profile).join("Downloads");
            if path.exists() {
                return path.to_string_lossy().to_string();
            }
        }
    }

    if let Ok(home) = env::var("HOME") {
        let path = PathBuf::from(home).join("Downloads");
        if path.exists() {
            return path.to_string_lossy().to_string();
        }
    }

    env::temp_dir().to_string_lossy().to_string()
}

// ---------------------------------------------------------------------------
// Protocol & Local Bridge Server (for Browser Extension Interception)
// ---------------------------------------------------------------------------

fn decode_percent_encoded(input: &str) -> String {
    let mut bytes = Vec::new();
    let mut chars = input.bytes();
    while let Some(b) = chars.next() {
        if b == b'%' {
            let h1 = chars.next();
            let h2 = chars.next();
            if let (Some(h1), Some(h2)) = (h1, h2) {
                let hex_str = [h1, h2];
                if let Ok(hex_str) = std::str::from_utf8(&hex_str) {
                    if let Ok(val) = u8::from_str_radix(hex_str, 16) {
                        bytes.push(val);
                        continue;
                    }
                }
                bytes.push(b'%');
                bytes.push(h1);
                bytes.push(h2);
            } else {
                bytes.push(b'%');
            }
        } else if b == b'+' {
            bytes.push(b' ');
        } else {
            bytes.push(b);
        }
    }
    String::from_utf8_lossy(&bytes).into_owned()
}

async fn start_local_bridge(app_handle: AppHandle) {
    let mut listener = None;
    for _ in 0..15 {
        match tokio::net::TcpListener::bind("127.0.0.1:9666").await {
            Ok(l) => {
                listener = Some(l);
                break;
            }
            Err(_) => {
                tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
            }
        }
    }

    let listener = match listener {
        Some(l) => l,
        None => {
            eprintln!("GDM: Could not bind local bridge port 9666 after retries");
            return;
        }
    };

    loop {
        if let Ok((mut stream, _)) = listener.accept().await {
            let handle = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                use tokio::io::{AsyncReadExt, AsyncWriteExt};
                let mut buf = [0u8; 4096];
                if let Ok(n) = stream.read(&mut buf).await {
                    let req_str = String::from_utf8_lossy(&buf[..n]);

                    if req_str.starts_with("OPTIONS") {
                        let resp = "HTTP/1.1 204 No Content\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: *\r\nConnection: close\r\n\r\n";
                        let _ = stream.write_all(resp.as_bytes()).await;
                        return;
                    }

                    if req_str.contains("/ping") {
                        let resp = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"status\":\"alive\",\"app\":\"Goat Download Manager\",\"version\":\"1.0.0\"}\r\n";
                        let _ = stream.write_all(resp.as_bytes()).await;
                        return;
                    }

                    let mut target_url = None;
                    if let Some(idx) = req_str.find("/open?url=") {
                        let sub = &req_str[idx + 10..];
                        let end_idx = sub.find(|c: char| c == ' ' || c == '\r' || c == '\n').unwrap_or(sub.len());
                        let raw = &sub[..end_idx];
                        target_url = Some(decode_percent_encoded(raw));
                    }

                    if let Some(url) = target_url {
                        let clean = url.trim().to_string();
                        if !clean.is_empty() {
                            let _ = handle.emit("open-url", clean.clone());
                            let _ = handle.emit("gdm://open-url", clean.clone());
                            if let Some(win) = handle.get_webview_window("main") {
                                let _ = win.unminimize();
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                        let body = "{\"status\":\"ok\",\"received\":true,\"app\":\"GDM\"}";
                        let resp = format!(
                            "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                            body.len(),
                            body
                        );
                        let _ = stream.write_all(resp.as_bytes()).await;
                    } else {
                        let body = "{\"error\":\"missing_url\"}";
                        let resp = format!(
                            "HTTP/1.1 400 Bad Request\r\nAccess-Control-Allow-Origin: *\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                            body.len(),
                            body
                        );
                        let _ = stream.write_all(resp.as_bytes()).await;
                    }
                }
            });
        }
    }
}

#[cfg(target_os = "windows")]
fn register_windows_protocols() {
    if let Ok(exe_path) = env::current_exe() {
        let exe_str = exe_path.to_string_lossy();
        let cmd = format!("\"{}\" \"%1\"", exe_str);

        // Register gdm:// protocol
        let _ = Command::new("reg")
            .args(["add", "HKCU\\Software\\Classes\\gdm", "/ve", "/d", "URL:Goat Download Manager Protocol", "/f"])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
        let _ = Command::new("reg")
            .args(["add", "HKCU\\Software\\Classes\\gdm", "/v", "URL Protocol", "/d", "", "/f"])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
        let _ = Command::new("reg")
            .args(["add", "HKCU\\Software\\Classes\\gdm\\shell\\open\\command", "/ve", "/d", &cmd, "/f"])
            .creation_flags(CREATE_NO_WINDOW)
            .status();

        // Also register parrot:// for backward compatibility with the extension
        let _ = Command::new("reg")
            .args(["add", "HKCU\\Software\\Classes\\parrot", "/ve", "/d", "URL:Parrot Protocol", "/f"])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
        let _ = Command::new("reg")
            .args(["add", "HKCU\\Software\\Classes\\parrot", "/v", "URL Protocol", "/d", "", "/f"])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
        let _ = Command::new("reg")
            .args(["add", "HKCU\\Software\\Classes\\parrot\\shell\\open\\command", "/ve", "/d", &cmd, "/f"])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
    }
}

#[command]
fn get_pending_url(state: State<'_, AppUrlState>) -> Option<String> {
    let mut lock = state.pending_url.lock().ok()?;
    lock.take()
}

#[command]
async fn ytdlp_get_info(url: String) -> Result<media::MediaInfo, String> {
    media::fetch_media_info(url, None, None, None, None).await
}

#[command]
async fn ytdlp_download(
    app: AppHandle,
    state: State<'_, DownloadState>,
    options: media::DownloadOptions,
) -> Result<String, String> {
    media::start_download(app, state, options).await
}

// ---------------------------------------------------------------------------
// App Entrypoint
// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut pending_arg_url = None;
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 {
        for arg in &args[1..] {
            let trimmed = arg.trim();
            if trimmed.starts_with("gdm://") || trimmed.starts_with("parrot://") || trimmed.starts_with("gmdownloader://") {
                let without_proto = if trimmed.starts_with("gdm://") {
                    &trimmed["gdm://".len()..]
                } else if trimmed.starts_with("parrot://") {
                    &trimmed["parrot://".len()..]
                } else {
                    &trimmed["gmdownloader://".len()..]
                };
                let mut extracted = without_proto;
                if let Some(pos) = extracted.find("open?url=") {
                    extracted = &extracted[pos + 9..];
                } else if let Some(pos) = extracted.find("?url=") {
                    extracted = &extracted[pos + 5..];
                }
                let dec = decode_percent_encoded(extracted);
                if !dec.trim().is_empty() {
                    pending_arg_url = Some(dec.trim().to_string());
                    break;
                }
            } else if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
                pending_arg_url = Some(trimmed.to_string());
                break;
            }
        }
    }

    if let Some(ref url) = pending_arg_url {
        if let Ok(addr) = "127.0.0.1:9666".parse() {
            if let Ok(mut stream) = std::net::TcpStream::connect_timeout(
                &addr,
                std::time::Duration::from_millis(300),
            ) {
                use std::io::Write;
                let req = format!(
                    "GET /open?url={} HTTP/1.1\r\nHost: 127.0.0.1:9666\r\nConnection: close\r\n\r\n",
                    url
                );
                let _ = stream.write_all(req.as_bytes());
                std::process::exit(0);
            }
        }
    }

    tauri::Builder::default()
        .manage(DownloadState {
            active_pids: Arc::new(Mutex::new(HashMap::new())),
            cancelled_tasks: Arc::new(Mutex::new(HashMap::new())),
        })
        .manage(AppUrlState {
            pending_url: Arc::new(Mutex::new(pending_arg_url)),
        })
        .manage(EngineState::new())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(target_os = "windows")]
            register_windows_protocols();

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_local_bridge(handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // HTTP Downloader Commands
            probe_http_url,
            start_http_download,
            pause_http_download,
            resume_http_download,
            cancel_http_download,
            remove_http_download,
            get_all_downloads,
            get_default_download_dir,
            // Media Downloader Commands
            media::fetch_media_info,
            media::start_download,
            media::cancel_download,
            media::check_tool_updates,
            media::update_tool,
            media::open_folder,
            media::install_app_update,
            get_pending_url,
            ytdlp_get_info,
            ytdlp_download
        ])
        .run(tauri::generate_context!())
        .expect("error while running Goat Download Manager");
}
