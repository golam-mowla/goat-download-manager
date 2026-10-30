import React from "react";
import {
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  CheckCheck,
  Settings,
  Sparkles,
  FolderOpen,
} from "lucide-react";

interface ToolbarProps {
  onAddUrl: () => void;
  onResumeSelected: () => void;
  onPauseSelected: () => void;
  onStopAll: () => void;
  onDeleteSelected: () => void;
  onClearCompleted: () => void;
  onOpenMediaGrabber: () => void;
  onOpenSettings: () => void;
  onOpenDefaultFolder: () => void;
  hasSelected: boolean;
  hasActive: boolean;
  hasCompleted: boolean;
  theme?: "dark" | "light";
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddUrl,
  onResumeSelected,
  onPauseSelected,
  onStopAll,
  onDeleteSelected,
  onClearCompleted,
  onOpenMediaGrabber,
  onOpenSettings,
  onOpenDefaultFolder,
  hasSelected,
  hasActive,
  hasCompleted,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  return (
    <div
      className={`h-14 px-4 border-b flex items-center justify-between gap-2 z-10 select-none overflow-x-auto transition-colors ${
        isDark ? "bg-[#111827] border-[#1f2937]" : "bg-white border-slate-200"
      }`}
    >
      {/* Primary Action Buttons */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Add URL */}
        <button
          onClick={onAddUrl}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-colors active:scale-95"
          title="Add new download URL"
        >
          <Plus className="w-4 h-4" />
          <span>Add URL</span>
        </button>

        {/* Resume */}
        <button
          onClick={onResumeSelected}
          disabled={!hasSelected}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors border ${
            isDark
              ? "bg-[#1f2937] hover:bg-[#374151] text-emerald-300 border-transparent"
              : "bg-slate-50 hover:bg-slate-100 text-emerald-600 border-slate-200"
          }`}
          title="Resume selected download"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Resume</span>
        </button>

        {/* Stop */}
        <button
          onClick={onPauseSelected}
          disabled={!hasSelected}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors border ${
            isDark
              ? "bg-[#1f2937] hover:bg-[#374151] text-amber-300 border-transparent"
              : "bg-slate-50 hover:bg-slate-100 text-amber-600 border-slate-200"
          }`}
          title="Pause selected download"
        >
          <Pause className="w-3.5 h-3.5" />
          <span>Stop</span>
        </button>

        {/* Stop All */}
        <button
          onClick={onStopAll}
          disabled={!hasActive}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors border ${
            isDark
              ? "bg-[#1f2937] hover:bg-[#374151] text-rose-300 border-transparent"
              : "bg-slate-50 hover:bg-slate-100 text-rose-600 border-slate-200"
          }`}
          title="Stop all active downloads"
        >
          <Square className="w-3.5 h-3.5" />
          <span>Stop All</span>
        </button>

        {/* Delete */}
        <button
          onClick={onDeleteSelected}
          disabled={!hasSelected}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors border ${
            isDark
              ? "bg-[#1f2937] hover:bg-[#374151] text-slate-200 hover:text-rose-400 border-transparent"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-rose-600 border-slate-200"
          }`}
          title="Delete selected download"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        {/* Clear Completed */}
        <button
          onClick={onClearCompleted}
          disabled={!hasCompleted}
          className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors border ${
            isDark
              ? "bg-[#1f2937] hover:bg-[#374151] text-slate-300 hover:text-white border-transparent"
              : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
          }`}
          title="Clear finished downloads from list"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Clean Finished</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Media Grabber */}
        <button
          onClick={onOpenMediaGrabber}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow"
          title="Open Media Extractor"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span className="hidden md:inline">Media Grabber</span>
        </button>

        {/* Open Download Folder */}
        <button
          onClick={onOpenDefaultFolder}
          className={`p-2 rounded-lg transition-colors border ${
            isDark
              ? "bg-[#1f2937] hover:bg-[#374151] text-slate-300 hover:text-white border-transparent"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          }`}
          title="Open Downloads Folder"
        >
          <FolderOpen className="w-4 h-4 text-blue-500" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className={`p-2 rounded-lg transition-colors border ${
            isDark
              ? "bg-[#1f2937] hover:bg-[#374151] text-slate-300 hover:text-white border-transparent"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          }`}
          title="Preferences & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
