import React from "react";
import {
  Download,
  Video,
  Music,
  FileText,
  Archive,
  Binary,
  Layers,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";

export type CategoryType = "all" | "video" | "audio" | "docs" | "compressed" | "programs";

interface SidebarProps {
  selectedCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  categoryCounts: Record<CategoryType, number>;
  activeDownloadsCount: number;
  bridgeOnline: boolean;
  onOpenSettings: () => void;
  onOpenMediaModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  activeDownloadsCount,
  bridgeOnline,
  onOpenSettings,
  onOpenMediaModal,
}) => {
  const categories: { id: CategoryType; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All Downloads", icon: <Layers className="w-4 h-4" /> },
    { id: "video", label: "Videos", icon: <Video className="w-4 h-4" /> },
    { id: "audio", label: "Audio", icon: <Music className="w-4 h-4" /> },
    { id: "docs", label: "Documents", icon: <FileText className="w-4 h-4" /> },
    { id: "compressed", label: "Compressed", icon: <Archive className="w-4 h-4" /> },
    { id: "programs", label: "Programs", icon: <Binary className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 h-screen flex flex-col justify-between glass-panel border-r border-purple-500/15 p-4 z-20 select-none">
      {/* Top Branding Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3 px-1 pt-1">
          {/* Circular Goat Logo Container */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-11 h-11 rounded-full bg-slate-950 border border-purple-400/40 flex items-center justify-center overflow-hidden shadow-lg">
              <img
                src="/goat-logo.jpg"
                alt="Goat Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to goat emoji if image fails to load
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-2xl select-none absolute">🐐</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
                GDM
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 tracking-wide">
              Goat Download Manager
            </span>
          </div>
        </div>

        {/* Quick Action: Media Extractor */}
        <button
          onClick={onOpenMediaModal}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/25 to-pink-600/25 border border-purple-500/30 hover:border-purple-400/60 hover:from-purple-600/35 hover:to-pink-600/35 transition-all text-xs font-semibold text-purple-200 shadow-sm group"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-pink-400 group-hover:rotate-12 transition-transform" />
            <span>Media Extractor</span>
          </div>
          <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded">yt-dlp</span>
        </button>

        {/* Categories Nav */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300/50 px-2 mb-2">
            Categories
          </p>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-purple-600/25 text-purple-200 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={isSelected ? "text-purple-400" : "text-slate-500"}>
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </div>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isSelected
                        ? "bg-purple-500/30 text-purple-200"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Status & Settings */}
      <div className="pt-4 border-t border-purple-500/10 space-y-2">
        {/* Browser Extension Bridge Status */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/40 border border-purple-500/10 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                bridgeOnline ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400"
              }`}
            />
            <span className="text-slate-400 text-[11px]">Bridge :9666</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">
            {bridgeOnline ? "ONLINE" : "WAITING"}
          </span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>App Preferences</span>
        </button>
      </div>
    </aside>
  );
};
