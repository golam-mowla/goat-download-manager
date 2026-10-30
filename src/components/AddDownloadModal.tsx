import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Film,
  Folder,
  ArrowRight,
  Download,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Scissors,
  Subtitles,
  Loader2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { MediaInfo, ContainerFormat, ALL_CONTAINERS } from "../types";

interface AddDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUrl?: string;
  onAddDirectDownload: (
    url: string,
    savePath: string,
    filename: string,
    connections: number
  ) => Promise<void>;
  onAddMediaDownload: (
    options: any
  ) => Promise<void>;
}

export const AddDownloadModal: React.FC<AddDownloadModalProps> = ({
  isOpen,
  onClose,
  defaultUrl = "",
  onAddDirectDownload,
  onAddMediaDownload,
}) => {
  const [tab, setTab] = useState<"direct" | "media">("direct");

  // Direct Download State
  const [url, setUrl] = useState(defaultUrl);
  const [customFilename, setCustomFilename] = useState("");
  const [saveFolder, setSaveFolder] = useState("");
  const [connections, setConnections] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Media (yt-dlp) State
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [isFetchingMedia, setIsFetchingMedia] = useState(false);
  const [selectedFormatId, setSelectedFormatId] = useState("");
  const [selectedAudioId, setSelectedAudioId] = useState("");
  const [container, setContainer] = useState<ContainerFormat>("MP4 (Video)");
  const [enableClip, setEnableClip] = useState(false);
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("00:00:10");

  useEffect(() => {
    if (defaultUrl) {
      const cleanUrl = typeof defaultUrl === "string" ? defaultUrl : (defaultUrl as any)?.url || "";
      if (cleanUrl) {
        setUrl(cleanUrl);
        const lower = cleanUrl.toLowerCase();
        const isDirectFile =
          lower.endsWith(".mkv") ||
          lower.endsWith(".mp4") ||
          lower.endsWith(".avi") ||
          lower.endsWith(".zip") ||
          lower.endsWith(".rar") ||
          lower.endsWith(".7z") ||
          lower.endsWith(".tar") ||
          lower.endsWith(".gz") ||
          lower.endsWith(".iso") ||
          lower.endsWith(".exe") ||
          lower.endsWith(".msi") ||
          lower.endsWith(".pdf");

        if (
          !isDirectFile &&
          (lower.includes("youtube.com") ||
            lower.includes("youtu.be") ||
            lower.includes("instagram.com") ||
            lower.includes("facebook.com") ||
            lower.includes("tiktok.com") ||
            lower.includes("twitter.com") ||
            lower.includes("x.com"))
        ) {
          setTab("media");
        } else {
          setTab("direct");
        }
      }
    }
  }, [defaultUrl]);

  // Load default downloads directory
  useEffect(() => {
    const fetchDefaultDir = async () => {
      try {
        const homeDir = await invoke<string>("get_default_download_dir");
        if (homeDir) setSaveFolder(homeDir);
      } catch {
        setSaveFolder("D:\\Downloads");
      }
    };
    fetchDefaultDir();
  }, []);

  if (!isOpen) return null;

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: saveFolder || undefined,
      });
      if (selected && typeof selected === "string") {
        setSaveFolder(selected);
      }
    } catch (err) {
      console.error("Folder select error:", err);
    }
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setErrorMessage("Please enter a valid URL");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onAddDirectDownload(cleanUrl, saveFolder, customFilename.trim(), connections);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.toString() || "Failed to start download");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFetchMediaInfo = async () => {
    if (!url.trim()) return;
    try {
      setIsFetchingMedia(true);
      setErrorMessage(null);
      let parsed: any;
      try {
        parsed = await invoke("fetch_media_info", {
          url: url.trim(),
          cookiesBrowser: null,
          cookiesFile: null,
          proxy: null,
          discoveryArgs: null,
        });
      } catch (err) {
        parsed = await invoke("ytdlp_get_info", { url: url.trim() });
      }

      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch {}
      }

      // Map formats
      const rawFormats = parsed.videoStreams || parsed.video_streams || parsed.formats || [];
      const rawAudio = parsed.audioStreams || parsed.audio_streams || [];

      const videoStreams = rawFormats.map((f: any) => ({
        id: String(f.id || f.format_id),
        label: f.label || `${f.resolution || (f.height ? `${f.height}p` : "Video")} • ${(f.ext || "mp4").toUpperCase()} • ${f.fps ? `${Math.round(f.fps)}fps` : ""}`,
        ext: f.ext || "mp4",
      }));

      const audioStreams = rawAudio.map((f: any) => ({
        id: String(f.id || f.format_id),
        label: f.label || `${f.ext || "audio"} • ${f.abr ? `${Math.round(f.abr)}kbps` : "Audio"}`,
        ext: f.ext || "m4a",
      }));

      const info: MediaInfo = {
        title: parsed.title || "Online Media",
        uploader: parsed.uploader || "",
        duration: parsed.duration || 0,
        thumbnail: parsed.thumbnail || "",
        videoStreams,
        audioStreams,
        subtitles: parsed.subtitles || [],
      };

      setMediaInfo(info);
      if (videoStreams.length > 0) setSelectedFormatId(videoStreams[0].id);
      if (audioStreams.length > 0) setSelectedAudioId(audioStreams[0].id);
    } catch (err: any) {
      setErrorMessage("Failed to inspect media stream: " + (err?.message || err?.toString() || "Unknown error"));
    } finally {
      setIsFetchingMedia(false);
    }
  };

  const handleMediaSubmit = async () => {
    if (!url.trim()) return;
    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onAddMediaDownload({
        url: url.trim(),
        saveFolder,
        customFilename: customFilename.trim(),
        videoStreamId: selectedFormatId,
        audioStreamId: selectedAudioId,
        container,
        enableClip,
        startTime,
        endTime,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.toString() || "Failed to start media download");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-purple-500/25 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/15 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              🐐
            </div>
            <div>
              <h2 className="font-bold text-sm bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
                Add New Download
              </h2>
              <p className="text-[11px] text-slate-400">
                Segmented HTTP Engine & Media Extractor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-purple-500/15 bg-slate-950/30 px-6 pt-3 space-x-6">
          <button
            onClick={() => setTab("direct")}
            className={`pb-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all ${
              tab === "direct"
                ? "border-purple-400 text-purple-300 shadow-[0_2px_12px_rgba(168,85,247,0.3)]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Direct File (IDM Segmented)</span>
          </button>
          <button
            onClick={() => setTab("media")}
            className={`pb-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all ${
              tab === "media"
                ? "border-pink-400 text-pink-300 shadow-[0_2px_12px_rgba(244,114,182,0.3)]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film className="w-4 h-4 text-pink-400" />
            <span>Video & Social Media (yt-dlp)</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Target Download URL</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  tab === "direct"
                    ? "https://example.com/file.zip or .exe, .iso, .pdf..."
                    : "https://www.youtube.com/watch?v=... or Instagram / TikTok link"
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs glass-input font-mono text-slate-100"
                autoFocus
              />
              {tab === "media" && (
                <button
                  type="button"
                  onClick={handleFetchMediaInfo}
                  disabled={isFetchingMedia || !url.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  {isFetchingMedia ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Inspect</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Save Destination Folder */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Save Destination</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={saveFolder}
                onChange={(e) => setSaveFolder(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs glass-input font-mono text-slate-300"
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-purple-500/20 text-slate-300 hover:text-white hover:bg-purple-600/20 transition-colors"
                title="Browse folder"
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom Filename */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Custom Filename <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Leave empty to use server original name"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs glass-input text-slate-100"
            />
          </div>

          {/* Direct Mode Specifics: Simultaneous Segments */}
          {tab === "direct" && (
            <div className="space-y-2 pt-2 border-t border-purple-500/10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">
                  Simultaneous Download Segments (Threads)
                </span>
                <span className="font-mono font-bold text-cyan-400">
                  {connections} Chunks
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[4, 8, 12, 16].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setConnections(num)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      connections === num
                        ? "bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                        : "bg-slate-900/60 border-purple-500/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {num} Threads
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                Splits file via HTTP Range slicing for up to 500% faster acceleration.
              </p>
            </div>
          )}

          {/* Media Mode Specifics */}
          {tab === "media" && mediaInfo && (
            <div className="space-y-3 pt-2 border-t border-purple-500/10">
              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-950/60 border border-purple-500/20">
                {mediaInfo.thumbnail && (
                  <img
                    src={mediaInfo.thumbnail}
                    alt="Thumbnail"
                    className="w-16 h-10 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">
                    {mediaInfo.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {mediaInfo.uploader}
                  </p>
                </div>
              </div>

              {/* Stream Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Video Quality</label>
                <select
                  value={selectedFormatId}
                  onChange={(e) => setSelectedFormatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-200"
                >
                  {mediaInfo.videoStreams.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Container Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Format</label>
                <select
                  value={container}
                  onChange={(e) => setContainer(e.target.value as ContainerFormat)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-200"
                >
                  {ALL_CONTAINERS.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clipper Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setEnableClip(!enableClip)}
                  className="flex items-center space-x-2 text-xs font-medium text-purple-300 hover:text-purple-200"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>{enableClip ? "Disable Timeframe Clipper" : "Enable Timeframe Clipper"}</span>
                </button>
                {enableClip && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <span className="text-[10px] text-slate-400">Start (HH:MM:SS)</span>
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs glass-input font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">End (HH:MM:SS)</span>
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs glass-input font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-purple-500/15 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          {tab === "direct" ? (
            <button
              type="button"
              onClick={handleDirectSubmit}
              disabled={submitting || !url.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Start High-Speed Download</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMediaSubmit}
              disabled={submitting || !url.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(244,114,182,0.3)] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Film className="w-4 h-4" />
              )}
              <span>Download Media</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
