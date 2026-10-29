// Download with Parrot - Intelligent Media Link Grabber (content.js)
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

  // Listen to right-click / contextmenu events
  document.addEventListener(
    "contextmenu",
    (e) => {
      lastRightClickedElement = e.target;
      lastDetectedMediaUrl = extractMediaUrl(e.target);
    },
    true
  );

  document.addEventListener(
    "mousedown",
    (e) => {
      if (e.button === 2) {
        lastRightClickedElement = e.target;
        lastDetectedMediaUrl = extractMediaUrl(e.target);
      }
    },
    true
  );

  function extractMediaUrl(element) {
    if (!element) return window.location.href;

    const hostname = window.location.hostname;

    // 1. INSTAGRAM DETECTION
    if (hostname.includes("instagram.com")) {
      const path = window.location.pathname;
      if (
        path.startsWith("/reel/") ||
        path.startsWith("/p/") ||
        path.startsWith("/tv/")
      ) {
        return `${window.location.origin}${path}`;
      }

      // Check feed article or reel card
      const article =
        element.closest("article") ||
        element.closest('div[role="dialog"]') ||
        element.closest("div._aagv") ||
        element.closest("div._ab8w");

      if (article) {
        const link = article.querySelector(
          'a[href*="/reel/"], a[href*="/p/"], a[href*="/tv/"]'
        );
        if (link && link.getAttribute("href")) {
          return new URL(link.getAttribute("href"), window.location.origin).href;
        }

        const timeEl = article.querySelector("time");
        if (timeEl) {
          const timeLink = timeEl.closest("a");
          if (timeLink && timeLink.getAttribute("href")) {
            return new URL(timeLink.getAttribute("href"), window.location.origin).href;
          }
        }
      }

      const nearestAnchor = element.closest("a");
      if (nearestAnchor && nearestAnchor.getAttribute("href")) {
        const href = nearestAnchor.getAttribute("href");
        if (
          href.includes("/p/") ||
          href.includes("/reel/") ||
          href.includes("/tv/")
        ) {
          return new URL(href, window.location.origin).href;
        }
      }

      return window.location.href;
    }

    // 2. YOUTUBE DETECTION (Never use blob or video element src on YouTube)
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      if (hostname.includes("youtu.be")) {
        return window.location.href;
      }
      if (
        window.location.pathname.startsWith("/watch") ||
        window.location.pathname.startsWith("/shorts/")
      ) {
        return window.location.href;
      }

      // Thumbnail or card on feed/search
      const card = element.closest(
        "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-video-renderer, ytd-rich-grid-media"
      );
      if (card) {
        const titleAnchor = card.querySelector(
          "a#video-title, a#thumbnail, a.ytd-thumbnail, a[href*='/watch'], a[href*='/shorts/']"
        );
        if (titleAnchor && titleAnchor.getAttribute("href")) {
          return new URL(titleAnchor.getAttribute("href"), "https://www.youtube.com").href;
        }
      }

      const ytAnchor = element.closest("a#thumbnail, a#video-title, a[href*='/watch'], a[href*='/shorts/']");
      if (ytAnchor && ytAnchor.getAttribute("href")) {
        return new URL(ytAnchor.getAttribute("href"), "https://www.youtube.com").href;
      }

      return window.location.href;
    }

    // 3. FACEBOOK DETECTION
    if (hostname.includes("facebook.com")) {
      const fbAnchor = element.closest(
        'a[href*="/videos/"], a[href*="/reel/"], a[href*="/watch/"], a[href*="fb.watch"]'
      );
      if (fbAnchor && fbAnchor.getAttribute("href")) {
        return new URL(fbAnchor.getAttribute("href"), window.location.origin).href;
      }

      const fbArticle = element.closest('[role="article"]');
      if (fbArticle) {
        const vidLink = fbArticle.querySelector(
          'a[href*="/videos/"], a[href*="/reel/"], a[href*="/watch/"]'
        );
        if (vidLink && vidLink.getAttribute("href")) {
          return new URL(vidLink.getAttribute("href"), window.location.origin).href;
        }
      }

      return window.location.href;
    }

    // 4. TIKTOK DETECTION
    if (hostname.includes("tiktok.com")) {
      if (window.location.pathname.includes("/video/")) {
        return window.location.href;
      }
      const ttAnchor = element.closest('a[href*="/video/"]');
      if (ttAnchor && ttAnchor.getAttribute("href")) {
        return new URL(ttAnchor.getAttribute("href"), window.location.origin).href;
      }
      return window.location.href;
    }

    // 5. TWITTER / X DETECTION
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      const tweetArticle = element.closest("article");
      if (tweetArticle) {
        const statusLink = tweetArticle.querySelector('a[href*="/status/"]');
        if (statusLink && statusLink.getAttribute("href")) {
          return new URL(statusLink.getAttribute("href"), window.location.origin).href;
        }
      }
      return window.location.href;
    }

    // 6. DIRECT HTML5 VIDEO OR AUDIO TAG (strictly NO blobs!)
    const video =
      element.tagName === "VIDEO"
        ? element
        : element.querySelector("video") || element.closest("video");
    if (video) {
      if (isValidDownloadUrl(video.src)) return video.src;
      if (isValidDownloadUrl(video.currentSrc)) return video.currentSrc;
      const source = video.querySelector("source");
      if (source && isValidDownloadUrl(source.src)) return source.src;
    }

    // 7. NEAREST HYPERLINK
    const anchor = element.closest("a[href]");
    if (anchor && isValidDownloadUrl(anchor.href)) {
      return anchor.href;
    }

    // 8. FALLBACK TO CURRENT TAB URL
    return window.location.href;
  }

  // Handle messages from background worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_LAST_CLICKED_MEDIA") {
      let resolved = lastDetectedMediaUrl;
      if (!isValidDownloadUrl(resolved) && lastRightClickedElement) {
        resolved = extractMediaUrl(lastRightClickedElement);
      }
      if (!isValidDownloadUrl(resolved)) {
        resolved = window.location.href;
      }
      sendResponse({ url: resolved, pageUrl: window.location.href });
      return true;
    }

    if (request.action === "SHOW_TOAST") {
      showParrotToast(
        request.title || "GM Downloader",
        request.message,
        request.status || "info"
      );
      sendResponse({ shown: true });
      return true;
    }
  });

  // Floating Toast Notification
  function showParrotToast(title, message, status) {
    const existing = document.getElementById("parrot-floating-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "parrot-floating-toast";

    let bgGrad = "linear-gradient(135deg, #0ea5e9, #0284c7)";
    let iconEmoji = "🦜";

    if (status === "success") {
      bgGrad = "linear-gradient(135deg, #10b981, #059669)";
      iconEmoji = "✔";
    } else if (status === "warning" || status === "error") {
      bgGrad = "linear-gradient(135deg, #f59e0b, #d97706)";
      iconEmoji = "⚠";
    }

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "2147483647",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 18px",
      borderRadius: "14px",
      background: bgGrad,
      color: "#ffffff",
      fontFamily:
        "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: "13px",
      fontWeight: "500",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
      transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      opacity: "0",
      transform: "translateY(20px) scale(0.95)",
      pointerEvents: "none",
    });

    toast.innerHTML = `
      <div style="font-size: 20px; line-height: 1;">${iconEmoji}</div>
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 700; font-size: 13px; letter-spacing: -0.01em;">${title}</span>
        <span style="font-size: 12px; opacity: 0.95; margin-top: 2px;">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0) scale(1)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(15px) scale(0.95)";
      setTimeout(() => toast.remove(), 400);
    }, 3800);
  }
})();
