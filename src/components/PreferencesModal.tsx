import React, { useState, useEffect } from "react";
import {
  X,
  Settings,
  Folder,
  Layers,
  Zap,
  Globe,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ToolVersionInfo } from "../types";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDir: string;
  onChangeDefaultDir: (dir: string) => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  defaultDir,
  onChangeDefaultDir,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "connection" | "tools">("general");
  const [savePath, setSavePath] = useState(defaultDir);
  const [maxConcurrent, setMaxConcurrent] = useState(3);
  const [defaultConnections, setDefaultConnections] = useState(8);
  const [speedLimitEnabled, setSpeedLimitEnabled] = useState(false);
  const [speedLimitKb, setSpeedLimitKb] = useState(5120); // 5 MB/s

  // Core Tools Info
  const [tools, setTools] = useState<ToolVersionInfo[]>([]);
  const [checkingTools, setCheckingTools] = useState(false);

  useEffect(() => {
    setSavePath(defaultDir);
  }, [defaultDir]);

  useEffect(() => {
    if (isOpen) {
      loadToolsInfo();
    }
  }, [isOpen]);

  const loadToolsInfo = async () => {
    try {
      setCheckingTools(true);
      const res = await invoke<ToolVersionInfo[]>("check_tool_updates");
      if (Array.isArray(res)) setTools(res);
    } catch {
      // fallback
    } finally {
      setCheckingTools(false);
    }
  };

  const handleUpdateTool = async (name: string) => {
    try {
      setTools((prev) =>
        prev.map((t) => (t.name === name ? { ...t, isUpdating: true } : t))
      );
      await invoke("update_tool", { name });
      await loadToolsInfo();
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setTools((prev) =>
        prev.map((t) => (t.name === name ? { ...t, isUpdating: false } : t))
      );
    }
  };

  if (!isOpen) return null;

  const handleBrowseFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: savePath || undefined,
      });
      if (selected && typeof selected === "string") {
        setSavePath(selected);
        onChangeDefaultDir(selected);
      }
    } catch (err) {
      console.error("Folder select error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-purple-500/25 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/15 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-sm bg-gradient-to-r from-purple-200 via-pink-200 to-amber-100 bg-clip-text text-transparent">
              GDM Options & Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-purple-500/15 bg-slate-950/40 px-6 pt-2 space-x-6">
          <button
            onClick={() => setActiveTab("general")}
            className={`pb-2.5 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === "general"
                ? "border-purple-400 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>General & Storage</span>
          </button>

          <button
            onClick={() => setActiveTab("connection")}
            className={`pb-2.5 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === "connection"
                ? "border-purple-400 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Connection & IDM Chunks</span>
          </button>

          <button
            onClick={() => setActiveTab("tools")}
            className={`pb-2.5 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === "tools"
                ? "border-purple-400 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Core Engines (yt-dlp/ffmpeg)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs">
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* Default Downloads Directory */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Default Download Directory</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={savePath}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-xl glass-input font-mono text-slate-300 text-xs"
                  />
                  <button
                    onClick={handleBrowseFolder}
                    className="px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 font-semibold"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Browser Integration Info */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-purple-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-purple-300 font-semibold">
                  <Globe className="w-4 h-4" />
                  <span>Browser Integration & Bridge</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Goat Download Manager listens on <b>http://127.0.0.1:9666</b> and handles the custom Windows protocols <b>gdm://</b> and <b>parrot://</b>.
                  Standard browser downloads (.zip, .exe, .iso, .pdf, .mp4) are caught automatically when using the GDM extension.
                </p>
              </div>
            </div>
          )}

          {activeTab === "connection" && (
            <div className="space-y-4">
              {/* Connections / Threads per download */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-semibold text-slate-300">Default Simultaneous Chunk Connections</label>
                  <span className="font-bold font-mono text-cyan-400">{defaultConnections} Threads</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[4, 8, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDefaultConnections(num)}
                      className={`py-2 rounded-xl font-bold border transition-all ${
                        defaultConnections === num
                          ? "bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                          : "bg-slate-900/60 border-purple-500/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {num} Chunks
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Concurrent Downloads */}
              <div className="space-y-1.5 pt-2 border-t border-purple-500/10">
                <div className="flex justify-between">
                  <label className="font-semibold text-slate-300">Maximum Active Concurrent Tasks</label>
                  <span className="font-bold font-mono text-purple-300">{maxConcurrent} Active</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[1, 2, 3, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxConcurrent(num)}
                      className={`py-2 rounded-xl font-bold border transition-all ${
                        maxConcurrent === num
                          ? "bg-purple-600/30 border-purple-400 text-purple-200"
                          : "bg-slate-900/60 border-purple-500/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {num} Downloads
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Limiter */}
              <div className="space-y-2 pt-2 border-t border-purple-500/10">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Global Bandwidth Limiter</label>
                  <input
                    type="checkbox"
                    checked={speedLimitEnabled}
                    onChange={(e) => setSpeedLimitEnabled(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                </div>
                {speedLimitEnabled && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={speedLimitKb}
                      onChange={(e) => setSpeedLimitKb(parseInt(e.target.value) || 0)}
                      className="w-32 px-3 py-1.5 rounded-lg glass-input font-mono text-slate-200"
                    />
                    <span className="text-slate-400">KB/s ({(speedLimitKb / 1024).toFixed(1)} MB/s)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "tools" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Core Media Engine Binaries</span>
                <button
                  onClick={loadToolsInfo}
                  disabled={checkingTools}
                  className="flex items-center space-x-1 text-purple-400 hover:text-purple-300"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingTools ? "animate-spin" : ""}`} />
                  <span>Check Updates</span>
                </button>
              </div>

              {tools.length === 0 ? (
                <div className="p-3 text-slate-400 text-center">Checking installed tools...</div>
              ) : (
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{tool.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Installed: {tool.installedVersion || "Bundled"} &bull; Latest: {tool.latestVersion || "Up to date"}
                        </div>
                      </div>
                      {tool.hasUpdate ? (
                        <button
                          onClick={() => handleUpdateTool(tool.name)}
                          disabled={tool.isUpdating}
                          className="px-3 py-1 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 text-pink-300 border border-pink-500/40 font-semibold"
                        >
                          {tool.isUpdating ? "Updating..." : "Update"}
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Latest</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-purple-500/15 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
