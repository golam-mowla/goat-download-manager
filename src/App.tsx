import React, { useState, useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Download,
  Plus,
  Zap,
  Layers,
  Sparkles,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Radio,
} from "lucide-react";
import { Sidebar, CategoryType } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DownloadItemCard } from "./components/DownloadItemCard";
import { AddDownloadModal } from "./components/AddDownloadModal";
import { DownloadTask, MediaDownloadOptions } from "./types";

export const App: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialUrl, setModalInitialUrl] = useState("");
  const [bridgeOnline, setBridgeOnline] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);

  // Load existing tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const initialTasks = await invoke<DownloadTask[]>("get_all_downloads");
        if (Array.isArray(initialTasks)) {
          setTasks(initialTasks);
        }
      } catch (err) {
        console.error("Failed to load downloads:", err);
      }
    };
    loadTasks();
  }, []);

  // Listen to Tauri backend events
  useEffect(() => {
    // 1. Download progress event
    const unlistenProgress = listen<DownloadTask>("download-progress", (event) => {
      const updated = event.payload;
      setTasks((prev) => {
        const index = prev.findIndex((t) => t.id === updated.id);
        const now = new Date();
        const timeStr = `${now.getMinutes()}:${now.getSeconds()}`;
        const speedKb = Math.round((updated.speed_bytes_per_sec || 0) / 1024);

        if (index >= 0) {
          const current = prev[index];
          const prevHistory = current.speedHistory || [];
          const newHistory = [...prevHistory, { time: timeStr, speedKb }].slice(-20);

          const updatedList = [...prev];
          updatedList[index] = {
            ...current,
            ...updated,
            speedHistory: newHistory,
          };
          return updatedList;
        } else {
          return [
            {
              ...updated,
              speedHistory: [{ time: timeStr, speedKb }],
            },
            ...prev,
          ];
        }
      });
    });

    // 2. Download complete event
    const unlistenComplete = listen<DownloadTask>("download-complete", (event) => {
      const completed = event.payload;
      setTasks((prev) =>
        prev.map((t) => (t.id === completed.id ? { ...t, ...completed, status: "completed" } : t))
      );
    });

    // 3. Download error event
    const unlistenError = listen<{ id: string; error: string }>("download-error", (event) => {
      const { id, error } = event.payload;
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "error", error } : t))
      );
    });

    // 4. URL received from browser extension (via bridge / protocol)
    const unlistenOpenUrl = listen<string>("open-url", (event) => {
      const targetUrl = event.payload;
      if (targetUrl) {
        setModalInitialUrl(targetUrl);
        setIsAddModalOpen(true);
      }
    });

    return () => {
      unlistenProgress.then((f) => f());
      unlistenComplete.then((f) => f());
      unlistenError.then((f) => f());
      unlistenOpenUrl.then((f) => f());
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
    const interval = setInterval(checkBridge, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Download Actions
  const handlePause = async (id: string) => {
    try {
      await invoke("pause_download", { id });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "paused" } : t))
      );
    } catch (err) {
      console.error("Pause failed:", err);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await invoke("resume_download", { id });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "downloading" } : t))
      );
    } catch (err) {
      console.error("Resume failed:", err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await invoke("cancel_download", { id });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t))
      );
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await invoke("remove_download", { id });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleOpenFile = async (path: string) => {
    try {
      await invoke("open_file", { path });
    } catch (err) {
      console.error("Open file error:", err);
    }
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await invoke("open_folder", { path });
    } catch (err) {
      console.error("Open folder error:", err);
    }
  };

  const handleAddDirectDownload = async (
    url: string,
    savePath: string,
    filename: string,
    connections: number
  ) => {
    const taskId = await invoke<string>("add_direct_download", {
      url,
      savePath,
      filename: filename || null,
      connections,
    });
    // Refresh task list
    const updated = await invoke<DownloadTask[]>("get_all_downloads");
    setTasks(updated);
  };

  const handleAddMediaDownload = async (options: any) => {
    await invoke("ytdlp_download", { options });
    // Refresh task list
    const updated = await invoke<DownloadTask[]>("get_all_downloads");
    setTasks(updated);
  };

  const handleClearCompleted = () => {
    const completedIds = tasks.filter((t) => t.status === "completed").map((t) => t.id);
    completedIds.forEach((id) => invoke("remove_download", { id }).catch(() => {}));
    setTasks((prev) => prev.filter((t) => t.status !== "completed"));
  };

  // Category counts computation
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryType, number> = {
      all: tasks.length,
      video: 0,
      audio: 0,
      docs: 0,
      compressed: 0,
      programs: 0,
    };

    tasks.forEach((t) => {
      const cat = (t.category || "all").toLowerCase() as CategoryType;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
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

  // Filtered tasks for main dashboard
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Category filter
      if (selectedCategory !== "all") {
        const cat = (t.category || "").toLowerCase();
        if (cat !== selectedCategory) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (t.status !== statusFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.filename.toLowerCase().includes(q);
        const matchUrl = t.url.toLowerCase().includes(q);
        if (!matchName && !matchUrl) return false;
      }

      return true;
    });
  }, [tasks, selectedCategory, statusFilter, searchQuery]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Left Sidebar */}
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
        activeDownloadsCount={activeCount}
        bridgeOnline={bridgeOnline}
        onOpenSettings={() => setShowPreferences(true)}
        onOpenMediaModal={() => {
          setModalInitialUrl("");
          setIsAddModalOpen(true);
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Search & Actions Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          totalSpeedFormatted={totalSpeedFormatted}
          activeCount={activeCount}
          totalTasksCount={tasks.length}
          onOpenAddModal={() => {
            setModalInitialUrl("");
            setIsAddModalOpen(true);
          }}
          onClearCompleted={handleClearCompleted}
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredTasks.length === 0 ? (
            /* Empty State */
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-8 space-y-5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 rounded-full blur-xl opacity-40 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative w-28 h-28 rounded-full bg-slate-900 border border-purple-500/30 flex items-center justify-center shadow-2xl overflow-hidden">
                  <img
                    src="/goat-logo.jpg"
                    alt="Goat"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="text-5xl select-none absolute">🐐</span>
                </div>
              </div>

              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-amber-100 bg-clip-text text-transparent">
                  Goat Download Manager
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-speed 16-chunk multithreaded downloads & intelligent media stream extractor.
                  Paste any download link or use our browser extension to intercept file downloads automatically.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => {
                    setModalInitialUrl("");
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start a Download</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Download List */
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
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Download Modal */}
      <AddDownloadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultUrl={modalInitialUrl}
        onAddDirectDownload={handleAddDirectDownload}
        onAddMediaDownload={handleAddMediaDownload}
      />
    </div>
  );
};

export default App;
