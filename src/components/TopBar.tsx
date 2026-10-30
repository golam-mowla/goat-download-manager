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
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by filename, URL, or category..."
          className="w-full pl-9 pr-7 py-1.5 rounded-lg text-xs text-white placeholder-slate-400 bg-[#0d1424] border border-[#253350] focus:border-blue-500 focus:outline-none font-medium"
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
      <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0d1424] border border-[#253350] flex-shrink-0">
        <Zap className="w-3.5 h-3.5 text-yellow-400 fill-current animate-pulse" />
        <span className="text-xs font-mono font-bold text-white">
          {totalSpeedFormatted}
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-xs text-slate-300 font-medium">
          <strong className="text-blue-400">{activeCount}</strong> active
        </span>
      </div>
    </div>
  );
};
