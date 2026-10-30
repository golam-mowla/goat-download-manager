import React, { useState } from "react";
import {
  Pause,
  Play,
  XCircle,
  FolderOpen,
  FileCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Clock,
  Zap,
  Trash2,
  ExternalLink,
  FileText,
  Video,
  Music,
  Archive,
  Binary,
  Layers,
} from "lucide-react";
import {
  DownloadTask,
  formatBytes,
  getDownloadedBytes,
  getTotalBytes,
  getChunkCount,
  getIsResumable,
} from "../types";
import { SpeedChart } from "./SpeedChart";

interface DownloadItemCardProps {
  task: DownloadTask;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenFile: (path: string) => void;
  onOpenFolder: (path: string) => void;
}

export const DownloadItemCard: React.FC<DownloadItemCardProps> = ({
  task,
  onPause,
  onResume,
  onCancel,
  onDelete,
  onOpenFile,
  onOpenFolder,
}) => {
  const [showChunks, setShowChunks] = useState(false);
  const [showSpeedChart, setShowSpeedChart] = useState(false);

  // Pick icon based on category or filename extension
  const getCategoryIcon = () => {
    switch (task.category) {
      case "video":
        return <Video className="w-5 h-5 text-purple-400" />;
      case "audio":
        return <Music className="w-5 h-5 text-pink-400" />;
      case "docs":
        return <FileText className="w-5 h-5 text-cyan-400" />;
      case "compressed":
        return <Archive className="w-5 h-5 text-amber-400" />;
      case "programs":
        return <Binary className="w-5 h-5 text-emerald-400" />;
      default:
        return <Layers className="w-5 h-5 text-indigo-400" />;
    }
  };


  const isDownloading = task.status === "downloading";
  const isPaused = task.status === "paused";
  const isCompleted = task.status === "completed";
  const isError = task.status === "error";

  return (
    <div className="glass-card rounded-2xl p-4 transition-all duration-300 relative group overflow-hidden border border-purple-500/15 hover:border-purple-400/40">
      {/* Background ambient glow for active downloading */}
      {isDownloading && (
        <div className="absolute top-0 right-0 w-64 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Main Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon & Title */}
        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/20 shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
            {getCategoryIcon()}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <h3
                className="font-semibold text-sm text-slate-100 truncate cursor-pointer hover:text-purple-300 transition-colors"
                title={task.filename}
                onClick={() => isCompleted && onOpenFile(task.save_path || task.savePath || "")}
              >
                {task.filename}
              </h3>

              {/* Status Badge */}
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isDownloading
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse"
                    : isPaused
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : isCompleted
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : isError
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-700/30 text-slate-400 border-slate-600/40"
                }`}
              >
                {task.status}
              </span>

              {/* Connections / Chunks Badge */}
              {getChunkCount(task) > 1 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 font-mono">
                  {getChunkCount(task)} Segments
                </span>
              )}
              {/* Resume Badge */}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                getIsResumable(task)
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-950/40 text-rose-300 border-rose-500/30"
              }`}>
                Resume: {getIsResumable(task) ? "Yes" : "No"}
              </span>
            </div>

            {/* Sub-text: URL and Destination */}
            <p className="text-[11px] text-slate-400 truncate font-mono opacity-80" title={task.url}>
              {task.url}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {isDownloading && (
            <button
              onClick={() => onPause(task.id)}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/50 hover:border-amber-500/40 transition-all"
              title="Pause Download"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}

          {isPaused && (
            <button
              onClick={() => onResume(task.id)}
              className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 hover:border-purple-400/60 transition-all"
              title="Resume Download"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}

          {isDownloading && (
            <button
              onClick={() => onCancel(task.id)}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/50 hover:border-rose-500/40 transition-all"
              title="Cancel Download"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          {isCompleted && (
            <>
              <button
                onClick={() => onOpenFile(task.save_path || task.savePath || "")}
                className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition-all"
                title="Open File"
              >
                <FileCheck className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenFolder(task.save_path || task.savePath || "")}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/50 transition-all"
                title="Open Containing Folder"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => onDelete(task.id)}
            className="p-2 rounded-xl bg-slate-800/40 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-all"
            title="Remove from list"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Telemetry */}
      <div className="mt-3.5 space-y-2">
        {/* Progress bar container */}
        <div className="h-2.5 w-full bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-purple-500/20 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${
              isCompleted
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : isError
                ? "bg-gradient-to-r from-rose-500 to-red-600"
                : "bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, task.percent))}%` }}
          >
            {isDownloading && (
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            )}
          </div>
        </div>

        {/* Telemetry info row */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-0.5">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-200">
              {task.percent.toFixed(1)}%
            </span>
            <span>
              {formatBytes(getDownloadedBytes(task))} /{" "}
              {getTotalBytes(task) > 0 ? formatBytes(getTotalBytes(task)) : "Unknown size"}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {isDownloading && (
              <>
                <span className="flex items-center space-x-1 text-cyan-300 font-semibold">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                  <span>{task.speed_formatted || "0 B/s"}</span>
                </span>
                <span className="flex items-center space-x-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{task.eta_formatted || "--"}</span>
                </span>
              </>
            )}

            {/* Toggle IDM Chunks Inspector */}
            {task.chunks && task.chunks.length > 0 && (
              <button
                onClick={() => setShowChunks(!showChunks)}
                className="flex items-center space-x-1 text-[11px] text-purple-400 hover:text-purple-300 font-sans cursor-pointer transition-colors"
              >
                <Cpu className="w-3 h-3" />
                <span>Chunks</span>
                {showChunks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {/* Toggle Real-time Speed Chart */}
            {task.speedHistory && task.speedHistory.length > 0 && (
              <button
                onClick={() => setShowSpeedChart(!showSpeedChart)}
                className="flex items-center space-x-1 text-[11px] text-pink-400 hover:text-pink-300 font-sans cursor-pointer transition-colors"
              >
                <span>Speed Graph</span>
                {showSpeedChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* IDM-Style Multithreaded Chunk Visualizer */}
      {showChunks && task.chunks && task.chunks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-500/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-purple-300/80 font-sans">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-semibold">Multi-Threaded Segments ({task.chunks.length} active threads)</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              IDM High-Speed Chunk Slicing
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
            {task.chunks.map((chk) => (
              <div
                key={chk.id}
                className="bg-slate-950/70 rounded-lg p-1.5 border border-purple-500/15 text-[10px] space-y-1"
              >
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>#{chk.id + 1}</span>
                  <span className="text-purple-300 font-semibold">{chk.percent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-200"
                    style={{ width: `${chk.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Recharts Speed Chart */}
      {showSpeedChart && task.speedHistory && task.speedHistory.length > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-500/10 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-pink-300/80 font-sans">
            <span className="font-semibold">Real-Time Transfer Velocity</span>
            <span className="text-slate-400 font-mono text-[10px]">recharts live telemetry</span>
          </div>
          <SpeedChart data={task.speedHistory} height={70} />
        </div>
      )}

      {/* Error Banner */}
      {task.error && (
        <div className="mt-2.5 p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center space-x-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span className="truncate">{task.error}</span>
        </div>
      )}
    </div>
  );
};
