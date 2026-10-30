// Goat Download Manager (GDM) - Background Service Worker (Manifest V3)
// IDM-Style High-Speed Interception & Passive Media Stream Sniffer

const GDM_BRIDGE_PORT = 9666;
const GDM_BRIDGE_URL = `http://127.0.0.1:${GDM_BRIDGE_PORT}`;

// Interceptable file extensions for IDM-style capture
const INTERCEPT_EXTENSIONS = new Set([
  // Archives
  "zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "tgz",
  // Executables & Installers
  "exe", "msi", "dmg", "pkg", "deb", "rpm", "apk", "appx", "msix",
  // Media files
  "mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "mp3", "flac", "wav", "m4a", "aac", "ogg",
  // Documents
  "pdf", "epub", "mobi",
  // Disk / Data
  "img", "vhd", "vmdk", "bin"
]);

// Keep track of downloads we are actively intercepting to avoid loops
const interceptedDownloadIds = new Set();

// Passive media stream sniffer cache: tabId -> Map(streamUrl -> streamInfo)
const tabMediaStreams = new Map();

// Helper to format human byte size
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// 1. Passive Media Stream Sniffing (IDM method: listens to HTTP response headers)
// ---------------------------------------------------------------------------
if (chrome.webRequest && chrome.webRequest.onHeadersReceived) {
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      try {
        if (!details.url || !details.responseHeaders) return;
        const tabId = details.tabId;
        if (tabId < 0) return;

        let contentType = "";
        let contentLength = 0;

        for (const h of details.responseHeaders) {
          const name = h.name.toLowerCase();
          if (name === "content-type") contentType = h.value.toLowerCase();
          if (name === "content-length") contentLength = parseInt(h.value, 10) || 0;
        }

        const urlLower = details.url.toLowerCase();
        const isMediaMime =
          contentType.startsWith("video/") ||
          contentType.startsWith("audio/") ||
          contentType.includes("application/x-mpegurl") ||
          contentType.includes("application/vnd.apple.mpegurl") ||
          contentType.includes("application/dash+xml");

        const isMediaExt =
          urlLower.includes(".mp4") ||
          urlLower.includes(".mkv") ||
          urlLower.includes(".webm") ||
          urlLower.includes(".m3u8") ||
          urlLower.includes(".m4s") ||
          urlLower.includes("videoplayback");

        if (isMediaMime || isMediaExt) {
          if (!tabMediaStreams.has(tabId)) {
            tabMediaStreams.set(tabId, new Map());
          }
          const streams = tabMediaStreams.get(tabId);
          if (!streams.has(details.url)) {
            let quality = "";
            // Detect resolution from YouTube videoplayback itags or url params
            if (urlLower.includes("itag=137") || urlLower.includes("itag=399")) quality = "1080p HD";
            else if (urlLower.includes("itag=22") || urlLower.includes("itag=136") || urlLower.includes("itag=298")) quality = "720p HD";
            else if (urlLower.includes("itag=135") || urlLower.includes("itag=244")) quality = "480p";
            else if (urlLower.includes("itag=18") || urlLower.includes("itag=134")) quality = "360p";
            else if (urlLower.includes("itag=140") || urlLower.includes("mime=audio")) quality = "Audio Only";
            else if (urlLower.includes("1080")) quality = "1080p HD";
            else if (urlLower.includes("720")) quality = "720p HD";
            else if (urlLower.includes("480")) quality = "480p";

            const streamInfo = {
              url: details.url,
              contentType,
              contentLength,
              sizeFormatted: formatBytes(contentLength),
              quality,
              timestamp: Date.now(),
            };
            streams.set(details.url, streamInfo);

            // Notify content script on the tab
            chrome.tabs.sendMessage(tabId, {
              action: "MEDIA_SNIFFED",
              stream: streamInfo,
            }).catch(() => {});
          }
        }
      } catch (e) {}
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
  );
}

// Clean up tab streams when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabMediaStreams.delete(tabId);
});

// Clean up on tab navigation / reload
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    tabMediaStreams.delete(tabId);
  }
});

// Create Context Menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "download-with-gdm",
      title: "Download with Goat (GDM) 🐐",
      contexts: ["all"],
    });
  });
});

// Intercept standard HTTP/HTTPS file downloads (IDM style)
async function handleDownloadInterception(downloadItem, suggest) {
  try {
    const rawUrl = downloadItem.finalUrl || downloadItem.url;
    if (!rawUrl || !rawUrl.startsWith("http")) return false;

    // Check if filename or url matches intercept extensions
    let ext = "";
    if (downloadItem.filename) {
      const match = downloadItem.filename.match(/\.([a-zA-Z0-9]+)$/);
      if (match) ext = match[1].toLowerCase();
    }
    if (!ext) {
      try {
        const pathname = new URL(rawUrl).pathname;
        const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
        if (match) ext = match[1].toLowerCase();
      } catch (e) {}
    }

    if (INTERCEPT_EXTENSIONS.has(ext)) {
      const storage = await chrome.storage.local.get(["interceptDownloads"]);
      if (storage.interceptDownloads === false) {
        return false; // User disabled interception in popup/settings
      }

      if (interceptedDownloadIds.has(downloadItem.id)) return true;
      interceptedDownloadIds.add(downloadItem.id);

      // Cancel the browser's native download immediately before Brave/Chrome shows Save As dialog
      try {
        chrome.downloads.cancel(downloadItem.id, () => {
          chrome.downloads.erase({ id: downloadItem.id }, () => {});
        });
      } catch (e) {}

      // Show desktop notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Goat Download Manager 🐐",
        message: `Intercepted high-speed download:\n${downloadItem.filename || ext.toUpperCase() + " file"}`,
        priority: 2,
      });

      // Forward to GDM Desktop Engine
      const cleanFilename = downloadItem.filename ? downloadItem.filename.replace(/^.*[\\\/]/, "") : "";
      await sendUrlToGdm(rawUrl, null, cleanFilename, null, false);
      return true;
    }
  } catch (err) {
    console.error("Error intercepting download:", err);
  }
  return false;
}

// Attach to onDeterminingFilename to suppress Brave's native file-picker prompt
if (chrome.downloads && chrome.downloads.onDeterminingFilename) {
  chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    handleDownloadInterception(downloadItem, suggest).then((intercepted) => {
      if (!intercepted && suggest) {
        suggest();
      }
    });
    return true; // Keep callback channel open for async determination
  });
}

// Fallback listener for downloads created directly
chrome.downloads.onCreated.addListener((downloadItem) => {
  handleDownloadInterception(downloadItem);
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "download-with-gdm" || info.menuItemId === "download-with-parrot") {
    let candidateUrl = "";

    // 1. Ask content script for detected element URL
    if (tab && tab.id) {
      try {
        const resp = await chrome.tabs.sendMessage(tab.id, {
          action: "GET_LAST_CLICKED_MEDIA",
        });
        if (resp && resp.url) {
          candidateUrl = resp.url;
        }
      } catch (e) {}
    }

    // 2. Fallbacks from contextMenus info
    const isClean = (u) =>
      u &&
      typeof u === "string" &&
      !u.startsWith("blob:") &&
      !u.startsWith("data:") &&
      (u.startsWith("http://") || u.startsWith("https://"));

    if (!isClean(candidateUrl)) {
      if (isClean(info.linkUrl)) {
        candidateUrl = info.linkUrl;
      } else if (isClean(info.srcUrl)) {
        candidateUrl = info.srcUrl;
      } else if (info.selectionText && isClean(info.selectionText.trim())) {
        candidateUrl = info.selectionText.trim();
      } else if (isClean(info.pageUrl)) {
        candidateUrl = info.pageUrl;
      } else if (tab && isClean(tab.url)) {
        candidateUrl = tab.url;
      }
    }

    if (!isClean(candidateUrl)) {
      if (tab && isClean(tab.url)) {
        candidateUrl = tab.url;
      } else {
        return;
      }
    }

    await sendUrlToGdm(candidateUrl, tab ? tab.id : null);
  }
});

// Send URL to GDM Desktop App
async function sendUrlToGdm(mediaUrl, tabId, customFilename, quality, autoStart = false) {
  let cleanUrl = (mediaUrl || "").trim();
  if (!cleanUrl) return;

  // Resolve active tab if not passed
  let effectiveTabId = tabId;
  if (!effectiveTabId) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        effectiveTabId = activeTab.id;
      }
    } catch {}
  }

  // Notify tab that request is in progress
  if (effectiveTabId) {
    try {
      await chrome.tabs.sendMessage(effectiveTabId, {
        action: "SHOW_TOAST",
        title: "Goat Download Manager 🐐",
        message: quality ? `Sending ${quality} stream to GDM Engine...` : "Sending link to GDM engine...",
        status: "info",
      });
    } catch {}
  }

  // 1. Try sending to local bridge HTTP server (if app is running)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1400);

    const filenameParam = customFilename ? `&filename=${encodeURIComponent(customFilename)}` : "";
    const qualityParam = quality ? `&quality=${encodeURIComponent(quality)}` : "";
    const autoParam = autoStart ? `&autostart=true` : "";
    const bridgeEndpoint = `${GDM_BRIDGE_URL}/open?url=${encodeURIComponent(cleanUrl)}${filenameParam}${qualityParam}${autoParam}`;
    const resp = await fetch(bridgeEndpoint, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      if (effectiveTabId) {
        try {
          await chrome.tabs.sendMessage(effectiveTabId, {
            action: "SHOW_TOAST",
            title: "Goat Download Manager 🐐",
            message: quality ? `${quality} Download started in GDM!` : "Link sent to GDM! Download starting...",
            status: "success",
          });
        } catch {}
      }
      return { success: true, method: "bridge" };
    }
  } catch (err) {
    // Local bridge not active (app might be closed or starting)
  }

  // 2. Launch GDM via custom Windows protocol
  const filenameParam = customFilename ? `&filename=${encodeURIComponent(customFilename)}` : "";
  const qualityParam = quality ? `&quality=${encodeURIComponent(quality)}` : "";
  const autoParam = autoStart ? `&autostart=true` : "";
  const protocolUrl = `gdm://open?url=${encodeURIComponent(cleanUrl)}${filenameParam}${qualityParam}${autoParam}`;

  if (effectiveTabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: effectiveTabId },
        func: (proto, raw) => {
          navigator.clipboard.writeText(raw).catch(() => {});
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = proto;
          document.body.appendChild(iframe);
          setTimeout(() => iframe.remove(), 2500);
        },
        args: [protocolUrl, cleanUrl],
      });

      await chrome.tabs.sendMessage(effectiveTabId, {
        action: "SHOW_TOAST",
        title: "Goat Download Manager 🐐",
        message: "Opening GDM desktop app...",
        status: "info",
      });

      return { success: true, method: "protocol" };
    } catch (e) {
      chrome.tabs.create({ url: protocolUrl, active: false }, (t) => {
        setTimeout(() => chrome.tabs.remove(t.id), 2000);
      });
    }
  } else {
    chrome.tabs.create({ url: protocolUrl, active: false }, (t) => {
      setTimeout(() => chrome.tabs.remove(t.id), 2000);
    });
  }

  return { success: true, method: "protocol" };
}

// Listen to messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SEND_TO_PARROT" || request.action === "SEND_TO_GDM") {
    const tabId = sender && sender.tab ? sender.tab.id : null;
    sendUrlToGdm(request.url, tabId, request.filename, request.quality, Boolean(request.autoStart)).then((res) => sendResponse(res));
    return true;
  }

  if (request.action === "GET_SNIFFED_MEDIA") {
    const tabId = sender && sender.tab ? sender.tab.id : null;
    const streams = tabId && tabMediaStreams.has(tabId)
      ? Array.from(tabMediaStreams.get(tabId).values())
      : [];
    sendResponse({ streams });
    return true;
  }

  if (request.action === "CHECK_PARROT_STATUS" || request.action === "CHECK_GDM_STATUS") {
    fetch(`${GDM_BRIDGE_URL}/ping`, { method: "GET" })
      .then((res) => res.json())
      .then((data) => sendResponse({ online: true, data }))
      .catch(() => sendResponse({ online: false }));
    return true;
  }
});
