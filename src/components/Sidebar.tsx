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
  theme?: "dark" | "light";
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
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const categories: { id: CategoryType; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All Downloads", icon: <Layers className="w-4 h-4 text-blue-400" /> },
    { id: "compressed", label: "Compressed", icon: <Archive className="w-4 h-4 text-amber-400" /> },
    { id: "docs", label: "Documents", icon: <FileText className="w-4 h-4 text-emerald-400" /> },
    { id: "audio", label: "Music & Audio", icon: <Music className="w-4 h-4 text-pink-400" /> },
    { id: "programs", label: "Programs", icon: <Binary className="w-4 h-4 text-teal-400" /> },
    { id: "video", label: "Videos", icon: <Video className="w-4 h-4 text-purple-400" /> },
  ];

  const statuses: { id: StatusFilterType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "downloading", label: "Downloading", icon: <Clock className="w-4 h-4 text-blue-400" />, color: "text-blue-400" },
    { id: "completed", label: "Finished", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, color: "text-emerald-400" },
    { id: "paused", label: "Paused", icon: <PauseCircle className="w-4 h-4 text-amber-400" />, color: "text-amber-400" },
    { id: "error", label: "Incomplete / Error", icon: <AlertCircle className="w-4 h-4 text-rose-400" />, color: "text-rose-400" },
  ];

  return (
    <aside
      className={`w-64 h-screen flex flex-col justify-between border-r p-3.5 z-20 select-none overflow-y-auto transition-colors ${
        isDark ? "bg-[#111827] border-[#1f2937] text-slate-100" : "bg-white border-slate-200 text-slate-800"
      }`}
    >
      {/* Top Section */}
      <div className="space-y-4">
        {/* Goat Branding */}
        <div className="flex items-center space-x-3 px-1 pt-1">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-transparent">
            <img
              src="/icon.png"
              alt="Goat Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className={`font-black text-sm tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                GDM
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-500 border border-blue-500/40">
                PRO
              </span>
            </div>
            <span className={`text-[11px] font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Goat Download Manager
            </span>
          </div>
        </div>

        {/* Media Extractor Quick Button */}
        <button
          onClick={onOpenMediaModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-xs font-bold text-white shadow"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Media Grabber</span>
          </div>
          <span className="text-[10px] bg-black/30 text-white px-2 py-0.5 rounded font-mono font-semibold">
            yt-dlp
          </span>
        </button>

        {/* Categories Tree */}
        <div className="space-y-1">
          <p className={`text-[11px] font-bold uppercase tracking-wider px-2 mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
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
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : isDark
                    ? "text-slate-200 hover:bg-[#1f2937] hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {cat.icon}
                  <span>{cat.label}</span>
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-black/30 text-white"
                      : isDark
                      ? "bg-[#1f2937] text-slate-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Queue Filters */}
        <div className={`space-y-1 pt-2 border-t ${isDark ? "border-[#1f2937]" : "border-slate-200"}`}>
          <p className={`text-[11px] font-bold uppercase tracking-wider px-2 mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Status Queue
          </p>
          {statuses.map((st) => {
            const isSelected = selectedStatus === st.id;
            const count = statusCounts[st.id] || 0;
            return (
              <button
                key={st.id}
                onClick={() => onSelectStatus(st.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : isDark
                    ? "text-slate-200 hover:bg-[#1f2937] hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {st.icon}
                  <span>{st.label}</span>
                </div>
                {count > 0 && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-black/30 text-white"
                        : isDark
                        ? "bg-[#1f2937] text-slate-300"
                        : "bg-slate-100 text-slate-600"
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

      {/* Bottom Section */}
      <div className={`pt-3 border-t space-y-2 ${isDark ? "border-[#1f2937]" : "border-slate-200"}`}>
        {/* Browser Extension Bridge Status */}
        <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] ${
          isDark ? "bg-[#0d1424] border-[#1f2937]" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                bridgeOnline ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-rose-500"
              }`}
            />
            <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Browser Bridge</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 font-bold">
            :9666
          </span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg transition-colors text-xs font-semibold ${
            isDark
              ? "text-slate-300 hover:text-white hover:bg-[#1f2937]"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Options & Settings</span>
        </button>
      </div>
    </aside>
  );
};
