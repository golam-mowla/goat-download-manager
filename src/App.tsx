import React, { useState, useEffect, useMemo } from "react";
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
import { DownloadTask } from "./types";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultDir, setDefaultDir] = useState("D:\\Downloads");
  const [bridgeOnline, setBridgeOnline] = useState(true);

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
    };
    loadInitialData();
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
          const newHistory = [...prevHistory, { time: timeStr, speedKb }].slice(-25);

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
      await invoke("resume_http_download", { taskId: id });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "downloading" } : t))
      );
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

  const handleOpenDefaultFolder = async () => {
    if (defaultDir) {
      handleOpenFolder(defaultDir);
    }
  };

  const handleAddDirectDownload = async (
    url: string,
    savePath: string,
    filename: string,
    connections: number
  ) => {
    await invoke<string>("start_http_download", {
      url,
      saveFolder: savePath || null,
      filename: filename || null,
      chunkCount: connections,
    });
    const updated = await invoke<DownloadTask[]>("get_all_downloads");
    setTasks(updated);
  };

  const handleAddMediaDownload = async (options: any) => {
    await invoke("ytdlp_download", { options });
    const updated = await invoke<DownloadTask[]>("get_all_downloads");
    setTasks(updated);
  };

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
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
          setIsAddModalOpen(true);
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top IDM Action Ribbon / Toolbar */}
        <Toolbar
          onAddUrl={() => {
            setModalInitialUrl("");
            setIsAddModalOpen(true);
          }}
          onResumeSelected={() => selectedTaskId && handleResume(selectedTaskId)}
          onPauseSelected={() => selectedTaskId && handlePause(selectedTaskId)}
          onStopAll={handleStopAll}
          onDeleteSelected={() => selectedTaskId && handleDelete(selectedTaskId)}
          onClearCompleted={handleClearCompleted}
          onOpenMediaGrabber={() => {
            setModalInitialUrl("");
            setIsAddModalOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenDefaultFolder={handleOpenDefaultFolder}
          hasSelected={Boolean(selectedTaskId)}
          hasActive={activeCount > 0}
          hasCompleted={statusCounts.completed > 0}
        />

        {/* Top Search, Status & View Toggle Bar */}
        <div className="px-5 py-2.5 glass-panel border-b border-purple-500/15 flex items-center justify-between gap-4 z-10 select-none">
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
                setIsAddModalOpen(true);
              }}
              onClearCompleted={handleClearCompleted}
            />
          </div>

          {/* View Mode Toggle (Table / Card) */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900/90 border border-purple-500/20">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Classic IDM Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "cards"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Modern Card View"
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
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition duration-500"></div>
                <div className="relative w-24 h-24 rounded-full bg-slate-900 border border-purple-500/35 flex items-center justify-center shadow-2xl overflow-hidden">
                  <img
                    src="/goat-logo.jpg"
                    alt="Goat"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="text-4xl select-none absolute">🐐</span>
                </div>
              </div>

              <div className="max-w-md space-y-1.5">
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-amber-100 bg-clip-text text-transparent">
                  Goat Download Manager (GDM)
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-speed 16-segment HTTP download acceleration & all-in-one social media stream extractor.
                  Paste any download link above or use the browser extension to intercept downloads.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <button
                  onClick={() => {
                    setModalInitialUrl("");
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Download</span>
                </button>
              </div>
            </div>
          ) : viewMode === "table" ? (
            /* IDM High-Density Table View */
            <DownloadTableView
              tasks={filteredTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onPause={handlePause}
              onResume={handleResume}
              onDelete={handleDelete}
              onOpenFile={handleOpenFile}
              onOpenFolder={handleOpenFolder}
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

      {/* Preferences / Settings Modal */}
      <PreferencesModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultDir={defaultDir}
        onChangeDefaultDir={setDefaultDir}
      />
    </div>
  );
};

export default App;
