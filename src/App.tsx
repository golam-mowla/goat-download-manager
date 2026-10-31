import React, { useState, useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Download,
  Plus,
  Zap,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import { Sidebar, CategoryType, StatusFilterType } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { TopBar } from "./components/TopBar";
import { DownloadTableView } from "./components/DownloadTableView";
import { DownloadItemCard } from "./components/DownloadItemCard";
import { AddDownloadModal } from "./components/AddDownloadModal";
import { PreferencesModal } from "./components/PreferencesModal";
import { IdmDownloadDialog } from "./components/IdmDownloadDialog";
import { DownloadTask } from "./types";

function cleanDownloadUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    let changed = false;
    if (u.searchParams.has("bytestart") || u.searchParams.has("byteend")) {
      u.searchParams.delete("bytestart");
      u.searchParams.delete("byteend");
      changed = true;
    }
    if (u.searchParams.has("range")) {
      u.searchParams.delete("range");
      changed = true;
    }
    return changed ? u.toString() : url;
  } catch {
    return url;
  }
}

export const App: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialUrl, setModalInitialUrl] = useState("");
  const [modalInitialFilename, setModalInitialFilename] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultDir, setDefaultDir] = useState("D:\\Downloads");
  const [bridgeOnline, setBridgeOnline] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("gdm-theme") as "dark" | "light") || "dark";
  });
  const [activePopupTask, setActivePopupTask] = useState<DownloadTask | null>(null);

  const defaultDirRef = useRef(defaultDir);
  defaultDirRef.current = defaultDir;
  const handleAddMediaDownloadRef = useRef<(options: any) => Promise<void>>(() => Promise.resolve());
  const handleAddDirectDownloadRef = useRef<(url: string, savePath: string, filename: string, connections: number) => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("gdm-theme", next);
  };

  // Load existing tasks and default download folder on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const initialTasks = await invoke<DownloadTask[]>("get_all_downloads");
        if (Array.isArray(initialTasks)) {
          setTasks(initialTasks);
          if (initialTasks.length > 0 && !selectedTaskId) {
            setSelectedTaskId(initialTasks[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load downloads:", err);
      }

      try {
        const dir = await invoke<string>("get_default_download_dir");
        if (dir) setDefaultDir(dir);
      } catch {}

      // Check if started with pending URL (e.g. via gdm:// protocol)
      try {
        const pending = await invoke<string | null>("get_pending_url");
        if (pending && typeof pending === "string" && pending.trim()) {
          setModalInitialUrl(pending.trim());
          setIsAddModalOpen(true);
        }
      } catch {}
    };
    loadInitialData();
  }, []);

  // Listen to Tauri backend events
  useEffect(() => {
    const handleProgress = (event: { payload: any }) => {
      const updated = event.payload;
      const id = updated?.id || updated?.taskId || updated?.task_id;
      if (!updated || !id) return;
      updated.id = id;
      setTasks((prev) => {
        const index = prev.findIndex((t) => t.id === updated.id);
        const now = new Date();
        const timeStr = `${now.getMinutes()}:${now.getSeconds()}`;
        const speedBps = updated.speed_bps || updated.speedBps || updated.speed_bytes_per_sec || 0;
        const speedKb = Math.round(speedBps / 1024);
        const downloadedBytes = updated.downloaded_bytes ?? updated.downloadedBytes ?? updated.downloaded ?? 0;
        const totalBytes = updated.total_bytes ?? updated.totalBytes ?? updated.total ?? 0;
        const isResumable = Boolean(updated.is_resumable ?? updated.isResumable ?? updated.supports_ranges ?? false);

        if (index >= 0) {
          const current = prev[index];
          const prevHistory = current.speedHistory || [];
          const newHistory = [...prevHistory, { time: timeStr, speedKb }].slice(-25);

          const updatedList = [...prev];
          updatedList[index] = {
            ...current,
            ...updated,
            downloaded_bytes: downloadedBytes || current.downloaded_bytes || 0,
            downloadedBytes: downloadedBytes || current.downloadedBytes || 0,
            total_bytes: totalBytes || current.total_bytes || current.totalBytes || 0,
            totalBytes: totalBytes || current.total_bytes || current.totalBytes || 0,
            is_resumable: isResumable || current.is_resumable || current.isResumable || false,
            isResumable: isResumable || current.isResumable || current.is_resumable || false,
            speed_bytes_per_sec: speedBps,
            speedBps,
            speed_formatted: updated.speed_formatted || updated.speedFormatted || updated.speed || (speedBps > 0 ? (speedBps >= 1048576 ? `${(speedBps / 1048576).toFixed(2)} MB/s` : `${(speedBps / 1024).toFixed(1)} KB/s`) : "0 B/s"),
            speedFormatted: updated.speed_formatted || updated.speedFormatted || updated.speed || (speedBps > 0 ? (speedBps >= 1048576 ? `${(speedBps / 1048576).toFixed(2)} MB/s` : `${(speedBps / 1024).toFixed(1)} KB/s`) : "0 B/s"),
            speed: updated.speed_formatted || updated.speedFormatted || updated.speed || (speedBps > 0 ? (speedBps >= 1048576 ? `${(speedBps / 1048576).toFixed(2)} MB/s` : `${(speedBps / 1024).toFixed(1)} KB/s`) : "0 B/s"),
            eta_formatted: updated.eta_formatted || updated.etaFormatted || updated.eta || "--",
            etaFormatted: updated.eta_formatted || updated.etaFormatted || updated.eta || "--",
            eta: updated.eta_formatted || updated.etaFormatted || updated.eta || "--",
            speedHistory: newHistory,
          };
          return updatedList;
        } else {
          return [
            {
              ...updated,
              downloaded_bytes: downloadedBytes,
              downloadedBytes,
              total_bytes: totalBytes,
              totalBytes,
              is_resumable: isResumable,
              isResumable,
              speed_bytes_per_sec: speedBps,
              speedBps,
              speed_formatted: updated.speed_formatted || updated.speedFormatted || updated.speed || (speedBps > 0 ? (speedBps >= 1048576 ? `${(speedBps / 1048576).toFixed(2)} MB/s` : `${(speedBps / 1024).toFixed(1)} KB/s`) : "0 B/s"),
              speedFormatted: updated.speed_formatted || updated.speedFormatted || updated.speed || (speedBps > 0 ? (speedBps >= 1048576 ? `${(speedBps / 1048576).toFixed(2)} MB/s` : `${(speedBps / 1024).toFixed(1)} KB/s`) : "0 B/s"),
              speed: updated.speed_formatted || updated.speedFormatted || updated.speed || (speedBps > 0 ? (speedBps >= 1048576 ? `${(speedBps / 1048576).toFixed(2)} MB/s` : `${(speedBps / 1024).toFixed(1)} KB/s`) : "0 B/s"),
              eta_formatted: updated.eta_formatted || updated.etaFormatted || updated.eta || "--",
              etaFormatted: updated.eta_formatted || updated.etaFormatted || updated.eta || "--",
              eta: updated.eta_formatted || updated.etaFormatted || updated.eta || "--",
              speedHistory: [{ time: timeStr, speedKb }],
            },
            ...prev,
          ];
        }
      });
    };

    // 1. Download progress event
    const unlistenProgress = listen<any>("download-progress", handleProgress);
    const unlistenGdmProgress = listen<any>("gdm://progress", handleProgress);

    // 2. Download complete event
    const handleComplete = (event: { payload: any }) => {
      const completed = event.payload;
      const id = completed?.id || completed?.taskId;
      if (!completed || !id) return;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...completed,
                status: "completed",
                total_bytes: completed.total_bytes || t.total_bytes || 0,
                totalBytes: completed.total_bytes || t.totalBytes || 0,
                downloaded_bytes: completed.downloaded_bytes || completed.total_bytes || t.downloaded_bytes || 0,
                downloadedBytes: completed.downloaded_bytes || completed.total_bytes || t.downloadedBytes || 0,
              }
            : t
        )
      );
    };
    const unlistenComplete = listen<any>("download-complete", handleComplete);
    const unlistenGdmComplete = listen<any>("gdm://completed", handleComplete);

    // 3. Download error event
    const unlistenError = listen<any>("download-error", (event) => {
      const payload = event.payload || {};
      const id = payload.id;
      const error = payload.error || "Download error";
      if (id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "error", error } : t))
        );
      }
    });

    // 4. URL received from browser extension (via bridge / protocol)
    const handleOpenUrl = (event: { payload: any }) => {
      const raw = event.payload;
      let targetUrl = "";
      let targetFilename = "";
      let targetQuality = "";
      let autoStart = false;
      if (typeof raw === "string") {
        targetUrl = raw;
      } else if (raw && typeof raw === "object" && raw.url) {
        targetUrl = String(raw.url);
        if (raw.filename) {
          targetFilename = String(raw.filename);
        }
        if (raw.quality) {
          targetQuality = String(raw.quality);
        }
        if (raw.autoStart || raw.autostart) {
          autoStart = true;
        }
      }
      if (targetUrl && targetUrl.trim()) {
        const clean = cleanDownloadUrl(targetUrl.trim());
        if (autoStart) {
          const lower = clean.toLowerCase();
          const isDirectFile =
            (lower.endsWith(".zip") ||
              lower.endsWith(".rar") ||
              lower.endsWith(".7z") ||
              lower.endsWith(".tar") ||
              lower.endsWith(".gz") ||
              lower.endsWith(".iso") ||
              lower.endsWith(".exe") ||
              lower.endsWith(".msi") ||
              lower.endsWith(".pdf") ||
              lower.endsWith(".dmg")) &&
            !targetQuality;

          if (isDirectFile) {
            handleAddDirectDownloadRef.current(
              clean,
              defaultDirRef.current,
              targetFilename,
              16
            );
          } else {
            const isAudio = targetQuality.toLowerCase().includes("audio");
            let videoStreamId = "bv*";
            if (targetQuality.includes("1080")) {
              videoStreamId = "bv*[height<=1080]";
            } else if (targetQuality.includes("720")) {
              videoStreamId = "bv*[height<=720]";
            } else if (targetQuality.includes("480")) {
              videoStreamId = "bv*[height<=480]";
            } else if (targetQuality.includes("360")) {
              videoStreamId = "bv*[height<=360]";
            } else if (targetQuality.includes("240")) {
              videoStreamId = "bv*[height<=240]";
            } else if (targetQuality.includes("144")) {
              videoStreamId = "bv*[height<=144]";
            }

            handleAddMediaDownloadRef.current({
              url: clean,
              saveFolder: defaultDirRef.current,
              customFilename: targetFilename || undefined,
              downloadMode: isAudio ? "audio" : "video",
              container: isAudio ? "MP3 (Audio)" : "MP4 (Video)",
              videoStreamId: isAudio ? "" : videoStreamId,
              audioStreamId: "ba",
              audioBitrate: "Best",
              enableSubtitles: false,
              subtitleLang: "en",
              subtitleFormat: "srt",
              subtitleSaveMode: "separate",
              enableClip: false,
              startTime: "",
              endTime: "",
              preciseCut: false,
              maxActiveDownloads: 3,
              overwriteFiles: false,
              includeMediaId: false,
              includeAutoSubtitles: false,
              includeSuperRes: false,
              preferredVideoCodec: "default",
              preferredAudioCodec: "default",
              preferredSubtitleFormat: "default",
              preferredFps: "default",
              usePartFiles: true,
              concurrentConnections: 8,
            });
          }
        } else {
          setModalInitialUrl(clean);
          setModalInitialFilename(targetFilename.trim());
          setIsAddModalOpen(true);
        }
      }
    };
    const unlistenOpenUrl = listen<any>("open-url", handleOpenUrl);
    const unlistenGdmOpenUrl = listen<any>("gdm://open-url", handleOpenUrl);

    return () => {
      unlistenProgress.then((f) => f());
      unlistenGdmProgress.then((f) => f());
      unlistenComplete.then((f) => f());
      unlistenGdmComplete.then((f) => f());
      unlistenError.then((f) => f());
      unlistenOpenUrl.then((f) => f());
      unlistenGdmOpenUrl.then((f) => f());
    };
  }, []);

  // Check local bridge status periodically
  useEffect(() => {
    const checkBridge = async () => {
      try {
        const resp = await fetch("http://127.0.0.1:9666/ping");
        setBridgeOnline(resp.ok);
      } catch {
        setBridgeOnline(false);
      }
    };
    checkBridge();
    const interval = setInterval(checkBridge, 4000);
    return () => clearInterval(interval);
  }, []);

  // IDM Action Handlers
  const handlePause = async (id: string) => {
    try {
      await invoke("pause_http_download", { taskId: id });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "paused" } : t))
      );
    } catch (err) {
      console.error("Pause failed:", err);
    }
  };

  const handleResume = async (id: string) => {
    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: "downloading", error: undefined, errorMessage: undefined }
            : t
        )
      );
      await invoke("resume_http_download", { taskId: id });
    } catch (err) {
      console.error("Resume failed:", err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await invoke("cancel_http_download", { taskId: id });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t))
      );
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await invoke("remove_http_download", { taskId: id, deleteFile: false });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTaskId === id) setSelectedTaskId(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleStopAll = async () => {
    tasks.forEach((t) => {
      if (t.status === "downloading") {
        invoke("pause_http_download", { taskId: t.id }).catch(() => {});
      }
    });
    setTasks((prev) =>
      prev.map((t) => (t.status === "downloading" ? { ...t, status: "paused" } : t))
    );
  };

  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter((t) => t.status === "completed");
    for (const t of completedTasks) {
      await invoke("remove_http_download", { taskId: t.id, deleteFile: false }).catch(() => {});
    }
    setTasks((prev) => prev.filter((t) => t.status !== "completed"));
    if (selectedTaskId && completedTasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  };

  const handleOpenFile = async (path: string) => {
    try {
      await invoke("open_file", { path });
    } catch (err) {
      console.error("Open file error, attempting fallback to open_folder:", err);
      try {
        await invoke("open_folder", { path });
      } catch {}
    }
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await invoke("open_folder", { path });
    } catch (err) {
      console.error("Open folder error:", err);
    }
  };

  const handleOpenDefaultFolder = async () => {
    if (defaultDir) {
      handleOpenFolder(defaultDir);
    }
  };

  const currentPopupTask = useMemo(() => {
    if (!activePopupTask) return null;
    return tasks.find((t) => t.id === activePopupTask.id) || activePopupTask;
  }, [tasks, activePopupTask]);

  const handleAddDirectDownload = async (
    url: string,
    savePath: string,
    filename: string,
    connections: number
  ) => {
    try {
      const taskId = await invoke<string>("start_http_download", {
        url,
        saveFolder: savePath || null,
        filename: filename || null,
        chunkCount: connections,
      });
      const updated = await invoke<DownloadTask[]>("get_all_downloads");
      setTasks(updated);
      if (taskId) {
        const created = updated.find((t) => t.id === taskId);
        if (created) setActivePopupTask(created);
      }
    } catch (e) {
      console.error("Direct download failed to start:", e);
    }
  };

  const handleAddMediaDownload = async (options: any) => {
    try {
      let taskId = "";
      try {
        taskId = await invoke<string>("ytdlp_download", { options });
      } catch {
        taskId = await invoke<string>("start_download", { options });
      }

      const isAudio =
        options.downloadMode === "audio" ||
        (options.container && String(options.container).toLowerCase().includes("audio"));

      const newMediaTask: DownloadTask = {
        id: taskId || `ytdlp-${Date.now()}`,
        url: options.url,
        filename: options.customFilename?.trim() || options.title?.trim() || "Online Media (yt-dlp)",
        save_path: options.saveFolder || defaultDir || "Downloads",
        total_bytes: 0,
        downloaded_bytes: 0,
        percent: 1.0,
        speed_bps: 0,
        speed_formatted: "Connecting...",
        eta_formatted: "--",
        status: "downloading",
        category: isAudio ? "audio" : "video",
        chunk_count: 1,
        is_resumable: true,
        chunks: [],
        speedHistory: [],
        errorMessage: undefined,
        createdAt: new Date().toLocaleTimeString(),
      };

      setTasks((prev) => [newMediaTask, ...prev.filter((t) => t.id !== newMediaTask.id)]);
      setActivePopupTask(newMediaTask);
    } catch (e) {
      console.error("Media download failed to start:", e);
    }
  };

  useEffect(() => {
    handleAddDirectDownloadRef.current = handleAddDirectDownload;
    handleAddMediaDownloadRef.current = handleAddMediaDownload;
    defaultDirRef.current = defaultDir;
  });

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryType, number> = {
      all: tasks.length,
      compressed: 0,
      docs: 0,
      audio: 0,
      programs: 0,
      video: 0,
    };
    tasks.forEach((t) => {
      const cat = (t.category || "docs").toLowerCase() as CategoryType;
      if (counts[cat] !== undefined) counts[cat]++;
    });
    return counts;
  }, [tasks]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilterType, number> = {
      all: tasks.length,
      downloading: 0,
      completed: 0,
      paused: 0,
      error: 0,
    };
    tasks.forEach((t) => {
      const st = t.status as StatusFilterType;
      if (counts[st] !== undefined) counts[st]++;
    });
    return counts;
  }, [tasks]);

  // Overall speed and active count
  const { totalSpeedFormatted, activeCount } = useMemo(() => {
    let totalBytesPerSec = 0;
    let count = 0;
    tasks.forEach((t) => {
      if (t.status === "downloading") {
        totalBytesPerSec += t.speed_bytes_per_sec || 0;
        count++;
      }
    });

    let formatted = "0 B/s";
    if (totalBytesPerSec >= 1024 * 1024 * 1024) {
      formatted = `${(totalBytesPerSec / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
    } else if (totalBytesPerSec >= 1024 * 1024) {
      formatted = `${(totalBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    } else if (totalBytesPerSec >= 1024) {
      formatted = `${(totalBytesPerSec / 1024).toFixed(0)} KB/s`;
    } else if (totalBytesPerSec > 0) {
      formatted = `${totalBytesPerSec} B/s`;
    }

    return { totalSpeedFormatted: formatted, activeCount: count };
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedCategory !== "all") {
        const cat = (t.category || "").toLowerCase();
        if (cat !== selectedCategory) return false;
      }
      if (selectedStatus !== "all") {
        if (t.status !== selectedStatus) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.filename.toLowerCase().includes(q);
        const matchUrl = t.url.toLowerCase().includes(q);
        if (!matchName && !matchUrl) return false;
      }
      return true;
    });
  }, [tasks, selectedCategory, selectedStatus, searchQuery]);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const isDark = theme === "dark";

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-gdm-app text-gdm-primary transition-colors duration-150">
      {/* Left Sidebar (IDM Category Tree + Status) */}
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        categoryCounts={categoryCounts}
        statusCounts={statusCounts}
        bridgeOnline={bridgeOnline}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMediaModal={() => {
          setModalInitialUrl("");
          setModalInitialFilename("");
          setIsAddModalOpen(true);
        }}
        theme={theme}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top IDM Action Ribbon / Toolbar */}
        <Toolbar
          onAddUrl={() => {
            setModalInitialUrl("");
            setModalInitialFilename("");
            setIsAddModalOpen(true);
          }}
          onResumeSelected={() => selectedTaskId && handleResume(selectedTaskId)}
          onPauseSelected={() => selectedTaskId && handlePause(selectedTaskId)}
          onStopAll={handleStopAll}
          onDeleteSelected={() => selectedTaskId && handleDelete(selectedTaskId)}
          onClearCompleted={handleClearCompleted}
          onOpenMediaGrabber={() => {
            setModalInitialUrl("");
            setModalInitialFilename("");
            setIsAddModalOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenDefaultFolder={handleOpenDefaultFolder}
          hasSelected={Boolean(selectedTaskId)}
          hasActive={activeCount > 0}
          hasCompleted={statusCounts.completed > 0}
          theme={theme}
        />

        {/* Top Search, Status & View Toggle Bar */}
        <div className="px-5 py-2.5 border-b border-gdm bg-gdm-surface flex items-center justify-between gap-4 z-10 select-none transition-colors">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <TopBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={selectedStatus}
              onStatusFilterChange={(st) => setSelectedStatus(st as StatusFilterType)}
              totalSpeedFormatted={totalSpeedFormatted}
              activeCount={activeCount}
              totalTasksCount={tasks.length}
              onOpenAddModal={() => {
                setModalInitialUrl("");
                setModalInitialFilename("");
                setIsAddModalOpen(true);
              }}
              onClearCompleted={handleClearCompleted}
              theme={theme}
              onToggleTheme={handleToggleTheme}
            />
          </div>

          {/* View Mode Toggle (Table / Card) */}
          <div className="flex items-center space-x-1 p-1 rounded-xl border border-gdm bg-gdm-surface transition-colors">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gdm-secondary hover:text-gdm-primary"
              }`}
              title="Classic IDM Table View"
              aria-label="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "cards"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gdm-secondary hover:text-gdm-primary"
              }`}
              title="Modern Card View"
              aria-label="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 space-y-4">
          {filteredTasks.length === 0 ? (
            /* Empty State */
            <div className="h-[65vh] flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-lg bg-transparent">
                <img
                  src="/icon.png"
                  alt="Goat"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-bold text-gdm-primary">
                  Goat Download Manager (GDM)
                </h2>
                <p className="text-[13px] leading-relaxed text-gdm-secondary">
                  High-speed 16-segment HTTP download acceleration & all-in-one social media stream extractor.
                  Paste any download link above or use the browser extension to intercept downloads.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setModalInitialUrl("");
                      setModalInitialFilename("");
                      setIsAddModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] shadow-xs transition-colors inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Download</span>
                  </button>
                </div>
              </div>
            </div>
          ) : viewMode === "table" ? (
            /* IDM High-Density Table View */
            <DownloadTableView
              tasks={filteredTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={(id) => {
                setSelectedTaskId(id);
                const task = tasks.find((t) => t.id === id);
                if (task) setActivePopupTask(task);
              }}
              onPause={handlePause}
              onResume={handleResume}
              onDelete={handleDelete}
              onOpenFile={handleOpenFile}
              onOpenFolder={handleOpenFolder}
              theme={theme}
            />
          ) : (
            /* Card View */
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <DownloadItemCard
                  key={task.id}
                  task={task}
                  onPause={handlePause}
                  onResume={handleResume}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  onOpenFile={handleOpenFile}
                  onOpenFolder={handleOpenFolder}
                  theme={theme}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* IDM Style Download Dialog / Popup Window */}
      {currentPopupTask && (
        <IdmDownloadDialog
          task={currentPopupTask}
          isOpen={Boolean(currentPopupTask)}
          onClose={() => setActivePopupTask(null)}
          onPause={handlePause}
          onResume={handleResume}
          onCancel={handleCancel}
          onOpenFile={handleOpenFile}
          onOpenFolder={handleOpenFolder}
          theme={theme}
        />
      )}

      {/* Add Download Modal */}
      <AddDownloadModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setModalInitialUrl("");
          setModalInitialFilename("");
        }}
        defaultUrl={modalInitialUrl}
        defaultFilename={modalInitialFilename}
        onAddDirectDownload={handleAddDirectDownload}
        onAddMediaDownload={handleAddMediaDownload}
        theme={theme}
      />

      {/* Preferences / Settings Modal */}
      <PreferencesModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultDir={defaultDir}
        onChangeDefaultDir={setDefaultDir}
        theme={theme}
      />
    </div>
  );
};

export default App;
