// Goat Download Manager (GDM) - Background Service Worker (Manifest V3)

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
      await sendUrlToGdm(rawUrl, null, downloadItem.filename);
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

    // 1. Ask content script for detected element URL (e.g. Instagram reel, video, card)
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

    // 2. Fallbacks from contextMenus info (strictly ignore blob/data URLs)
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
async function sendUrlToGdm(mediaUrl, tabId, customFilename) {
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
        message: "Sending link to GDM engine...",
        status: "info",
      });
    } catch {}
  }

  // 1. Try sending to local bridge HTTP server (if app is running)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const bridgeEndpoint = `${GDM_BRIDGE_URL}/open?url=${encodeURIComponent(cleanUrl)}`;
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
            message: "Link sent to GDM! Download starting...",
            status: "success",
          });
        } catch {}
      }
      return { success: true, method: "bridge" };
    }
  } catch (err) {
    // Local bridge not active (app might be closed or starting)
  }

  // 2. Launch GDM via custom Windows protocol (support gdm:// and parrot://)
  const protocolUrl = `gdm://open?url=${encodeURIComponent(cleanUrl)}`;

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

// Listen to messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SEND_TO_PARROT" || request.action === "SEND_TO_GDM") {
    sendUrlToGdm(request.url, null).then((res) => sendResponse(res));
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
