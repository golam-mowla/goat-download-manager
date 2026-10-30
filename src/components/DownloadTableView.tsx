import React, { useState } from "react";
import {
  Play,
  Pause,
  FolderOpen,
  FileCheck,
  Trash2,
  Cpu,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Music,
  Archive,
  Binary,
  Layers,
  Zap,
} from "lucide-react";
import { DownloadTask } from "../types";
import { SpeedChart } from "./SpeedChart";

interface DownloadTableViewProps {
  tasks: DownloadTask[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenFile: (path: string) => void;
  onOpenFolder: (path: string) => void;
}

export const DownloadTableView: React.FC<DownloadTableViewProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onPause,
  onResume,
  onDelete,
  onOpenFile,
  onOpenFolder,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "video":
        return <Video className="w-4 h-4 text-purple-400 flex-shrink-0" />;
      case "audio":
        return <Music className="w-4 h-4 text-pink-400 flex-shrink-0" />;
      case "docs":
        return <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
      case "compressed":
        return <Archive className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case "programs":
        return <Binary className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="w-full rounded-xl border border-purple-500/20 bg-slate-950/70 backdrop-blur-md overflow-hidden shadow-xl select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-purple-500/20 bg-slate-900/80 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <th className="py-2.5 px-3 w-8">#</th>
              <th className="py-2.5 px-3">File Name</th>
              <th className="py-2.5 px-3 w-32">Size</th>
              <th className="py-2.5 px-3 w-40">Progress</th>
              <th className="py-2.5 px-3 w-28">Status</th>
              <th className="py-2.5 px-3 w-28">Speed</th>
              <th className="py-2.5 px-3 w-24">Time Left</th>
              <th className="py-2.5 px-3 w-28 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-purple-500/10 text-slate-200">
            {tasks.map((task, idx) => {
              const isSelected = selectedTaskId === task.id;
              const isExpanded = expandedId === task.id;
              const isDownloading = task.status === "downloading";
              const isCompleted = task.status === "completed";
              const isPaused = task.status === "paused";
              const isError = task.status === "error";

              return (
                <React.Fragment key={task.id}>
                  <tr
                    onClick={() => onSelectTask(task.id)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? "bg-purple-900/30 border-l-2 border-l-purple-400"
                        : "hover:bg-purple-950/20"
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">
                      {idx + 1}
                    </td>

                    {/* File Name & Icon */}
                    <td className="py-2 px-3 min-w-[200px] max-w-[320px]">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(task.category)}
                        <span
                          className="font-semibold truncate text-slate-100 hover:text-purple-300"
                          title={task.filename}
                          onDoubleClick={() => isCompleted && onOpenFile(task.save_path)}
                        >
                          {task.filename}
                        </span>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-300">
                      {formatBytes(task.downloaded_bytes)} /{" "}
                      {task.total_bytes > 0 ? formatBytes(task.total_bytes) : "Unknown"}
                    </td>

                    {/* Progress Bar & Percent */}
                    <td className="py-2 px-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="font-bold text-purple-300">{task.percent.toFixed(1)}%</span>
                          {task.connections > 1 && (
                            <span className="text-cyan-400">{task.connections} Chunks</span>
                          )}
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-purple-500/15">
                          <div
                            className={`h-full rounded-full transition-all duration-200 ${
                              isCompleted
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : isError
                                ? "bg-rose-500"
                                : "bg-gradient-to-r from-purple-500 to-pink-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, task.percent))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2 px-3">
                      <span
                        className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isDownloading
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse"
                            : isPaused
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : isCompleted
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : isError
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    {/* Speed */}
                    <td className="py-2 px-3 font-mono font-semibold text-[11px] text-cyan-300">
                      {isDownloading ? task.speed_formatted : "--"}
                    </td>

                    {/* Time Left (ETA) */}
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                      {isDownloading ? task.eta_formatted : "--"}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        {isDownloading && (
                          <button
                            onClick={() => onPause(task.id)}
                            className="p-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors"
                            title="Pause"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isPaused && (
                          <button
                            onClick={() => onResume(task.id)}
                            className="p-1 rounded bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 transition-colors"
                            title="Resume"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}

                        {isCompleted && (
                          <button
                            onClick={() => onOpenFile(task.save_path)}
                            className="p-1 rounded bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 transition-colors"
                            title="Open File"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onOpenFolder(task.save_path)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Open Folder"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDelete(task.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Chunk expander toggle */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : task.id)}
                          className="p-1 rounded bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 transition-colors"
                          title="Inspect IDM Chunks & Speed"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* IDM Segment Slicing & Speed Telemetry Drawer */}
                  {isExpanded && (
                    <tr className="bg-slate-950/90 border-b border-purple-500/20">
                      <td colSpan={8} className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center space-x-1.5 font-bold text-purple-300">
                            <Cpu className="w-4 h-4 text-purple-400" />
                            <span>IDM Multi-Threaded Chunk Slicing ({task.chunks?.length || 1} Threads)</span>
                          </span>
                          <span className="text-slate-400 font-mono text-[11px] truncate max-w-md">
                            URL: {task.url}
                          </span>
                        </div>

                        {/* Parallel Chunk Progress */}
                        {task.chunks && task.chunks.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                            {task.chunks.map((chk) => (
                              <div
                                key={chk.id}
                                className="bg-slate-900/80 rounded-lg p-2 border border-purple-500/20 text-[10px] space-y-1"
                              >
                                <div className="flex justify-between font-mono">
                                  <span className="text-slate-400">#Thread {chk.id + 1}</span>
                                  <span className="text-cyan-300 font-bold">{chk.percent.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all"
                                    style={{ width: `${chk.percent}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2 text-slate-500 text-[11px]">
                            Single connection stream or waiting for segment initialization...
                          </div>
                        )}

                        {/* Real-time Recharts Speed Chart */}
                        {task.speedHistory && task.speedHistory.length > 0 && (
                          <div className="pt-2 border-t border-purple-500/10">
                            <div className="flex items-center justify-between text-[10px] text-pink-300 mb-1">
                              <span className="font-semibold">Live Bandwidth Transfer Velocity</span>
                              <span className="font-mono text-cyan-400">{task.speed_formatted}</span>
                            </div>
                            <SpeedChart data={task.speedHistory} height={60} />
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
