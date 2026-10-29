import React, { useState } from "react";
import {
  Palette,
  Download,
  Zap,
  Wrench,
  FolderOpen,
  RotateCcw,
} from "lucide-react";
import { DownloadOptions } from "../types";

interface SettingsTabProps {
  options: DownloadOptions;
  setOptions: React.Dispatch<React.SetStateAction<DownloadOptions>>;
  onBrowseCookiesFile: () => void;
  onResetDefaults: () => void;
}

type CategoryKey = "ui" | "downloads" | "downloader" | "converter";

export const SettingsTab: React.FC<SettingsTabProps> = ({
  options,
  setOptions,
  onBrowseCookiesFile,
  onResetDefaults,
}) => {
  const [activeCategory, setActiveCategory] =
    useState<CategoryKey>("downloads");

  const update = <K extends keyof DownloadOptions>(
    key: K,
    value: DownloadOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const ToggleRow = ({
    title,
    desc,
    checked,
    onChange,
  }: {
    title: string;
    desc: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
      <div>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {desc}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
          checked
            ? "bg-gradient-to-r from-cyan-500 to-indigo-600"
            : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Sidebar Categories (4 Sections from User's Screenshots) */}
      <div className="md:col-span-4 lg:col-span-3 space-y-2">
        <div className="neon-card p-3 space-y-1.5">
          <div className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Options Categories
          </div>

          <button
            type="button"
            onClick={() => setActiveCategory("ui")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeCategory === "ui"
                ? "neon-btn-primary"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Palette className="w-4 h-4" />
            User Interface
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("downloads")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeCategory === "downloads"
                ? "neon-btn-primary"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Download className="w-4 h-4" />
            Downloads
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("downloader")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeCategory === "downloader"
                ? "neon-btn-primary"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Zap className="w-4 h-4" />
            Downloader
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("converter")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeCategory === "converter"
                ? "neon-btn-primary"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Wrench className="w-4 h-4" />
            Converter
          </button>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onResetDefaults}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Default Options
            </button>
          </div>
        </div>
      </div>

      {/* Category Panel Content */}
      <div className="md:col-span-8 lg:col-span-9">
        {/* 1. USER INTERFACE */}
        {activeCategory === "ui" && (
          <div className="neon-card p-5 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              🎨 User Interface Options
            </h3>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold">Theme</div>
                <div className="text-xs text-slate-500">
                   The theme for the user interface.
                </div>
              </div>
              <select
                value={options.theme}
                onChange={(e) =>
                  update("theme", e.target.value as DownloadOptions["theme"])
                }
                className="neon-input px-3 py-2 text-xs sm:text-sm font-bold w-48"
              >
                <option value="Light (White Neon)">Light (White Neon)</option>
                <option value="System">System</option>
                <option value="Dark">Dark</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold">Translation Language</div>
                <div className="text-xs text-slate-500">
                  The language to use for interface text.
                </div>
              </div>
              <select
                value={options.translationLanguage}
                onChange={(e) => update("translationLanguage", e.target.value)}
                className="neon-input px-3 py-2 text-xs sm:text-sm font-bold w-48"
              >
                <option value="Default (en-US)">Default (en-US)</option>
                <option value="Bengali (bn-BD)">Bengali (bn-BD)</option>
              </select>
            </div>

            <ToggleRow
              title="Receive Preview Updates"
              desc="If enabled, you will receive preview/nightly updates of GM Downloader."
              checked={options.receivePreviewUpdates}
              onChange={(v) => update("receivePreviewUpdates", v)}
            />

            <ToggleRow
              title="Prevent Suspend"
              desc="If enabled, the system will be prevented from suspending while downloads are running."
              checked={options.preventSuspend}
              onChange={(v) => update("preventSuspend", v)}
            />

            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="text-sm font-bold">Download History Length</div>
                <div className="text-xs text-slate-500">
                  The amount of time to keep past downloads in the app&apos;s history.
                </div>
              </div>
              <select
                value={options.historyLength}
                onChange={(e) => update("historyLength", e.target.value)}
                className="neon-input px-3 py-2 text-xs sm:text-sm font-bold w-48"
              >
                <option value="Forever">Forever</option>
                <option value="One Month">One Month</option>
                <option value="One Week">One Week</option>
                <option value="One Day">One Day</option>
              </select>
            </div>
          </div>
        )}

        {/* 2. DOWNLOADS */}
        {activeCategory === "downloads" && (
          <div className="neon-card p-5 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              📥 Downloads Options
            </h3>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold">
                  Maximum Number of Active Downloads
                </div>
                <div className="text-xs text-slate-500">
                  The number of active downloads allowed to run at a time (1–10).
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "maxActiveDownloads",
                      Math.max(1, options.maxActiveDownloads - 1)
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-extrabold text-sm border border-slate-300 dark:border-slate-700"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={options.maxActiveDownloads}
                  onChange={(e) =>
                    update(
                      "maxActiveDownloads",
                      Math.max(1, Math.min(10, Number(e.target.value) || 5))
                    )
                  }
                  className="neon-input w-16 py-1.5 text-center text-sm font-bold"
                />
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "maxActiveDownloads",
                      Math.min(10, options.maxActiveDownloads + 1)
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-extrabold text-sm border border-slate-300 dark:border-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            <ToggleRow
              title="Overwrite Existing Files"
              desc="If enabled, existing files in the destination folder will be overwritten."
              checked={options.overwriteFiles}
              onChange={(v) => update("overwriteFiles", v)}
            />

            <ToggleRow
              title="Include Media Id in Title after Validation"
              desc="If enabled, the media's unique ID will be appended to the default filename."
              checked={options.includeMediaId}
              onChange={(v) => update("includeMediaId", v)}
            />

            <ToggleRow
              title="Include Auto-Generated Subtitles"
              desc="If enabled, auto-generated subtitles will be shown and available to download."
              checked={options.includeAutoSubtitles}
              onChange={(v) => update("includeAutoSubtitles", v)}
            />

            <ToggleRow
              title="Include Super Resolution Formats"
              desc="If enabled, AI super-resolution / enhanced bitrate streams will be included."
              checked={options.includeSuperRes}
              onChange={(v) => update("includeSuperRes", v)}
            />

            <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold">Preferred Video Codec</div>
                <div className="text-xs text-slate-500">
                  The video codec GM Downloader should prefer when selecting media formats to download.
                </div>
              </div>
              <select
                value={options.preferredVideoCodec}
                onChange={(e) => update("preferredVideoCodec", e.target.value)}
                className="neon-input px-3 py-2 text-xs sm:text-sm font-bold w-44"
              >
                <option value="Any">Any</option>
                <option value="H.264 (AVC)">H.264 (AVC)</option>
                <option value="VP9">VP9</option>
                <option value="AV1">AV1</option>
                <option value="H.265 (HEVC)">H.265 (HEVC)</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold">Preferred Audio Codec</div>
                <div className="text-xs text-slate-500">
                  The audio codec GM Downloader should prefer when selecting media formats to download.
                </div>
              </div>
              <select
                value={options.preferredAudioCodec}
                onChange={(e) => update("preferredAudioCodec", e.target.value)}
                className="neon-input px-3 py-2 text-xs sm:text-sm font-bold w-44"
              >
                <option value="Any">Any</option>
                <option value="AAC (mp4a)">AAC (mp4a)</option>
                <option value="Opus">Opus</option>
                <option value="MP3">MP3</option>
                <option value="FLAC">FLAC</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold">Preferred Subtitle Format</div>
                <div className="text-xs text-slate-500">
                  The file format GM Downloader should ensure all downloaded subtitles are formatted as.
                </div>
              </div>
              <select
                value={options.preferredSubtitleFormat}
                onChange={(e) =>
                  update("preferredSubtitleFormat", e.target.value)
                }
                className="neon-input px-3 py-2 text-xs sm:text-sm font-bold w-44"
              >
                <option value="Any">Any</option>
                <option value="SRT">SRT</option>
                <option value="VTT">VTT</option>
                <option value="ASS">ASS</option>
                <option value="LRC">LRC</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="text-sm font-bold">Preferred Frame Rate</div>
                <div className="text-xs text-slate-500">
                  Prefer high FPS (60fps) or standard FPS when selecting streams.
                </div>
              </div>
              <select
                value={options.preferredFps}
                onChange={(e) => update("preferredFps", e.target.value)}
                className="neon-input px-3 py-2 text-xs sm:text-sm font-bold w-44"
              >
                <option value="Any (Highest)">Any (Highest)</option>
                <option value="60 FPS">60 FPS</option>
                <option value="30 FPS">30 FPS</option>
              </select>
            </div>
          </div>
        )}

        {/* 3. DOWNLOADER */}
        {activeCategory === "downloader" && (
          <div className="space-y-4">
            <div className="neon-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                ⚡ Downloader Engine Options
              </h3>

              <ToggleRow
                title="Use Part Files"
                desc="Download in .part files and auto-resume from exact byte if internet or power disconnects."
                checked={options.usePartFiles}
                onChange={(v) => update("usePartFiles", v)}
              />

              <ToggleRow
                title="Use SponsorBlock for YouTube"
                desc="If enabled, GM Downloader will apply the SponsorBlock extension to YouTube downloads."
                checked={options.sponsorBlock}
                onChange={(v) => update("sponsorBlock", v)}
              />

              <ToggleRow
                title="Limit Download Speed"
                desc="If enabled, downloads will be throttled to the speed limit configured below."
                checked={options.limitSpeed}
                onChange={(v) => update("limitSpeed", v)}
              />

              <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-sm font-bold">Speed Limit (KB/s)</div>
                  <div className="text-xs text-slate-500">
                    Speed limit in KB/s applied only when Limit Download Speed is enabled.
                  </div>
                </div>
                <input
                  type="number"
                  value={options.speedLimitKb}
                  onChange={(e) =>
                    update("speedLimitKb", Number(e.target.value) || 1024)
                  }
                  className="neon-input w-36 px-3 py-1.5 text-sm font-bold text-center"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-sm font-bold">Proxy URL</div>
                  <div className="text-xs text-slate-500">
                    The URL of the proxy server to use (e.g. http://127.0.0.1:8080 or socks5://...).
                  </div>
                </div>
                <input
                  type="text"
                  value={options.proxy}
                  onChange={(e) => update("proxy", e.target.value)}
                  placeholder="Optional proxy URL"
                  className="neon-input sm:w-64 px-3 py-1.5 text-xs sm:text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-sm font-bold">Cookies from File</div>
                  <div className="text-xs text-slate-500">
                    A Netscape .txt file of cookies to pass to yt-dlp when downloading engine.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={options.cookiesFile}
                    onChange={(e) => update("cookiesFile", e.target.value)}
                    placeholder="No file selected"
                    className="neon-input sm:w-48 px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={onBrowseCookiesFile}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center gap-1"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Select
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <div className="text-sm font-bold">Cookies from Browser</div>
                  <div className="text-xs text-slate-500">
                    Browser to extract login cookies from (solves age-restricted / private videos).
                  </div>
                </div>
                <select
                  value={options.cookiesBrowser}
                  onChange={(e) => update("cookiesBrowser", e.target.value)}
                  className="neon-input px-3 py-2 text-xs sm:text-sm font-bold w-44"
                >
                  <option value="None">None</option>
                  <option value="Chrome">Chrome</option>
                  <option value="Edge">Edge</option>
                  <option value="Firefox">Firefox</option>
                  <option value="Brave">Brave</option>
                  <option value="Opera">Opera</option>
                </select>
              </div>
            </div>

            {/* aria2c Sub-Card */}
            <div className="neon-card p-5 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-600">
                aria2c Multi-Connection Accelerator
              </h4>
              <ToggleRow
                title="Use aria2c"
                desc="If enabled, GM Downloader will use aria2c for ultra-fast multi-connection downloading."
                checked={options.useAria2c}
                onChange={(v) => update("useAria2c", v)}
              />
              <div className="flex items-center justify-between gap-4 pt-2">
                <div>
                  <div className="text-sm font-bold">
                    Maximum Connections Per Server (-x)
                  </div>
                  <div className="text-xs text-slate-500">
                    Number of parallel connections per server (1–16).
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={options.aria2Connections}
                  onChange={(e) =>
                    update(
                      "aria2Connections",
                      Math.max(1, Math.min(16, Number(e.target.value) || 16))
                    )
                  }
                  className="neon-input w-24 px-3 py-1.5 text-sm font-bold text-center"
                />
              </div>
            </div>

            {/* Advanced Sub-Card */}
            <div className="neon-card p-5 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-600">
                Advanced yt-dlp Arguments
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    yt-dlp Discovery Arguments
                  </label>
                  <input
                    type="text"
                    value={options.ytdlpDiscoveryArgs}
                    onChange={(e) =>
                      update("ytdlpDiscoveryArgs", e.target.value)
                    }
                    placeholder="Extra arguments passed during link quality fetch"
                    className="neon-input w-full px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    yt-dlp Download Arguments
                  </label>
                  <input
                    type="text"
                    value={options.ytdlpDownloadArgs}
                    onChange={(e) =>
                      update("ytdlpDownloadArgs", e.target.value)
                    }
                    placeholder="Extra arguments passed during media downloading"
                    className="neon-input w-full px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CONVERTER */}
        {activeCategory === "converter" && (
          <div className="neon-card p-5 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              🛠️ Converter &amp; FFmpeg Post-Processing
            </h3>

            <ToggleRow
              title="Translate Metadata and Chapters"
              desc="If enabled, metadata and chapters will be translated to the system's language."
              checked={options.translateMetadata}
              onChange={(v) => update("translateMetadata", v)}
            />

            <ToggleRow
              title="Embed Metadata"
              desc="If enabled, relevant information (title, artist, date) will be tagged in the file."
              checked={options.embedMetadata}
              onChange={(v) => update("embedMetadata", v)}
            />

            <ToggleRow
              title="Embed Thumbnails"
              desc="If enabled, a file will be tagged with its cover art thumbnail if available."
              checked={options.embedThumbnails}
              onChange={(v) => update("embedThumbnails", v)}
            />

            <ToggleRow
              title="Crop Audio Thumbnails"
              desc="If enabled, thumbnails for audio files will be cropped to a 1:1 square album cover."
              checked={options.cropAudioThumbnails}
              onChange={(v) => update("cropAudioThumbnails", v)}
            />

            <ToggleRow
              title="Embed Chapters"
              desc="If enabled, media files will be tagged with chapter markers if available."
              checked={options.embedChapters}
              onChange={(v) => update("embedChapters", v)}
            />

            <ToggleRow
              title="Split Video by Chapters"
              desc="If enabled, each chapter marker will be exported as a separate file."
              checked={options.splitChapters}
              onChange={(v) => update("splitChapters", v)}
            />

            <ToggleRow
              title="Embed Subtitles"
              desc="If enabled, subtitles will be embedded inside the downloaded media container."
              checked={options.embedSubtitlesGlobal}
              onChange={(v) => update("embedSubtitlesGlobal", v)}
            />

            <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold">FFmpeg Threads</div>
                <div className="text-xs text-slate-500">
                  Limit the number of CPU threads used by FFmpeg when muxing/converting.
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "ffmpegThreads",
                      Math.max(1, options.ffmpegThreads - 1)
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-extrabold text-sm border border-slate-300 dark:border-slate-700"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={32}
                  value={options.ffmpegThreads}
                  onChange={(e) =>
                    update(
                      "ffmpegThreads",
                      Math.max(1, Math.min(32, Number(e.target.value) || 4))
                    )
                  }
                  className="neon-input w-16 py-1.5 text-center text-sm font-bold"
                />
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "ffmpegThreads",
                      Math.min(32, options.ffmpegThreads + 1)
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-extrabold text-sm border border-slate-300 dark:border-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-bold mb-1">
                Post-Processor Arguments (FFmpeg)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Extra arguments passed to FFmpeg during post-processing of downloads.
              </p>
              <input
                type="text"
                value={options.postProcessorArgs}
                onChange={(e) => update("postProcessorArgs", e.target.value)}
                placeholder="e.g. -movflags +faststart"
                className="neon-input w-full px-3.5 py-2 text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
