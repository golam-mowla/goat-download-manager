import React from "react";
import { Search, Zap, Sun, Moon } from "lucide-react";

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
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  totalSpeedFormatted,
  activeCount,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === "dark";

  return (
    <div className="flex items-center space-x-3 w-full">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by filename, URL, or category..."
          className={`w-full pl-9 pr-7 py-1.5 rounded-lg text-xs font-medium focus:border-blue-500 focus:outline-none transition-colors ${
            isDark
              ? "text-white placeholder-slate-400 bg-[#0d1424] border border-[#253350]"
              : "text-slate-800 placeholder-slate-400 bg-white border border-slate-300"
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs hover:text-white ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            ✕
          </button>
        )}
      </div>

      {/* Live Speed Badge */}
      <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg border flex-shrink-0 ${
        isDark ? "bg-[#0d1424] border-[#253350]" : "bg-white border-slate-300"
      }`}>
        <Zap className="w-3.5 h-3.5 text-yellow-400 fill-current animate-pulse" />
        <span className={`text-xs font-mono font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
          {totalSpeedFormatted}
        </span>
        <span className="text-slate-400">|</span>
        <span className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          <strong className="text-blue-500">{activeCount}</strong> active
        </span>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={onToggleTheme}
        className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
          isDark
            ? "bg-[#0d1424] border-[#253350] hover:bg-[#162032] text-amber-400"
            : "bg-white border-slate-300 hover:bg-slate-100 text-blue-600 shadow-xs"
        }`}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  );
};
