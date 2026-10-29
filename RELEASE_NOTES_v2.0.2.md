# GM Downloader v2.0.2 🦜

Official cross-platform release of **GM Downloader v2.0.2** with native support for Windows, Android, Apple macOS, and Linux.

---

### 📱 Android Installation Files:
- **[GM-Downloader-arm64-v8a.apk](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.2/GM-Downloader-arm64-v8a.apk)** — Recommended for all modern 64-bit Android smartphones & tablets (Samsung, Xiaomi, Pixel, Realme, Vivo, Oppo, OnePlus, etc.).
- **[GM-Downloader-universal.apk](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.2/GM-Downloader-universal.apk)** — Universal build compatible with all Android devices (Android 7.0+ up to Android 15/16).
- **[GM-Downloader.apk](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.2/GM-Downloader.apk)** — Standard release package.

*How to install on Android:*
1. Download either `GM-Downloader-arm64-v8a.apk` or `GM-Downloader-universal.apk`.
2. Tap on the downloaded file in your browser or File Manager.
3. If prompted, allow "Install unknown apps" / "Unknown sources" for your browser/file manager.
4. Tap **Install** and enjoy!

---

### 💻 Desktop Installation Files:
- **[GM-Downloader-Setup.exe](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.2/GM-Downloader-Setup.exe)** — Windows installer with auto-desktop shortcut & start menu entry.
- **[GM-Downloader.exe](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.2/GM-Downloader.exe)** — Standalone portable Windows executable.
- **[GM-Downloader-Portable.zip](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.2/GM-Downloader-Portable.zip)** — Portable zip package.
- **[GM-Downloader-macOS.zip](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.2/GM-Downloader-macOS.zip)** — Apple macOS universal build.
- **[GM-Downloader-Linux.AppImage](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.2/GM-Downloader-Linux.AppImage)** & **[GM-Downloader-Linux.deb](https://github.com/golam-mowla/GM-Downloader/releases/download/v2.0.2/GM-Downloader-Linux.deb)** — Linux packages.

---

### 🧩 Browser Extension ("Download with Parrot"):
- Located in folder `browser-extension/` (and ready-to-load in `D:\Extensions\download-with-parrot`).
- **Right-Click Integration:** Right-click any video, reel, post, image, or link on Instagram, YouTube, Facebook, TikTok, Twitter/X, and choose **Download with Parrot 🦜**.
- Automatically extracts the exact video or post link (even from feed overlays and reels) and passes it directly to GM Downloader.
- Works seamlessly whether GM Downloader is already open or closed (via built-in background bridge and `parrot://` protocol).

---

### 🚀 What's New & Fixed in v2.0.2:
1. **Clean Link Field on Startup (No Leftover Links):**
   - Fixed issue where the previously entered or fetched link remained in the URL box when closing and reopening the app.
   - GM Downloader now always boots with a clean, empty link input ready for new downloads, while preserving all user preferences (quality, theme, download folder, etc.).

2. **Official "Download with Parrot" Chrome/Brave/Edge Extension:**
   - Manifest V3 browser extension for 1-click video grabbing.
   - Context menu item **"Download with Parrot 🦜"** on any video, post, or link.
   - Deep intelligence for Instagram (reels, posts, stories, feed articles), YouTube (shorts, videos, thumbnails), Facebook, TikTok, and X.
   - Floating in-page toast feedback when sending links to Parrot.

3. **Desktop Bridge & Protocol Scheme Support:**
   - Added native background HTTP bridge (`127.0.0.1:9666`) to accept incoming links in real-time without delay.
   - Windows Protocol Scheme (`parrot://` and `gmdownloader://`) auto-registration for instant single-click launching from browsers.
   - Single-instance handoff: passing a link when the app is already open focuses the existing window and immediately triggers quality inspection without spawning duplicate instances.

4. **Version Bump to v2.0.2:**
   - Updated package versions across Desktop (Tauri 2, Cargo, React) and Android (versionCode 4, versionName 2.0.2).
