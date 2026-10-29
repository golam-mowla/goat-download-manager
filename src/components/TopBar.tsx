import React from "react";
import {
  Search,
  Plus,
  Zap,
  Filter,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import { TaskStatus } from "../types";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  totalSpeedFormatted: string;
  activeCount: number;
  totalTasksCount: number;
  onOpenAddModal: () => void;
  onClearCompleted: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalSpeedFormatted,
  activeCount,
  totalTasksCount,
  onOpenAddModal,
  onClearCompleted,
}) => {
  return (
    <header className="h-16 px-6 glass-panel border-b border-purple-500/15 flex items-center justify-between gap-4 z-10 select-none">
      {/* Left: Search input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search downloads by name, URL, or extension..."
          className="w-full pl-10 pr-4 py-2 rounded-xl text-xs text-slate-100 placeholder-slate-500 glass-input font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Middle: Live Total Speed Badge */}
      <div className="hidden md:flex items-center space-x-3 px-3.5 py-1.5 rounded-xl bg-slate-950/70 border border-purple-500/20 shadow-inner">
        <div className="flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current animate-pulse" />
          <span className="text-[11px] font-mono font-bold text-cyan-300">
            {totalSpeedFormatted}
          </span>
        </div>
        <div className="h-3 w-px bg-purple-500/20" />
        <span className="text-[11px] font-medium text-slate-400">
          <strong className="text-purple-300">{activeCount}</strong> active
        </span>
      </div>

      {/* Right: Filter & Action Buttons */}
      <div className="flex items-center space-x-2.5">
        {/* Status Filter Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs text-slate-200 glass-input cursor-pointer font-medium"
          >
            <option value="all" className="bg-slate-900 text-slate-200">All Statuses</option>
            <option value="downloading" className="bg-slate-900 text-purple-300">Downloading</option>
            <option value="completed" className="bg-slate-900 text-emerald-300">Completed</option>
            <option value="paused" className="bg-slate-900 text-amber-300">Paused</option>
            <option value="error" className="bg-slate-900 text-rose-300">Error</option>
          </select>
          <Filter className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-300/60 pointer-events-none" />
        </div>

        {/* Clear Completed */}
        {totalTasksCount > 0 && (
          <button
            onClick={onClearCompleted}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-purple-500/10 transition-colors"
            title="Clear completed tasks"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Add Download Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.45)] transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Download</span>
        </button>
      </div>
    </header>
  );
};
