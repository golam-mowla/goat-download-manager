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
  Scissors,
  Gauge,
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
}) => {
  return (
    <div className="h-14 px-4 bg-slate-950/80 border-b border-purple-500/15 backdrop-blur-md flex items-center justify-between gap-2 z-10 select-none overflow-x-auto">
      {/* Primary Action Buttons */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
        {/* Add URL */}
        <button
          onClick={onAddUrl}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all"
          title="Add new download URL"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add URL</span>
        </button>

        {/* Resume */}
        <button
          onClick={onResumeSelected}
          disabled={!hasSelected}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-purple-600/20 text-purple-300 hover:text-purple-200 border border-purple-500/20 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all"
          title="Resume selected download"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Resume</span>
        </button>

        {/* Stop */}
        <button
          onClick={onPauseSelected}
          disabled={!hasSelected}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-amber-600/20 text-amber-300 hover:text-amber-200 border border-purple-500/20 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all"
          title="Stop / Pause selected download"
        >
          <Pause className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Stop</span>
        </button>

        {/* Stop All */}
        <button
          onClick={onStopAll}
          disabled={!hasActive}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-600/20 text-rose-300 hover:text-rose-200 border border-purple-500/20 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all"
          title="Stop all active downloads"
        >
          <Square className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Stop All</span>
        </button>

        {/* Delete */}
        <button
          onClick={onDeleteSelected}
          disabled={!hasSelected}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 border border-purple-500/20 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all"
          title="Delete selected download"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Delete</span>
        </button>

        {/* Clear Completed */}
        {hasCompleted && (
          <button
            onClick={onClearCompleted}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-purple-500/20 text-xs font-medium transition-all"
            title="Clean finished downloads from list"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Clean Finished</span>
          </button>
        )}
      </div>

      <div className="h-5 w-px bg-purple-500/20 mx-1 hidden sm:block" />

      {/* Media Engine & Utility Actions */}
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        {/* Media Grabber */}
        <button
          onClick={onOpenMediaGrabber}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-pink-950/40 hover:bg-pink-900/40 text-pink-300 border border-pink-500/30 text-xs font-semibold transition-all hover:border-pink-400/60 shadow-sm"
          title="Download YouTube, Instagram Reels, TikTok videos"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Media Grabber</span>
        </button>

        {/* Open Downloads Folder */}
        <button
          onClick={onOpenDefaultFolder}
          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-purple-500/15 transition-all"
          title="Open Downloads Directory"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-purple-500/15 transition-all"
          title="Preferences & Connections"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
