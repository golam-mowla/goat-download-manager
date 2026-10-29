import React, { useState } from "react";
import {
  ListPlus,
  ClipboardPaste,
  Trash2,
  FolderOpen,
  Film,
  Music,
  Subtitles,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  ALL_CONTAINERS,
  ContainerFormat,
  DownloadMode,
  DownloadOptions,
} from "../types";

interface BatchTabProps {
  options: DownloadOptions;
  onBrowseFolder: () => void;
  onOpenFolder: () => void;
  onStartBatchDownload: (urls: string[], batchOptions: Partial<DownloadOptions>) => void;
}

export const BatchTab: React.FC<BatchTabProps> = ({
  options,
  onBrowseFolder,
  onOpenFolder,
  onStartBatchDownload,
}) => {
  const [urlsText, setUrlsText] = useState("");
  const [batchMode, setBatchMode] = useState<DownloadMode>("video");
  const [batchContainer, setBatchContainer] = useState<ContainerFormat>("MP4 (Video)");
  const [batchQuality, setBatchQuality] = useState("best");
  const [includeSubs, setIncludeSubs] = useState(false);

  // Extract clean valid URLs from text (one per line or space/comma separated)
  const extractUrls = (text: string): string[] => {
    return text
      .split(/[\r\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.includes("www."));
  };

  const detectedUrls = extractUrls(urlsText);

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setUrlsText((prev) => (prev ? `${prev}\n${clipText.trim()}` : clipText.trim()));
      }
    } catch {
      // ignore
    }
  };

  const handleModeChange = (mode: DownloadMode) => {
    setBatchMode(mode);
    if (mode === "audio" && batchContainer.includes("(Video)")) {
      setBatchContainer("MP3 (Audio)");
    } else if (mode === "video" && batchContainer.includes("(Audio)")) {
      setBatchContainer("MP4 (Video)");
    }
  };

  const handleSubmit = () => {
    if (detectedUrls.length === 0) return;
    onStartBatchDownload(detectedUrls, {
      downloadMode: batchMode,
      container: batchContainer,
      videoStreamId: batchQuality,
      enableSubtitles: includeSubs || batchMode === "subtitles",
    });
    setUrlsText("");
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="neon-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            <span>Multiple URLs &amp; Batch Downloader</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Paste multiple video or audio links at once. Each link will be queued and downloaded automatically with crash-safe resume.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
            {detectedUrls.length} Valid Links Detected
          </span>
        </div>
      </div>

      {/* 2. Multi-line URL Input Box */}
      <div className="neon-card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <ListPlus className="w-4 h-4 text-indigo-600" />
            Paste Links (One URL per line)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePaste}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-cyan-600" />
              Paste from Clipboard
            </button>
            {urlsText && (
              <button
                type="button"
                onClick={() => setUrlsText("")}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={6}
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          placeholder={`https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=...\nhttps://instagram.com/reel/...\nhttps://x.com/...`}
          className="neon-input w-full p-3.5 text-xs sm:text-sm font-mono leading-relaxed"
        />

        {detectedUrls.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto space-y-1">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Detected Batch List ({detectedUrls.length}):
            </div>
            {detectedUrls.map((url, i) => (
              <div key={i} className="text-xs font-mono text-cyan-700 dark:text-cyan-300 truncate">
                {i + 1}. {url}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Batch Settings Card */}
      <div className="neon-card p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-cyan-400 border-b border-slate-100 dark:border-slate-800 pb-2">
          ⚙️ Batch Download Settings for All Selected Links
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Batch Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Download Mode
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleModeChange("video")}
                className={`py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1 ${
                  batchMode === "video"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-sm border border-cyan-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Film className="w-3 h-3" /> Video
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("audio")}
                className={`py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1 ${
                  batchMode === "audio"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-sm border border-cyan-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Music className="w-3 h-3" /> Audio
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("subtitles")}
                className={`py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1 ${
                  batchMode === "subtitles"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Subtitles className="w-3 h-3" /> Subs
              </button>
            </div>
          </div>

          {/* Batch Container */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Container Format
            </label>
            <select
              value={batchContainer}
              onChange={(e) => setBatchContainer(e.target.value as ContainerFormat)}
              className="neon-input w-full px-3 py-2 text-xs sm:text-sm font-bold"
            >
              {ALL_CONTAINERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Quality */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Preferred Quality
            </label>
            <select
              value={batchQuality}
              onChange={(e) => setBatchQuality(e.target.value)}
              className="neon-input w-full px-3 py-2 text-xs sm:text-sm font-bold"
            >
              <option value="best">🌟 Best Available (Auto Highest)</option>
              <option value="bestvideo[height<=2160]">🎬 2160p (4K UHD)</option>
              <option value="bestvideo[height<=1080]">🎬 1080p (Full HD)</option>
              <option value="bestvideo[height<=720]">🎬 720p (HD)</option>
              <option value="bestvideo[height<=480]">🎬 480p (Standard)</option>
            </select>
          </div>
        </div>

        {/* Save Folder & Subtitles checkbox */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
              Save To:
            </span>
            <input
              type="text"
              readOnly
              value={options.saveFolder}
              className="neon-input flex-1 px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={onBrowseFolder}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1 shrink-0"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Browse
            </button>
            <button
              type="button"
              onClick={onOpenFolder}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={includeSubs}
              onChange={(e) => setIncludeSubs(e.target.checked)}
              className="w-4 h-4 accent-cyan-600 rounded"
            />
            <span>Include Subtitles (English/Bengali)</span>
          </label>
        </div>

        {/* Big Batch Action Button */}
        <button
          type="button"
          disabled={detectedUrls.length === 0}
          onClick={handleSubmit}
          className="neon-btn-primary w-full py-3.5 px-5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            Start Batch Download for {detectedUrls.length > 0 ? detectedUrls.length : "All"} Links
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
