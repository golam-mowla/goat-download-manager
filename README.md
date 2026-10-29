# 🐐 GDM - Goat Download Manager

<div align="center">
  <img src="public/goat-logo.jpg" alt="Goat Download Manager Logo" width="128" style="border-radius: 50%; box-shadow: 0 0 25px rgba(168,85,247,0.5);" />
  <h3>The Ultimate High-Speed Segmented HTTP & Media Downloader</h3>
  <p>Merging the speed and multi-threaded chunk slicing of Internet Download Manager (IDM) with the intelligent media capabilities of yt-dlp & FFmpeg.</p>
</div>

---

## ⚡ Highlights & Key Capabilities

### 1. 🚀 High-Speed Multi-Threaded HTTP Chunk Engine (IDM Style)
- **8–16 Simultaneous Connections**: Splits files using HTTP `Range` headers into concurrent slices for maximum bandwidth acceleration.
- **Auto-Assembly**: Assembles chunks in order on completion with SHA integrity checking.
- **Pause & Resume**: Seamless pause, resume, and cancellation tracking individual byte offsets.
- **Smart Queue Manager**: Configurable concurrency slots (default 3 active downloads), auto-queuing, and bandwidth scheduling.

### 2. 🎬 Media & Social Stream Extractor (yt-dlp + FFmpeg)
- Full support for **YouTube, Instagram Reels, TikTok, Facebook, Twitter/X, Twitch, Vimeo**, and 1,000+ sites.
- **Video Qualities**: 4K UHD (2160p), 2K (1440p), 1080p Full HD, 60fps support with AV1, VP9, and H.264 codecs.
- **Audio Extraction**: Direct conversion to MP3, M4A, FLAC, WAV, OPUS with up to 320 kbps bitrates.
- **Timeframe Clipper**: Download exact video or audio segments with keyframe-accurate cutting.
- **Subtitles & Metadata**: Embed subtitles (.srt, .vtt) and album artwork directly into the media container.

### 3. 🎨 Ultra-Modern Glassmorphic Dark UI
- **Zero Load-Time Lag**: Super lightweight, built with React 18, Vite, and Tailwind CSS.
- **Deep Purple & Black Aesthetics**: Ambient glassmorphism with subtle neon glowing accents.
- **Live Recharts Telemetry**: Real-time download velocity charts and transfer speed graphs.
- **IDM Segment Inspector**: Interactive visualization showing the real-time progress of each parallel chunk thread.
- **Sidebar Categorization**: Automatic sorting into *All*, *Videos*, *Audio*, *Documents*, *Compressed*, and *Programs*.

### 4. 🧩 Browser Extension Integration (Chrome, Edge, Brave, Opera)
- **Automatic Download Interception**: Automatically detects and catches downloads for file types like `.zip`, `.exe`, `.msi`, `.iso`, `.pdf`, `.mp4`, `.mkv`, `.apk`, cancelling the single-threaded browser download and accelerating it via GDM.
- **Right-Click Context Menu**: Send any video, audio, or link to GDM with 1 click.
- **Local Bridge Server**: Dual communication via HTTP bridge on `http://127.0.0.1:9666` and custom Windows protocol `gdm://open?url=...`.

---

## 🏛️ Architecture

```
gdm/
├── src/                          # Modern React 18 + TypeScript Frontend
│   ├── components/
│   │   ├── Sidebar.tsx           # Categories, Goat logo, Preferences
│   │   ├── TopBar.tsx            # Real-time search, filter, speed meter
│   │   ├── DownloadItemCard.tsx  # Download card with IDM chunk visualizer
│   │   ├── SpeedChart.tsx        # Recharts live velocity sparkline
│   │   └── AddDownloadModal.tsx  # Dual HTTP / yt-dlp download modal
│   ├── types.ts                  # Type definitions
│   └── App.tsx                   # Main dashboard & Tauri event bridge
├── src-tauri/                    # Rust Backend & Tauri 2 Native Layer
│   ├── src/
│   │   ├── downloader.rs         # Multi-threaded chunk slicing & assembly
│   │   ├── queue.rs              # Concurrent task queue & scheduler
│   │   ├── media.rs              # yt-dlp & FFmpeg process manager
│   │   ├── lib.rs                # Tauri commands, bridge (:9666), protocols
│   │   └── main.rs               # Desktop entrypoint
│   └── Cargo.toml                # Rust dependencies (tokio, reqwest, etc.)
└── browser-extension/            # Manifest V3 Browser Assistant
    ├── background.js             # IDM-style chrome.downloads interceptor
    ├── manifest.json             # Extension permissions & metadata
    └── popup.html / popup.js     # Quick popup link sender
```

---

## 🛠️ Development & Building

### Prerequisites:
- **Node.js**: v18+ (tested on v22)
- **Rust**: 1.80+ (with `stable-x86_64-pc-windows-gnullvm` or `stable-x86_64-pc-windows-msvc`)

### Setup:
```bash
# Clone the repository
git clone https://github.com/golam-mowla/goat-download-manager.git
cd goat-download-manager

# Install npm packages
npm install

# Build frontend
npm run build

# Run in desktop dev mode
npm run tauri dev
```

---

## 📄 License
MIT License. Created by [Golam Mowla](https://github.com/golam-mowla).
