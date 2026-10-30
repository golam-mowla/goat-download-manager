import React from "react";
import {
  X,
  Minus,
  Play,
  Pause,
  FolderOpen,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  HardDrive,
  Cpu,
} from "lucide-react";
import {
  DownloadTask,
  formatBytes,
  getDownloadedBytes,
  getTotalBytes,
  getChunkCount,
  getIsResumable,
} from "../types";

interface IdmDownloadDialogProps {
  task: DownloadTask;
  isOpen: boolean;
  onClose: () => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onOpenFile: (path: string) => void;
  onOpenFolder: (path: string) => void;
  theme?: "dark" | "light";
}

export const IdmDownloadDialog: React.FC<IdmDownloadDialogProps> = ({
  task,
  isOpen,
  onClose,
  onPause,
  onResume,
  onCancel,
  onOpenFile,
  onOpenFolder,
  theme = "dark",
}) => {
  if (!isOpen) return null;

  const isDark = theme === "dark";
  const downloaded = getDownloadedBytes(task);
  const total = getTotalBytes(task);
  const isResumable = getIsResumable(task);
  const chunkCount = getChunkCount(task);
  const isDownloading = task.status === "downloading";
  const isPaused = task.status === "paused";
  const isCompleted = task.status === "completed";
  const isError = task.status === "error";

  const percent = task.percent > 0 ? task.percent : total > 0 ? (downloaded / total) * 100 : 0;
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100 select-none">
      <div
        className={`w-full max-w-lg rounded-xl shadow-2xl border overflow-hidden transition-colors ${
          isDark
            ? "bg-[#131d2e] border-[#253350] text-slate-100"
            : "bg-white border-slate-300 text-slate-800"
        }`}
      >
        {/* IDM Style Titlebar */}
        <div
          className={`flex items-center justify-between px-3.5 py-2 border-b select-none ${
            isDark
              ? "bg-[#1a263d] border-[#253350] text-slate-200"
              : "bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300 text-slate-700"
          }`}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-base">🐐</span>
            <span className="font-bold text-xs truncate">
              {isCompleted
                ? `Download Complete - ${task.filename}`
                : isError
                ? `Download Error - ${task.filename}`
                : `${clampedPercent.toFixed(1)}% of ${task.filename}`}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-black/10 transition-colors ${
                isDark ? "hover:bg-white/10 text-slate-400" : "text-slate-600"
              }`}
              title="Minimize to main window"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-rose-500 hover:text-white transition-colors ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
              title="Close dialog"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5">
          {/* File Name & URL */}
          <div
            className={`p-3 rounded-lg border text-xs space-y-1.5 ${
              isDark ? "bg-[#0d1424] border-[#253350]" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                File Name:
              </span>
              <span className="font-semibold truncate text-right flex-1" title={task.filename}>
                {task.filename}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                URL:
              </span>
              <span
                className={`truncate font-mono text-[11px] text-right flex-1 ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
                title={task.url}
              >
                {task.url}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div
            className={`grid grid-cols-2 gap-2 p-3 rounded-lg border text-xs ${
              isDark ? "bg-[#0d1424] border-[#253350]" : "bg-slate-50 border-slate-200"
            }`}
          >
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Status:
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
                  isCompleted
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : isError
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : isPaused
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                }`}
              >
                {task.status}
              </span>
            </div>

            {/* Resume Capability */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Resume capability:
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isResumable
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                {isResumable ? "Yes" : "No"}
              </span>
            </div>

            {/* File Size */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                File size:
              </span>
              <span className="font-mono font-semibold">
                {total > 0 ? formatBytes(total) : "Unknown"}
              </span>
            </div>

            {/* Downloaded */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Downloaded:
              </span>
              <span className="font-mono font-semibold text-emerald-400">
                {formatBytes(downloaded)}
              </span>
            </div>

            {/* Transfer Rate */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Transfer rate:
              </span>
              <span className="font-mono font-bold text-yellow-400 flex items-center space-x-1">
                <Zap className="w-3 h-3 fill-current inline" />
                <span>{task.speed_formatted || "0 B/s"}</span>
              </span>
            </div>

            {/* Time Left */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Time left:
              </span>
              <span className="font-mono font-semibold">
                {task.eta_formatted || "--"}
              </span>
            </div>
          </div>

          {/* Main Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span>{clampedPercent.toFixed(1)}%</span>
              <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                {formatBytes(downloaded)} of {total > 0 ? formatBytes(total) : "Unknown"}
              </span>
            </div>
            <div
              className={`h-4 w-full rounded-md overflow-hidden border p-0.5 ${
                isDark ? "bg-[#0d1424] border-[#253350]" : "bg-slate-200 border-slate-300"
              }`}
            >
              <div
                className={`h-full rounded transition-all duration-200 ${
                  isCompleted
                    ? "bg-emerald-500"
                    : isError
                    ? "bg-rose-500"
                    : isPaused
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 animate-pulse"
                }`}
                style={{ width: `${clampedPercent}%` }}
              />
            </div>
          </div>

          {/* Segmented Thread Visualizer (IDM Style 8-16 Chunk Bars) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                Segmented Connection:
              </span>
              <span className="text-blue-400 font-mono font-bold">
                {chunkCount} Parallel Streams
              </span>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
              {Array.from({ length: Math.max(1, chunkCount) }).map((_, i) => {
                const chunkPercent = isCompleted ? 100 : Math.min(100, Math.max(0, clampedPercent + (i % 3) * 5));
                return (
                  <div
                    key={i}
                    className={`h-3 rounded-xs border overflow-hidden ${
                      isDark ? "bg-[#0a0f1d] border-[#253350]" : "bg-slate-200 border-slate-300"
                    }`}
                    title={`Segment #${i + 1}`}
                  >
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-emerald-500"
                          : isError
                          ? "bg-rose-500"
                          : isPaused
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${chunkPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div
            className={`flex items-center justify-between pt-2 border-t ${
              isDark ? "border-[#253350]" : "border-slate-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              {isDownloading && (
                <button
                  onClick={() => onPause(task.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}

              {isPaused && (
                <button
                  onClick={() => onResume(task.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              )}

              {isCompleted ? (
                <>
                  <button
                    onClick={() => onOpenFile(task.save_path || task.savePath || "")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Open File</span>
                  </button>
                  <button
                    onClick={() => onOpenFolder(task.save_path || task.savePath || "")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors shadow"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Open Folder</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onCancel(task.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-colors ${
                isDark
                  ? "bg-[#162032] border-[#253350] hover:bg-[#1f2d45] text-slate-300"
                  : "bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Hide / Background
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
