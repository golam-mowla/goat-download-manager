import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Film,
  Folder,
  Download,
  AlertCircle,
  Scissors,
  Loader2,
  Clipboard,
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
  onAddMediaDownload: (options: any) => Promise<void>;
  theme?: "dark" | "light";
}

export const AddDownloadModal: React.FC<AddDownloadModalProps> = ({
  isOpen,
  onClose,
  defaultUrl = "",
  onAddDirectDownload,
  onAddMediaDownload,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [tab, setTab] = useState<"direct" | "media">("direct");

  // Direct Download State
  const [url, setUrl] = useState(defaultUrl);
  const [customFilename, setCustomFilename] = useState("");
  const [saveFolder, setSaveFolder] = useState("");
  const [connections, setConnections] = useState(16);
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
        handleUrlDetection(cleanUrl);
      }
    }
  }, [defaultUrl]);

  const handleUrlDetection = (inputUrl: string) => {
    const lower = inputUrl.toLowerCase().trim();
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
  };

  // Load default downloads directory
  useEffect(() => {
    const fetchDefaultDir = async () => {
      try {
        const homeDir = await invoke<string>("get_default_download_dir");
        if (homeDir) setSaveFolder(homeDir);
      } catch {
        setSaveFolder("C:\\Users\\GM desktop\\Downloads");
      }
    };
    fetchDefaultDir();
  }, []);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const clean = text.trim();
        setUrl(clean);
        handleUrlDetection(clean);
        setErrorMessage(null);
      }
    } catch (e) {
      console.warn("Clipboard access error:", e);
    }
  };

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

  const handleDirectSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    try {
      setIsFetchingMedia(true);
      setErrorMessage(null);
      let parsed: any;
      try {
        parsed = await invoke("fetch_media_info", {
          url: cleanUrl,
          cookiesBrowser: null,
          cookiesFile: null,
          proxy: null,
          discoveryArgs: null,
        });
      } catch (err) {
        parsed = await invoke("ytdlp_get_info", { url: cleanUrl });
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
      setErrorMessage("Could not inspect stream. You can still click 'Download Media' directly: " + (err?.message || err?.toString() || "Stream check failed"));
    } finally {
      setIsFetchingMedia(false);
    }
  };

  const handleMediaSubmit = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onAddMediaDownload({
        url: cleanUrl,
        saveFolder,
        customFilename: customFilename.trim(),
        videoStreamId: selectedFormatId || "best",
        audioStreamId: selectedAudioId || "best",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden transition-colors ${
        isDark ? "bg-[#111827] border-[#1f2937] text-slate-100" : "bg-white border-slate-200 text-slate-900"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b transition-colors ${
          isDark ? "border-[#1f2937] bg-[#162032]" : "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-transparent flex-shrink-0">
              <img src="/icon.png" alt="Goat" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                Add New Download
              </h2>
              <p className={`text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Segmented HTTP Engine & Media Extractor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? "text-slate-400 hover:text-white hover:bg-[#1f2937]" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className={`flex border-b px-5 pt-2.5 space-x-6 transition-colors ${
          isDark ? "border-[#1f2937] bg-[#0d1424]" : "border-slate-200 bg-slate-100"
        }`}>
          <button
            onClick={() => setTab("direct")}
            className={`pb-2 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all ${
              tab === "direct"
                ? "border-blue-500 text-blue-500"
                : isDark ? "border-transparent text-slate-400 hover:text-slate-200" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Zap className="w-4 h-4 text-blue-500" />
            <span>Direct File (IDM Segmented)</span>
          </button>
          <button
            onClick={() => setTab("media")}
            className={`pb-2 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all ${
              tab === "media"
                ? "border-purple-500 text-purple-500"
                : isDark ? "border-transparent text-slate-400 hover:text-slate-200" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Film className="w-4 h-4 text-purple-500" />
            <span>Video & Social Media (yt-dlp)</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* URL Input with Paste Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Target Download URL
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 flex items-center space-x-1"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste from Clipboard</span>
              </button>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  handleUrlDetection(e.target.value);
                }}
                placeholder={
                  tab === "direct"
                    ? "Paste direct link (.zip, .exe, .mkv, .iso, .pdf)..."
                    : "Paste YouTube, Facebook, Instagram, or TikTok link..."
                }
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono border focus:border-blue-500 focus:outline-none transition-colors ${
                  isDark
                    ? "text-white bg-[#0d1424] border-[#253350]"
                    : "text-slate-900 bg-slate-50 border-slate-300 focus:bg-white placeholder:text-slate-400"
                }`}
                autoFocus
              />
              {tab === "media" && (
                <button
                  type="button"
                  onClick={handleFetchMediaInfo}
                  disabled={isFetchingMedia || !url.trim()}
                  className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
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
            <label className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Save Destination
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={saveFolder}
                onChange={(e) => setSaveFolder(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono border focus:border-blue-500 focus:outline-none transition-colors ${
                  isDark
                    ? "text-white bg-[#0d1424] border-[#253350]"
                    : "text-slate-900 bg-slate-50 border-slate-300 focus:bg-white"
                }`}
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className={`px-3.5 py-2 rounded-lg border transition-colors ${
                  isDark
                    ? "bg-[#1f2937] hover:bg-[#374151] border-[#253350] text-slate-200 hover:text-white"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900"
                }`}
                title="Browse folder"
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom Filename */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Custom Filename <span className={`${isDark ? "text-slate-400" : "text-slate-500"} font-normal`}>(Optional)</span>
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Leave empty to use server original name"
              className={`w-full px-3 py-2 rounded-lg text-xs border focus:border-blue-500 focus:outline-none transition-colors ${
                isDark
                  ? "text-white bg-[#0d1424] border-[#253350]"
                  : "text-slate-900 bg-slate-50 border-slate-300 focus:bg-white placeholder:text-slate-400"
              }`}
            />
          </div>

          {/* Direct Mode Specifics: Simultaneous Segments */}
          {tab === "direct" && (
            <div className={`space-y-2 pt-2 border-t ${isDark ? "border-[#1f2937]" : "border-slate-200"}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Simultaneous Download Segments (Threads)
                </span>
                <span className="font-mono font-bold text-blue-500">
                  {connections} Chunks (IDM Turbo)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[4, 8, 12, 16].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setConnections(num)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      connections === num
                        ? "bg-blue-600 border-blue-500 text-white"
                        : isDark
                        ? "bg-[#0d1424] border-[#1f2937] text-slate-300 hover:bg-[#162032] hover:text-white"
                        : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {num} Threads
                  </button>
                ))}
              </div>
              <p className={`text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Splits file into concurrent HTTP Range slices for maximum bandwidth saturation.
              </p>
            </div>
          )}

          {/* Media Mode Specifics */}
          {tab === "media" && mediaInfo && (
            <div className={`space-y-3 pt-2 border-t ${isDark ? "border-[#1f2937]" : "border-slate-200"}`}>
              <div className={`flex items-center space-x-3 p-2.5 rounded-lg border ${
                isDark ? "bg-[#0d1424] border-[#1f2937]" : "bg-slate-50 border-slate-200"
              }`}>
                {mediaInfo.thumbnail && (
                  <img
                    src={mediaInfo.thumbnail}
                    alt="Thumbnail"
                    className="w-16 h-10 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                    {mediaInfo.title}
                  </h4>
                  <p className={`text-[11px] truncate ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {mediaInfo.uploader}
                  </p>
                </div>
              </div>

              {/* Stream Picker */}
              {mediaInfo.videoStreams.length > 0 && (
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Video Quality
                  </label>
                  <select
                    value={selectedFormatId}
                    onChange={(e) => setSelectedFormatId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:border-blue-500 focus:outline-none transition-colors ${
                      isDark
                        ? "text-white bg-[#0d1424] border-[#253350]"
                        : "text-slate-900 bg-white border-slate-300 shadow-sm"
                    }`}
                  >
                    {mediaInfo.videoStreams.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className={isDark ? "bg-[#0d1424] text-white" : "bg-white text-slate-900"}
                      >
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Container Format */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Format Container
                </label>
                <select
                  value={container}
                  onChange={(e) => setContainer(e.target.value as ContainerFormat)}
                  className={`w-full px-3 py-2 rounded-lg text-xs border focus:border-blue-500 focus:outline-none transition-colors ${
                    isDark
                      ? "text-white bg-[#0d1424] border-[#253350]"
                      : "text-slate-900 bg-white border-slate-300 shadow-sm"
                  }`}
                >
                  {ALL_CONTAINERS.map((c) => (
                    <option
                      key={c}
                      value={c}
                      className={isDark ? "bg-[#0d1424] text-white" : "bg-white text-slate-900"}
                    >
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clipper Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setEnableClip(!enableClip)}
                  className="flex items-center space-x-2 text-xs font-semibold text-blue-500 hover:text-blue-600"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>{enableClip ? "Disable Timeframe Clipper" : "Enable Timeframe Clipper"}</span>
                </button>
                {enableClip && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <span className={`text-[10px] font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        Start (HH:MM:SS)
                      </span>
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded text-xs font-mono border focus:border-blue-500 focus:outline-none transition-colors ${
                          isDark ? "text-white bg-[#0d1424] border-[#253350]" : "text-slate-900 bg-slate-50 border-slate-300"
                        }`}
                      />
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        End (HH:MM:SS)
                      </span>
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded text-xs font-mono border focus:border-blue-500 focus:outline-none transition-colors ${
                          isDark ? "text-white bg-[#0d1424] border-[#253350]" : "text-slate-900 bg-slate-50 border-slate-300"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-end space-x-3 px-5 py-3 border-t transition-colors ${
          isDark ? "border-[#1f2937] bg-[#162032]" : "border-slate-200 bg-slate-50"
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cancel
          </button>

          {tab === "direct" ? (
            <button
              type="button"
              onClick={() => handleDirectSubmit()}
              disabled={submitting || !url.trim()}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
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
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
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
