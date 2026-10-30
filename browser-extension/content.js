// Goat Download Manager (GDM) - IDM-Style Video & Media Overlay Grabber
// Seamless video detection across YouTube, Facebook, Kick, Twitch, TikTok, Instagram, Twitter, and ANY HTML5 video website.

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
    lastDetectedMediaUrl = extractMediaTarget(e.target).url;
  }, true);

  document.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      lastRightClickedElement = e.target;
      lastDetectedMediaUrl = extractMediaTarget(e.target).url;
    }
  }, true);

  // Extract clean target URL and best human filename/title
  function extractMediaTarget(element) {
    const hostname = window.location.hostname;
    let title = document.title || "Video";

    // 1. YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      const ytTitle = document.querySelector("h1.ytd-watch-metadata yt-formatted-string, #title h1, h1.title");
      if (ytTitle && ytTitle.innerText) {
        title = ytTitle.innerText.trim();
      } else {
        title = document.title.replace(/ - YouTube$/, "").trim();
      }
      return { url: window.location.href, title };
    }

    // 2. Popular Social & Video platforms natively supported by yt-dlp
    if (
      hostname.includes("kick.com") ||
      hostname.includes("twitch.tv") ||
      hostname.includes("tiktok.com") ||
      hostname.includes("instagram.com") ||
      hostname.includes("facebook.com") ||
      hostname.includes("fb.watch") ||
      hostname.includes("twitter.com") ||
      hostname.includes("x.com") ||
      hostname.includes("vimeo.com") ||
      hostname.includes("dailymotion.com") ||
      hostname.includes("reddit.com") ||
      hostname.includes("bilibili.com") ||
      hostname.includes("soundcloud.com")
    ) {
      title = document.title
        .replace(/ - Kick$/, "")
        .replace(/ \| Instagram$/, "")
        .replace(/ \/ X$/, "")
        .replace(/ \| Facebook$/, "")
        .trim();
      return { url: window.location.href, title };
    }

    // 3. Direct HTML5 Video Element check
    if (element) {
      let vid = null;
      if (element.tagName === "VIDEO") {
        vid = element;
      } else {
        vid = element.querySelector?.("video") || element.closest?.("video");
      }

      if (vid) {
        if (vid.currentSrc && isValidDownloadUrl(vid.currentSrc)) {
          return { url: vid.currentSrc, title };
        }
        if (vid.src && isValidDownloadUrl(vid.src)) {
          return { url: vid.src, title };
        }
        const source = vid.querySelector("source");
        if (source && source.src && isValidDownloadUrl(source.src)) {
          return { url: source.src, title };
        }
      }
    }

    // 4. Anchor links
    const anchor = element?.closest?.("a");
    if (anchor && anchor.href && isValidDownloadUrl(anchor.href)) {
      return { url: anchor.href, title: anchor.innerText?.trim() || title };
    }

    // 5. Fallback to current Page URL (yt-dlp supports over 1800+ streaming sites)
    return { url: window.location.href, title };
  }

  // ---------------------------------------------------------------------------
  // IDM-Style Floating Video Grabber Overlay
  // ---------------------------------------------------------------------------
  let activeGrabberButton = null;
  let currentTargetVideo = null;
  let currentTargetContainer = null;
  let hideTimer = null;
  let isPermanentlyDismissed = false;

  function ensureGrabberContainer() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      if (activeGrabberButton && activeGrabberButton.parentElement !== fsEl) {
        fsEl.appendChild(activeGrabberButton);
      }
    } else {
      if (activeGrabberButton && activeGrabberButton.parentElement !== document.body) {
        document.body.appendChild(activeGrabberButton);
      }
    }
  }

  function createVideoGrabber() {
    if (activeGrabberButton && document.contains(activeGrabberButton)) return;

    const existing = document.getElementById("gdm-floating-grabber");
    if (existing) {
      activeGrabberButton = existing;
      return;
    }

    const btn = document.createElement("div");
    btn.id = "gdm-floating-grabber";
    btn.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;padding:0 3px;">
        <span style="display:inline-block;color:#16a34a;font-size:12px;font-weight:900;text-shadow:0 1px 1px rgba(0,0,0,0.25);">▶</span>
        <span style="font-size:12px;font-weight:800;letter-spacing:0.2px;font-family:Arial,Tahoma,sans-serif;color:#dc2626;text-shadow:0 1px 0 #ffffff;white-space:nowrap;">Download this video</span>
        <span style="font-size:11px;color:#475569;font-weight:bold;margin-left:4px;padding:0 4px;border-left:1px solid #94a3b8;cursor:pointer;" title="Goat Download Manager (GDM)" id="gdm-help-btn">?</span>
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
      boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9)",
      cursor: "pointer",
      userSelect: "none",
      transition: "opacity 0.15s ease, transform 0.1s ease",
      opacity: "0",
      pointerEvents: "none",
      direction: "ltr",
    });

    btn.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
      btn.style.transform = "scale(1.02)";
      btn.style.borderColor = "#2563eb";
      btn.style.boxShadow = "0 3px 12px rgba(37,99,235,0.45), inset 0 1px 0 #ffffff";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
      btn.style.borderColor = "#64748b";
      btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9)";
      scheduleHide();
    });

    btn.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.id === "gdm-close-btn") {
        e.stopPropagation();
        e.preventDefault();
        btn.style.display = "none";
        isPermanentlyDismissed = true;
        setTimeout(() => { isPermanentlyDismissed = false; }, 8000); // Re-enable after 8s
        return;
      }
      if (target && target.id === "gdm-help-btn") {
        e.stopPropagation();
        e.preventDefault();
        showToast("Goat Download Manager 🐐", "GDM High-Speed HTTP & Media Extractor", "info");
        return;
      }

      e.stopPropagation();
      e.preventDefault();

      const mediaTarget = extractMediaTarget(currentTargetVideo || currentTargetContainer);

      showToast("Goat Download Manager 🐐", `Sending "${mediaTarget.title.slice(0, 40)}..." to GDM Engine!`, "info");
      chrome.runtime.sendMessage({
        action: "SEND_TO_GDM",
        url: mediaTarget.url,
        filename: mediaTarget.title,
      });

      btn.style.opacity = "0";
      setTimeout(() => { btn.style.display = "none"; }, 200);
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
          if (activeGrabberButton && activeGrabberButton.style.opacity === "0") {
            activeGrabberButton.style.display = "none";
          }
        }, 200);
      }
    }, 1200);
  }

  function positionGrabber(video, container) {
    if (isPermanentlyDismissed) return;
    createVideoGrabber();
    ensureGrabberContainer();

    currentTargetVideo = video;
    currentTargetContainer = container || video.parentElement;
    clearTimeout(hideTimer);

    const refEl = container || video;
    const rect = refEl.getBoundingClientRect();
    if (rect.width < 140 || rect.height < 90) return;

    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;

    if (fsEl && fsEl.contains(activeGrabberButton)) {
      activeGrabberButton.style.position = "absolute";
      activeGrabberButton.style.top = "18px";
      activeGrabberButton.style.right = "18px";
    } else {
      activeGrabberButton.style.position = "fixed";
      const top = Math.max(12, Math.min(window.innerHeight - 50, rect.top + 10));
      const right = Math.max(12, Math.min(window.innerWidth - 180, window.innerWidth - rect.right + 10));

      activeGrabberButton.style.top = `${top}px`;
      activeGrabberButton.style.right = `${right}px`;
    }

    activeGrabberButton.style.display = "flex";
    activeGrabberButton.style.opacity = "1";
    activeGrabberButton.style.pointerEvents = "auto";
  }

  // ---------------------------------------------------------------------------
  // Global Detection & Hover Logic (Works everywhere including YouTube overlays)
  // ---------------------------------------------------------------------------
  let lastCheckTime = 0;

  function handleGlobalPointerMove(e) {
    const now = Date.now();
    if (now - lastCheckTime < 45) return; // ~22fps throttle for zero-lag
    lastCheckTime = now;

    const x = e.clientX;
    const y = e.clientY;

    // 1. If pointer is over the IDM grabber button itself, do not hide
    if (activeGrabberButton && activeGrabberButton.style.display !== "none") {
      const btnRect = activeGrabberButton.getBoundingClientRect();
      if (
        x >= btnRect.left - 20 &&
        x <= btnRect.right + 20 &&
        y >= btnRect.top - 20 &&
        y <= btnRect.bottom + 20
      ) {
        clearTimeout(hideTimer);
        return;
      }
    }

    // 2. YouTube Special Fast-Path (covers transparent overlays, controls & cinema mode)
    const ytPlayer = document.querySelector("#movie_player, .html5-video-player");
    if (ytPlayer) {
      const ytRect = ytPlayer.getBoundingClientRect();
      if (
        x >= ytRect.left &&
        x <= ytRect.right &&
        y >= ytRect.top &&
        y <= ytRect.bottom &&
        ytRect.width > 200 &&
        ytRect.height > 120
      ) {
        const vid = ytPlayer.querySelector("video");
        if (vid) {
          positionGrabber(vid, ytPlayer);
          return;
        }
      }
    }

    // 3. Scan all HTML5 video elements across any website
    const videos = document.querySelectorAll("video");
    let foundHovered = false;

    for (let i = 0; i < videos.length; i++) {
      const vid = videos[i];
      const rect = vid.getBoundingClientRect();
      if (rect.width < 140 || rect.height < 90) continue;

      // Expand detection rectangle to common player wrappers
      const parentContainer = vid.closest('[class*="player"], [id*="player"], [class*="video"], .video-js, .jwplayer, .plyr, figure') || vid.parentElement;
      const containerRect = parentContainer ? parentContainer.getBoundingClientRect() : rect;

      const testRect = (containerRect.width >= rect.width && containerRect.height >= rect.height && containerRect.width <= rect.width * 1.6)
        ? containerRect
        : rect;

      if (
        x >= testRect.left &&
        x <= testRect.right &&
        y >= testRect.top &&
        y <= testRect.bottom
      ) {
        positionGrabber(vid, parentContainer);
        foundHovered = true;
        break;
      }
    }

    if (!foundHovered) {
      scheduleHide();
    }
  }

  // Bind global pointer listeners
  window.addEventListener("mousemove", handleGlobalPointerMove, { passive: true });
  window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });

  // When ANY video starts playing on ANY website, show the grabber immediately
  window.addEventListener("play", (e) => {
    if (e.target && e.target.tagName === "VIDEO") {
      const vid = e.target;
      const parentContainer = vid.closest('#movie_player, [class*="player"], [id*="player"]') || vid.parentElement;
      positionGrabber(vid, parentContainer);
      // Auto-fade after 4s unless hovered
      setTimeout(scheduleHide, 4000);
    }
  }, true);

  // Fullscreen support
  document.addEventListener("fullscreenchange", ensureGrabberContainer);
  document.addEventListener("webkitfullscreenchange", ensureGrabberContainer);

  // Periodic check to ensure grabber exists
  setInterval(() => {
    createVideoGrabber();
  }, 2000);

  // Message listener from background & popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_LAST_CLICKED_MEDIA") {
      const target = extractMediaTarget(currentTargetVideo || lastRightClickedElement);
      sendResponse({ url: target.url, title: target.title });
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
        direction: "ltr",
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
      background: "#0f172a",
      color: "#f8fafc",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
      borderLeft: status === "success" ? "4px solid #10b981" : "4px solid #3b82f6",
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
