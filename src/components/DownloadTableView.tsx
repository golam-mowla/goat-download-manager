import React, { useState } from "react";
import {
  Play,
  Pause,
  FolderOpen,
  FileCheck,
  Trash2,
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
import {
  DownloadTask,
  formatBytes,
  getDownloadedBytes,
  getTotalBytes,
  getChunkCount,
  getIsResumable,
} from "../types";
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


  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "video":
        return <Video className="w-4 h-4 text-purple-400 flex-shrink-0" />;
      case "audio":
        return <Music className="w-4 h-4 text-pink-400 flex-shrink-0" />;
      case "docs":
        return <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case "compressed":
        return <Archive className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case "programs":
        return <Binary className="w-4 h-4 text-teal-400 flex-shrink-0" />;
      default:
        return <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="w-full bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1f2937] bg-[#162032] text-slate-200 text-[11px] font-bold uppercase tracking-wider select-none">
              <th className="py-2.5 px-3 w-8 text-center">#</th>
              <th className="py-2.5 px-3">File Name</th>
              <th className="py-2.5 px-3 w-32">Size</th>
              <th className="py-2.5 px-3 w-48">Progress</th>
              <th className="py-2.5 px-3 w-28">Status</th>
              <th className="py-2.5 px-3 w-28">Speed</th>
              <th className="py-2.5 px-3 w-24">Time Left</th>
              <th className="py-2.5 px-3 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2937]">
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
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-900/30 text-white"
                        : "hover:bg-[#1a2333] text-slate-200"
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* File Name */}
                    <td className="py-2.5 px-3 font-semibold text-white max-w-xs truncate">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(task.category)}
                        <span
                          className="truncate hover:underline"
                          title={task.filename}
                          onDoubleClick={() => isCompleted && onOpenFile(task.save_path || task.savePath || "")}
                        >
                          {task.filename}
                        </span>
                      </div>
                    </td>

                    {/* Size & Resume Capability */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-200">
                      <div>
                        {formatBytes(getDownloadedBytes(task))} /{" "}
                        {getTotalBytes(task) > 0 ? formatBytes(getTotalBytes(task)) : "Unknown"}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-sans">Resume:</span>
                        {getIsResumable(task) ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                            Yes
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20">
                            No
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Progress Bar & Percent */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono font-bold">
                          <span className="text-white">{task.percent.toFixed(1)}%</span>
                          {getChunkCount(task) > 1 && (
                            <span className="text-blue-400">{getChunkCount(task)} Chunks</span>
                          )}
                        </div>
                        <div className="h-2 w-full bg-[#0d1424] rounded-full overflow-hidden border border-[#1f2937]">
                          <div
                            className={`h-full rounded-full transition-all duration-200 ${
                              isCompleted
                                ? "bg-emerald-500"
                                : isError
                                ? "bg-rose-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, task.percent))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isDownloading
                            ? "bg-blue-600/20 text-blue-300 border-blue-500/40 animate-pulse"
                            : isPaused
                            ? "bg-amber-600/20 text-amber-300 border-amber-500/40"
                            : isCompleted
                            ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40"
                            : isError
                            ? "bg-rose-600/20 text-rose-300 border-rose-500/40"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    {/* Speed */}
                    <td className="py-2.5 px-3 font-mono font-bold text-[11px] text-sky-400">
                      {isDownloading ? (task.speed_formatted || task.speed || "--") : "--"}
                    </td>

                    {/* Time Left (ETA) */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                      {isDownloading ? (task.eta_formatted || task.eta || "--") : "--"}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        {isDownloading && (
                          <button
                            onClick={() => onPause(task.id)}
                            className="p-1 rounded bg-[#1f2937] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors"
                            title="Pause"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isPaused && (
                          <button
                            onClick={() => onResume(task.id)}
                            className="p-1 rounded bg-[#1f2937] hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="Resume"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}

                        {isCompleted && (
                          <button
                            onClick={() => onOpenFile(task.save_path || task.savePath || "")}
                            className="p-1 rounded bg-[#1f2937] hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                            title="Open File"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Open IDM Download Status Dialog */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(task.id);
                          }}
                          className="p-1 rounded bg-[#1f2937] hover:bg-blue-500/20 text-slate-300 hover:text-white transition-colors"
                          title="Open IDM Download Status Dialog"
                        >
                          <span className="text-xs">🐐</span>
                        </button>

                        <button
                          onClick={() => onOpenFolder(task.save_path || task.savePath || "")}
                          className="p-1 rounded bg-[#1f2937] hover:bg-blue-500/20 text-slate-300 hover:text-white transition-colors"
                          title="Open Folder"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDelete(task.id)}
                          className="p-1 rounded bg-[#1f2937] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Expand Chunk Drawer */}
                        {task.chunks && task.chunks.length > 0 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : task.id)}
                            className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-slate-300 hover:text-white transition-colors"
                            title="Toggle Chunks Drawer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* IDM 16-Chunk Drawer */}
                  {isExpanded && task.chunks && task.chunks.length > 0 && (
                    <tr className="bg-[#0d1424] border-b border-[#1f2937]">
                      <td colSpan={8} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span className="font-bold flex items-center space-x-1.5 text-white">
                              <Zap className="w-3.5 h-3.5 text-yellow-400" />
                              <span>Active Segments ({task.chunks.length} Threads)</span>
                            </span>
                            <span className="font-mono text-slate-400">
                              Direct Stream Connections
                            </span>
                          </div>

                          {/* Grid of Chunk Progress Bars */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                            {task.chunks.map((chk, i) => (
                              <div
                                key={i}
                                className="bg-[#162032] p-1.5 rounded border border-[#1f2937] space-y-1"
                              >
                                <div className="flex justify-between text-[9px] font-mono text-slate-300">
                                  <span className="font-bold text-white">T{i + 1}</span>
                                  <span>{chk.percent.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#0d1424] rounded overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded transition-all duration-150"
                                    style={{ width: `${chk.percent}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Speed Chart Telemetry */}
                          {task.speedHistory && task.speedHistory.length > 0 && (
                            <div className="pt-2">
                              <SpeedChart data={task.speedHistory} height={40} compact />
                            </div>
                          )}
                        </div>
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
