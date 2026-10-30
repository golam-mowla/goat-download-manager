// Goat Download Manager (GDM) - IDM-Style Video & Media Overlay Grabber

(() => {
  let lastRightClickedElement = null;
  let lastDetectedMediaUrl = null;

  function isValidDownloadUrl(url) {
    if (!url || typeof url !== "string") return false;
    const clean = url.trim();
    if (
      clean.startsWith("blob:") ||
      clean.startsWith("data:") ||
      clean.startsWith("javascript:")
    ) {
      return false;
    }
    return clean.startsWith("http://") || clean.startsWith("https://");
  }

  // Right-click media URL tracker
  document.addEventListener("contextmenu", (e) => {
    lastRightClickedElement = e.target;
    lastDetectedMediaUrl = extractMediaUrl(e.target);
  }, true);

  document.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      lastRightClickedElement = e.target;
      lastDetectedMediaUrl = extractMediaUrl(e.target);
    }
  }, true);

  function extractMediaUrl(element) {
    if (!element) return window.location.href;
    const hostname = window.location.hostname;

    // 1. Instagram
    if (hostname.includes("instagram.com")) {
      const path = window.location.pathname;
      if (path.startsWith("/reel/") || path.startsWith("/p/") || path.startsWith("/tv/")) {
        return `${window.location.origin}${path}`;
      }
      const article = element.closest("article") || element.closest('div[role="dialog"]');
      if (article) {
        const link = article.querySelector('a[href*="/reel/"], a[href*="/p/"]');
        if (link && link.getAttribute("href")) {
          return new URL(link.getAttribute("href"), window.location.origin).href;
        }
      }
      return window.location.href;
    }

    // 2. YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return window.location.href;
    }

    // 3. TikTok
    if (hostname.includes("tiktok.com")) {
      return window.location.href;
    }

    // 4. Facebook / Twitter / X
    if (
      hostname.includes("facebook.com") ||
      hostname.includes("fb.watch") ||
      hostname.includes("twitter.com") ||
      hostname.includes("x.com")
    ) {
      return window.location.href;
    }

    // 5. HTML5 Video / Audio elements
    if (element.tagName === "VIDEO" || element.tagName === "AUDIO") {
      if (element.currentSrc && isValidDownloadUrl(element.currentSrc)) return element.currentSrc;
      if (element.src && isValidDownloadUrl(element.src)) return element.src;
    }

    const parentVideo = element.closest("video");
    if (parentVideo) {
      if (parentVideo.currentSrc && isValidDownloadUrl(parentVideo.currentSrc)) return parentVideo.currentSrc;
      if (parentVideo.src && isValidDownloadUrl(parentVideo.src)) return parentVideo.src;
    }

    // Anchor links
    const anchor = element.closest("a");
    if (anchor && anchor.href && isValidDownloadUrl(anchor.href)) {
      return anchor.href;
    }

    return window.location.href;
  }

  // ---------------------------------------------------------------------------
  // IDM-Style Floating Video Grabber Overlay
  // ---------------------------------------------------------------------------
  let activeGrabberButton = null;
  let currentTargetVideo = null;
  let hideTimer = null;

  function createVideoGrabber() {
    if (document.getElementById("gdm-floating-grabber")) return;

    const btn = document.createElement("div");
    btn.id = "gdm-floating-grabber";
    btn.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;padding:0 2px;">
        <span style="display:inline-block;color:#16a34a;font-size:12px;font-weight:900;text-shadow:0 1px 1px rgba(0,0,0,0.2);">▶</span>
        <span style="font-size:12px;font-weight:800;letter-spacing:0.2px;font-family:Arial,Tahoma,sans-serif;color:#dc2626;text-shadow:0 1px 0 #ffffff;">Download this video</span>
        <span style="font-size:11px;color:#475569;font-weight:bold;margin-left:4px;padding:0 3px;border-left:1px solid #94a3b8;cursor:pointer;" title="Goat Download Manager (GDM)" id="gdm-help-btn">?</span>
        <span style="font-size:11px;color:#475569;font-weight:bold;padding:0 2px;cursor:pointer;" title="Hide overlay" id="gdm-close-btn">✕</span>
      </div>
    `;

    // Authentic IDM overlay styling matching user screenshot
    Object.assign(btn.style, {
      position: "fixed",
      zIndex: "2147483647",
      display: "none",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: "4px",
      background: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%)",
      border: "1px solid #64748b",
      boxShadow: "0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)",
      cursor: "pointer",
      userSelect: "none",
      transition: "opacity 0.15s ease, transform 0.1s ease",
      opacity: "0",
      pointerEvents: "none",
    });

    btn.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
      btn.style.transform = "scale(1.02)";
      btn.style.borderColor = "#2563eb";
      btn.style.boxShadow = "0 3px 12px rgba(37,99,235,0.4), inset 0 1px 0 #ffffff";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
      btn.style.borderColor = "#64748b";
      btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)";
      scheduleHide();
    });

    btn.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.id === "gdm-close-btn") {
        e.stopPropagation();
        e.preventDefault();
        btn.style.display = "none";
        return;
      }
      if (target && target.id === "gdm-help-btn") {
        e.stopPropagation();
        e.preventDefault();
        showToast("Goat Download Manager 🐐", "GDM 16-Segment HTTP & Video Extractor", "info");
        return;
      }

      e.stopPropagation();
      e.preventDefault();

      let targetUrl = window.location.href;
      if (currentTargetVideo) {
        if (currentTargetVideo.currentSrc && isValidDownloadUrl(currentTargetVideo.currentSrc)) {
          targetUrl = currentTargetVideo.currentSrc;
        } else if (currentTargetVideo.src && isValidDownloadUrl(currentTargetVideo.src)) {
          targetUrl = currentTargetVideo.src;
        }
      }

      showToast("Goat Download Manager 🐐", "Sending media to GDM Engine...", "info");
      chrome.runtime.sendMessage({ action: "SEND_TO_GDM", url: targetUrl });
      btn.style.display = "none";
    });

    document.body.appendChild(btn);
    activeGrabberButton = btn;
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (activeGrabberButton && !activeGrabberButton.matches(":hover")) {
        activeGrabberButton.style.opacity = "0";
        activeGrabberButton.style.pointerEvents = "none";
        setTimeout(() => {
          if (activeGrabberButton.style.opacity === "0") {
            activeGrabberButton.style.display = "none";
          }
        }, 200);
      }
    }, 800);
  }

  function positionGrabber(video) {
    if (!activeGrabberButton) return;
    const rect = video.getBoundingClientRect();
    if (rect.width < 140 || rect.height < 90) return; // Ignore tiny icons/previews

    currentTargetVideo = video;
    clearTimeout(hideTimer);

    // Place at top-right of the video viewport
    const top = Math.max(12, rect.top + 8);
    const right = Math.max(12, window.innerWidth - rect.right + 8);

    activeGrabberButton.style.top = `${top}px`;
    activeGrabberButton.style.right = `${right}px`;
    activeGrabberButton.style.display = "flex";
    activeGrabberButton.style.opacity = "1";
    activeGrabberButton.style.pointerEvents = "auto";
  }

  // Detect videos on page
  function attachVideoListeners() {
    createVideoGrabber();
    const videos = document.querySelectorAll("video");

    videos.forEach((vid) => {
      if (vid.dataset.gdmAttached) return;
      vid.dataset.gdmAttached = "true";

      vid.addEventListener("mouseenter", () => {
        positionGrabber(vid);
      });

      vid.addEventListener("mousemove", () => {
        positionGrabber(vid);
      });

      vid.addEventListener("mouseleave", () => {
        scheduleHide();
      });
    });
  }

  // Periodic scan for dynamic videos (YouTube player, Instagram feed, reels)
  setInterval(attachVideoListeners, 1500);
  document.addEventListener("DOMContentLoaded", attachVideoListeners);

  // Message listener from background & popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_LAST_CLICKED_MEDIA") {
      sendResponse({ url: lastDetectedMediaUrl || window.location.href });
      return true;
    }

    if (request.action === "SHOW_TOAST") {
      showToast(request.title, request.message, request.status);
    }
  });

  // Modern In-Page Toast Notification
  function showToast(title, message, status = "info") {
    let container = document.getElementById("gdm-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "gdm-toast-container";
      Object.assign(container.style, {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: "2147483647",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      });
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    Object.assign(toast.style, {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 14px",
      borderRadius: "8px",
      background: "#111827",
      color: "#f8fafc",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      border: status === "success" ? "1px solid #10b981" : "1px solid #3b82f6",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
      fontSize: "12px",
      transition: "all 0.25s ease",
      opacity: "0",
      transform: "translateY(12px)",
      pointerEvents: "auto",
    });

    toast.innerHTML = `
      <span style="font-size:18px;">${status === "success" ? "✅" : "🐐"}</span>
      <div>
        <div style="font-weight:700;font-size:12px;color:#ffffff;">${title}</div>
        <div style="font-size:11px;color:#cbd5e1;">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
})();
