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
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gdm-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search downloads…"
          className="w-full pl-9 pr-7 py-2 rounded-lg text-[13px] font-medium bg-gdm-surface border border-gdm text-gdm-primary placeholder:text-gdm-muted focus:border-gdm-accent focus:outline-hidden transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-gdm-muted hover:text-gdm-primary"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Live Speed Badge */}
      <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-gdm bg-gdm-surface shrink-0">
        <Zap className="w-4 h-4 text-amber-800 dark:text-amber-400 fill-current animate-pulse" />
        <span className="text-[13px] font-semibold tabular-nums text-amber-800 dark:text-amber-400">
          {totalSpeedFormatted}
        </span>
        <span className="text-gdm-muted text-[13px]">|</span>
        <span className="text-[13px] font-medium text-gdm-secondary">
          <strong className="text-gdm-accent font-semibold">{activeCount}</strong> active
        </span>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={onToggleTheme}
        className="w-9 h-9 rounded-lg border border-gdm bg-gdm-surface hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-gdm-secondary hover:text-gdm-primary transition-colors shrink-0"
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-blue-600" />}
      </button>
    </div>
  );
};
