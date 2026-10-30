import React from "react";
import {
  Layers,
  Video,
  Music,
  FileText,
  Archive,
  Binary,
  Settings,
  Sparkles,
  CheckCircle2,
  Clock,
  PauseCircle,
  AlertCircle,
  HelpCircle,
  Download,
} from "lucide-react";

export type CategoryType = "all" | "video" | "audio" | "docs" | "compressed" | "programs";
export type StatusFilterType = "all" | "downloading" | "completed" | "paused" | "error";

interface SidebarProps {
  selectedCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  selectedStatus: StatusFilterType;
  onSelectStatus: (status: StatusFilterType) => void;
  categoryCounts: Record<CategoryType, number>;
  statusCounts: Record<StatusFilterType, number>;
  bridgeOnline: boolean;
  onOpenSettings: () => void;
  onOpenMediaModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  categoryCounts,
  statusCounts,
  bridgeOnline,
  onOpenSettings,
  onOpenMediaModal,
}) => {
  const categories: { id: CategoryType; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All Downloads", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "compressed", label: "Compressed", icon: <Archive className="w-3.5 h-3.5 text-amber-400" /> },
    { id: "docs", label: "Documents", icon: <FileText className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: "audio", label: "Music & Audio", icon: <Music className="w-3.5 h-3.5 text-pink-400" /> },
    { id: "programs", label: "Programs", icon: <Binary className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: "video", label: "Videos", icon: <Video className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  const statuses: { id: StatusFilterType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "downloading", label: "Downloading", icon: <Clock className="w-3.5 h-3.5" />, color: "text-purple-400" },
    { id: "completed", label: "Finished", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400" },
    { id: "paused", label: "Paused", icon: <PauseCircle className="w-3.5 h-3.5" />, color: "text-amber-400" },
    { id: "error", label: "Incomplete / Error", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-rose-400" },
  ];

  return (
    <aside className="w-60 h-screen flex flex-col justify-between glass-panel border-r border-purple-500/15 p-3.5 z-20 select-none overflow-y-auto">
      {/* Top Branding */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 px-1 pt-1">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-400 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-10 h-10 rounded-full bg-slate-950 border border-purple-400/50 flex items-center justify-center overflow-hidden shadow-lg">
              <img
                src="/goat-logo.jpg"
                alt="Goat Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-xl select-none absolute">🐐</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-purple-200 via-pink-200 to-amber-100 bg-clip-text text-transparent">
                GDM
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-purple-500/25 text-purple-300 border border-purple-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 tracking-wide">
              Goat Download Manager
            </span>
          </div>
        </div>

        {/* Media Extractor Quick Button */}
        <button
          onClick={onOpenMediaModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/25 hover:border-purple-400/50 hover:from-purple-800/40 hover:to-pink-800/40 transition-all text-xs font-semibold text-purple-200 shadow-sm group"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 group-hover:rotate-12 transition-transform" />
            <span>Media Grabber</span>
          </div>
          <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded font-mono">
            yt-dlp
          </span>
        </button>

        {/* Categories Tree */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300/45 px-2 mb-1.5">
            Categories
          </p>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id && selectedStatus === "all";
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onSelectStatus("all");
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isSelected
                    ? "bg-purple-600/30 text-purple-200 border border-purple-500/35 shadow-[0_0_12px_rgba(168,85,247,0.2)] font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={isSelected ? "text-purple-300" : "text-slate-400"}>
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </div>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? "bg-purple-500/35 text-purple-200 font-bold"
                        : "bg-slate-800/80 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Queues / Status Tree */}
        <div className="space-y-0.5 pt-2 border-t border-purple-500/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300/45 px-2 mb-1.5">
            Task Status
          </p>
          {statuses.map((st) => {
            const isSelected = selectedStatus === st.id;
            const count = statusCounts[st.id] || 0;
            return (
              <button
                key={st.id}
                onClick={() => {
                  onSelectStatus(st.id);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isSelected
                    ? "bg-purple-600/30 text-purple-200 border border-purple-500/35 shadow-[0_0_12px_rgba(168,85,247,0.2)] font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={isSelected ? "text-purple-300" : st.color}>
                    {st.icon}
                  </span>
                  <span>{st.label}</span>
                </div>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? "bg-purple-500/35 text-purple-200 font-bold"
                        : "bg-slate-800/80 text-slate-400"
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

      {/* Bottom Status & Bridge */}
      <div className="pt-3 border-t border-purple-500/10 space-y-2">
        {/* Local Bridge Status */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-purple-500/10 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                bridgeOnline ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400"
              }`}
            />
            <span className="text-slate-400 text-[10px] font-mono">Bridge :9666</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-400">
            {bridgeOnline ? "ONLINE" : "WAITING"}
          </span>
        </div>

        {/* Preferences */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Options & Config</span>
        </button>
      </div>
    </aside>
  );
};
