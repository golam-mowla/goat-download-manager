import React from "react";
import { Search, Zap } from "lucide-react";

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
  totalSpeedFormatted,
  activeCount,
}) => {
  return (
    <div className="flex items-center space-x-3 w-full">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-300/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by filename, URL, or format..."
          className="w-full pl-9 pr-7 py-1.5 rounded-lg text-xs text-slate-100 placeholder-slate-500 glass-input font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Live Speed Badge */}
      <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-purple-500/20 shadow-inner flex-shrink-0">
        <div className="flex items-center space-x-1">
          <Zap className="w-3 h-3 text-cyan-400 fill-current animate-pulse" />
          <span className="text-[11px] font-mono font-bold text-cyan-300">
            {totalSpeedFormatted}
          </span>
        </div>
        <div className="h-2.5 w-px bg-purple-500/20" />
        <span className="text-[10px] text-slate-400 font-medium">
          <strong className="text-purple-300">{activeCount}</strong> active
        </span>
      </div>
    </div>
  );
};
