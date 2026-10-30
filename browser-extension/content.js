// Goat Download Manager (GDM) - Content Script & Video Grabber

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

    // 4. Facebook / Twitter
    if (hostname.includes("facebook.com") || hostname.includes("fb.watch") || hostname.includes("twitter.com") || hostname.includes("x.com")) {
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
  // IDM-Style Floating Video Grabber Button
  // ---------------------------------------------------------------------------
  let activeGrabberButton = null;
  let hoveredVideo = null;

  function createVideoGrabber() {
    if (document.getElementById("gdm-floating-grabber")) return;

    const btn = document.createElement("div");
    btn.id = "gdm-floating-grabber";
    btn.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:14px;">🐐</span>
        <span style="font-size:11px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">Download with GDM</span>
      </div>
    `;

    // Styling
    Object.assign(btn.style, {
      position: "fixed",
      zIndex: "2147483647",
      display: "none",
      alignItems: "center",
      padding: "6px 12px",
      borderRadius: "8px",
      background: "linear-gradient(135deg, rgba(147, 51, 234, 0.92), rgba(219, 39, 119, 0.92))",
      color: "#ffffff",
      boxShadow: "0 4px 18px rgba(0,0,0,0.4), 0 0 10px rgba(168,85,247,0.4)",
      border: "1px solid rgba(255,255,255,0.25)",
      cursor: "pointer",
      userSelect: "none",
      transition: "opacity 0.2s ease, transform 0.2s ease",
      backdropFilter: "blur(8px)",
      opacity: "0",
      pointerEvents: "none",
    });

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "scale(1.04)";
      btn.style.boxShadow = "0 6px 22px rgba(168,85,247,0.6)";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const targetUrl = window.location.href;
      chrome.runtime.sendMessage({ action: "SEND_TO_GDM", url: targetUrl });
      btn.style.display = "none";
    });

    document.body.appendChild(btn);
    activeGrabberButton = btn;
  }

  // Detect videos on page
  function attachVideoListeners() {
    createVideoGrabber();
    const videos = document.querySelectorAll("video");

    videos.forEach((vid) => {
      if (vid.dataset.gdmAttached) return;
      vid.dataset.gdmAttached = "true";

      vid.addEventListener("mouseenter", () => {
        hoveredVideo = vid;
        positionGrabber(vid);
      });

      vid.addEventListener("mouseleave", (e) => {
        setTimeout(() => {
          if (!activeGrabberButton || activeGrabberButton.matches(":hover")) return;
          if (hoveredVideo === vid && !vid.matches(":hover")) {
            activeGrabberButton.style.opacity = "0";
            activeGrabberButton.style.pointerEvents = "none";
          }
        }, 300);
      });
    });
  }

  function positionGrabber(video) {
    if (!activeGrabberButton) return;
    const rect = video.getBoundingClientRect();
    if (rect.width < 140 || rect.height < 100) return; // Ignore small previews

    const top = Math.max(10, rect.top + 10);
    const right = Math.max(10, window.innerWidth - rect.right + 10);

    activeGrabberButton.style.top = `${top}px`;
    activeGrabberButton.style.right = `${right}px`;
    activeGrabberButton.style.display = "flex";
    activeGrabberButton.style.opacity = "1";
    activeGrabberButton.style.pointerEvents = "auto";
  }

  // Periodic scan for dynamic videos (YouTube, Instagram)
  setInterval(attachVideoListeners, 2000);

  // Message listener from popup and background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_LAST_CLICKED_MEDIA") {
      sendResponse({ url: lastDetectedMediaUrl || window.location.href });
      return true;
    }

    if (request.action === "SHOW_TOAST") {
      showToast(request.title, request.message, request.status);
      sendResponse({ received: true });
      return true;
    }
  });

  // Sleek In-Page Toast Notification
  function showToast(title, message, status = "info") {
    let container = document.getElementById("gdm-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "gdm-toast-container";
      Object.assign(container.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: "2147483647",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
      });
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;">🐐</span>
        <div>
          <div style="font-weight:700;font-size:12px;color:#f8fafc;">${title || "Goat Download Manager"}</div>
          <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">${message || ""}</div>
        </div>
      </div>
    `;

    Object.assign(toast.style, {
      background: "rgba(15, 10, 30, 0.95)",
      border: "1px solid rgba(168, 85, 247, 0.4)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.5), 0 0 15px rgba(168,85,247,0.3)",
      backdropFilter: "blur(12px)",
      color: "#ffffff",
      padding: "10px 16px",
      borderRadius: "12px",
      minWidth: "260px",
      maxWidth: "340px",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      opacity: "0",
      transform: "translateY(15px)",
      pointerEvents: "auto",
    });

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(15px)";
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }
})();
