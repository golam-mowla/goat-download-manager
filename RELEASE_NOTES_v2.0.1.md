# GM Downloader v2.0.1 🦜

Official cross-platform release of **GM Downloader v2.0.1** with native support for Windows, Android, Apple macOS, and Linux.

---

### 📱 Android Installation Files:
- **[GM-Downloader-arm64-v8a.apk](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.1/GM-Downloader-arm64-v8a.apk)** — Recommended for all modern 64-bit Android smartphones & tablets (Samsung, Xiaomi, Pixel, Realme, Vivo, Oppo, OnePlus, etc.).
- **[GM-Downloader-universal.apk](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.1/GM-Downloader-universal.apk)** — Universal build compatible with all Android devices (Android 7.0+ up to Android 15/16).
- **[GM-Downloader.apk](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.1/GM-Downloader.apk)** — Standard release package.

*How to install on Android:*
1. Download either `GM-Downloader-arm64-v8a.apk` or `GM-Downloader-universal.apk`.
2. Tap on the downloaded file in your browser or File Manager.
3. If prompted, allow "Install unknown apps" / "Unknown sources" for your browser/file manager.
4. Tap **Install** and enjoy!

---

### 💻 Desktop Installation Files:
- **[GM-Downloader-Setup.exe](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.1/GM-Downloader-Setup.exe)** — Windows installer with auto-desktop shortcut & start menu entry.
- **[GM-Downloader.exe](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.1/GM-Downloader.exe)** — Standalone portable Windows executable.
- **[GM-Downloader-Portable.zip](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.1/GM-Downloader-Portable.zip)** — Portable zip package.
- **[GM-Downloader-macOS.zip](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.1/GM-Downloader-macOS.zip)** — Apple macOS universal build.
- **[GM-Downloader-Linux.AppImage](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.1/GM-Downloader-Linux.AppImage)** & **[GM-Downloader-Linux.deb](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.1/GM-Downloader-Linux.deb)** — Linux packages.

---

### 🚀 What's New & Fixed in v2.0.1:
1. **Precise Cut & Instant Timeframe Clipping:**
   - Switched to native `--download-sections "*START-END"` — downloads **only** the selected timeframe in seconds without downloading the full video first.
   - Millisecond-accurate cutting with `--force-keyframes-at-cuts` re-encoding when Precise Cut is checked, and fast stream-copy when unchecked.
   - Automatic cleanup with `--no-keep-fragments` to ensure no leftover broken fragment files (`.part-Frag12.part`, `.ytdl`).

2. **Dedicated Active Downloads Panel & Multi-Task Tracking:**
   - Concurrent downloads now run independently with multi-process architecture (`HashMap<String, u32>`).
   - Each active download gets its own dedicated card in the **Active Downloads** panel with its own progress bar, live speed, ETA, and individual Pause/Resume button.
   - History tab also tracks real-time progress, speed, and ETA for each task without collisions.

3. **Robust Link Fetching & Bot Protection Bypass:**
   - Fixed executable metadata fetching: automatically searches executable directory, system PATH, user tools, and local app data.
   - Added automatic standalone `yt-dlp` download fallback so `GM Downloader` works out-of-the-box on fresh Windows/Linux installs.
   - Multi-client retry mechanism: tries Android client, iOS client, and Web clients with `--no-check-certificates` to bypass YouTube bot blocks and age restrictions.
   - Robust JSON extraction between `{` and `}` to prevent console warnings from breaking parser.

4. **Branding & Versioning:**
   - Renamed version badge to clean `v2.0.1` (dropped "Pro Edition").
   - Transparent background borderless parrot logo across all platforms.
