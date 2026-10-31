// Goat Download Manager (GDM) - IDM-Style Video & Media Overlay Grabber
// Seamless video detection across YouTube, Instagram, Facebook, Kick, Twitch, TikTok, Twitter, and ANY HTML5 video website.

(() => {
  let lastRightClickedElement = null;
  let lastDetectedMediaUrl = null;
  let activeGrabberButton = null;
  let activeDropdown = null;
  let currentTargetVideo = null;
  let currentTargetContainer = null;
  let hideTimer = null;
  let isPermanentlyDismissed = false;

  function stripRangeParams(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
    try {
      const u = new URL(rawUrl);
      let changed = false;
      if (u.searchParams.has("bytestart") || u.searchParams.has("byteend")) {
        u.searchParams.delete("bytestart");
        u.searchParams.delete("byteend");
        changed = true;
      }
      if (u.searchParams.has("range")) {
        u.searchParams.delete("range");
        changed = true;
      }
      return changed ? u.toString() : rawUrl;
    } catch (e) {
      return rawUrl;
    }
  }

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
    // Dismiss dropdown when clicking outside
    if (
      activeDropdown &&
      !activeDropdown.contains(e.target) &&
      (!activeGrabberButton || !activeGrabberButton.contains(e.target))
    ) {
      hideDropdown();
    }
  }, true);

  // Extract clean target URL and best human filename/title
  function extractMediaTarget(element) {
    const hostname = window.location.hostname;
    let title = document.title || "Video";

    // 1. YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      // Check if hovering over a feed item / card in YouTube home feed or channel
      const card = element?.closest?.(
        "ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer"
      );
      if (card) {
        const titleEl = card.querySelector("#video-title, #video-title-link");
        const linkEl = card.querySelector("a#thumbnail, a#video-title-link");
        const cardTitle =
          titleEl?.innerText?.trim() || titleEl?.getAttribute("title") || "";
        const cardUrl = linkEl?.href || window.location.href;
        if (cardTitle && cardUrl) {
          return {
            url: cardUrl,
            title: cardTitle,
            videoEl: card.querySelector("video"),
          };
        }
      }

      const ytTitle = document.querySelector(
        "h1.ytd-watch-metadata yt-formatted-string, #title h1, h1.title"
      );
      if (ytTitle && ytTitle.innerText) {
        title = ytTitle.innerText.trim();
      } else {
        title = document.title.replace(/ - YouTube$/, "").trim();
      }
      return {
        url: window.location.href,
        title,
        videoEl:
          element?.tagName === "VIDEO"
            ? element
            : element?.querySelector?.("video") || document.querySelector("video"),
      };
    }

    // 2. Instagram (Reels, Stories, and Home Feed Articles)
    if (hostname.includes("instagram.com")) {
      let postArticle = element
        ? element.closest("article") || element.closest("div[role='dialog']")
        : null;
      if (!postArticle && currentTargetVideo) {
        postArticle =
          currentTargetVideo.closest("article") ||
          currentTargetVideo.closest("div[role='dialog']");
      }
      if (!postArticle) {
        postArticle =
          document.querySelector("article:hover, div[role='dialog']:hover");
      }

      let postUrl = window.location.href;
      let postTitle = "";

      if (postArticle) {
        // Find permalink
        const postLink = postArticle.querySelector(
          "a[href*='/p/'], a[href*='/reel/']"
        );
        if (postLink && postLink.href) {
          postUrl = postLink.href;
        }

        // Find post caption
        const captionEl = postArticle.querySelector(
          "span._ap3a, div._a9zs, span[dir='auto'], h1, h2"
        );
        if (
          captionEl &&
          captionEl.innerText &&
          captionEl.innerText.trim().length > 3
        ) {
          postTitle = captionEl.innerText.trim().replace(/\r?\n+/g, " ");
        } else {
          const authorEl = postArticle.querySelector("header a, a[role='link']");
          if (authorEl && authorEl.innerText) {
            postTitle = `Instagram video by ${authorEl.innerText.trim()}`;
          }
        }
      }

      if (!postTitle) {
        postTitle =
          document.title
            .replace(/ • Instagram photos and videos$/, "")
            .replace(/ \| Instagram$/, "")
            .trim() || "Instagram Video";
      }

      const vid =
        (element?.tagName === "VIDEO" ? element : element?.querySelector?.("video")) ||
        currentTargetVideo;
      if (vid && vid.currentSrc && isValidDownloadUrl(vid.currentSrc)) {
        return {
          url: stripRangeParams(vid.currentSrc),
          title: postTitle,
          postUrl,
          videoEl: vid,
        };
      }

      return {
        url: stripRangeParams(postUrl),
        title: postTitle,
        postUrl,
        videoEl: vid,
      };
    }

    // 3. Popular Social & Video platforms natively supported by yt-dlp
    if (
      hostname.includes("kick.com") ||
      hostname.includes("twitch.tv") ||
      hostname.includes("tiktok.com") ||
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
      return {
        url: window.location.href,
        title,
        videoEl:
          element?.tagName === "VIDEO"
            ? element
            : element?.querySelector?.("video"),
      };
    }

    // 4. Direct HTML5 Video Element check
    if (element) {
      let vid = null;
      if (element.tagName === "VIDEO") {
        vid = element;
      } else {
        vid = element.querySelector?.("video") || element.closest?.("video");
      }

      if (vid) {
        if (vid.currentSrc && isValidDownloadUrl(vid.currentSrc)) {
          return { url: vid.currentSrc, title, videoEl: vid };
        }
        if (vid.src && isValidDownloadUrl(vid.src)) {
          return { url: vid.src, title, videoEl: vid };
        }
        const source = vid.querySelector("source");
        if (source && source.src && isValidDownloadUrl(source.src)) {
          return { url: source.src, title, videoEl: vid };
        }
      }
    }

    // 5. Anchor links
    const anchor = element?.closest?.("a");
    if (anchor && anchor.href && isValidDownloadUrl(anchor.href)) {
      return {
        url: anchor.href,
        title: anchor.innerText?.trim() || title,
        videoEl: null,
      };
    }

    // 6. Fallback to current Page URL
    return {
      url: window.location.href,
      title,
      videoEl:
        element?.tagName === "VIDEO"
          ? element
          : element?.querySelector?.("video"),
    };
  }

  // ---------------------------------------------------------------------------
  // IDM-Style Format Dropdown Menu
  // ---------------------------------------------------------------------------
  function hideDropdown() {
    if (activeDropdown) {
      activeDropdown.remove();
      activeDropdown = null;
    }
  }

  async function showFormatDropdown(anchorBtn, mediaTarget) {
    if (activeDropdown) {
      hideDropdown();
      return;
    }

    let sniffedStreams = [];
    try {
      const resp = await chrome.runtime.sendMessage({
        action: "GET_SNIFFED_MEDIA",
      });
      if (resp && Array.isArray(resp.streams)) {
        sniffedStreams = resp.streams;
      }
    } catch (e) {}

    const title = mediaTarget.title || "Video";
    const hostname = window.location.hostname;
    const vid = mediaTarget.videoEl || currentTargetVideo;
    const directSrc =
      vid && vid.currentSrc && isValidDownloadUrl(vid.currentSrc)
        ? stripRangeParams(vid.currentSrc)
        : vid && vid.src && isValidDownloadUrl(vid.src)
        ? stripRangeParams(vid.src)
        : "";

    let directPath = "";
    if (directSrc) {
      try {
        directPath = new URL(directSrc).pathname;
      } catch (e) {}
    }

    let durationSec = 0;
    if (vid && vid.duration && !isNaN(vid.duration) && isFinite(vid.duration)) {
      durationSec = Math.round(vid.duration);
    }
    const durStr = durationSec > 0 ? `${durationSec} sec, ` : "";

    const options = [];

    // 1. YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      options.push(
        { label: `${title}, MP4 file, quality 1080p HD`, quality: "1080p HD", url: mediaTarget.url },
        { label: `${title}, MP4 file, quality 720p HD`, quality: "720p HD", url: mediaTarget.url },
        { label: `${title}, MP4 file, quality 480p`, quality: "480p", url: mediaTarget.url },
        { label: `${title}, MP4 file, quality 360p`, quality: "360p", url: mediaTarget.url },
        { label: `${title}, MP4 file, quality 240p`, quality: "240p", url: mediaTarget.url },
        { label: `${title}, MP4 file, quality 144p`, quality: "144p", url: mediaTarget.url },
        { label: `${title}, MP3 Audio, Highest Quality`, quality: "Audio", url: mediaTarget.url }
      );
    } else if (hostname.includes("instagram.com")) {
      // 2. Instagram (Reels & Feed)
      const cleanTitle = title.length > 36 ? title.slice(0, 36) + "..." : title;

      // Filter valid video streams strictly belonging to THIS post/video
      const validStreams = sniffedStreams
        .filter((st) => {
          if (st.isAudio) return false;
          if (st.contentLength > 0 && st.contentLength < 50000) return false;
          if (directSrc) {
            const cleanSt = stripRangeParams(st.url);
            if (cleanSt === directSrc) return true;
            if (directPath) {
              try {
                if (new URL(cleanSt).pathname === directPath) return true;
              } catch (e) {}
            }
            return false;
          }
          return true;
        })
        .map((st) => ({
          ...st,
          url: stripRangeParams(st.url),
        }));

      // Sort by bitrate or contentLength descending (highest quality first)
      validStreams.sort(
        (a, b) => (b.bitrate || b.contentLength || 0) - (a.bitrate || a.contentLength || 0)
      );

      const seen = new Set();
      validStreams.forEach((st) => {
        const bitStr = st.bitrate ? `${st.bitrate} kbps` : "";
        const key = `${st.quality}_${bitStr}_${st.url}`;
        if (seen.has(key)) return;
        seen.add(key);

        const detailsList = [bitStr, st.sizeFormatted].filter(Boolean);
        const detailStr = detailsList.length > 0 ? `, ${detailsList.join(", ")}` : "";

        options.push({
          label: `${cleanTitle} MP4 file, ${durStr}quality ${st.quality}${detailStr}`,
          quality: st.quality,
          url: st.url,
        });
      });

      if (options.length === 0) {
        const cleanTargetUrl = directSrc || stripRangeParams(mediaTarget.url || window.location.href);
        options.push(
          { label: `${cleanTitle} MP4 file, ${durStr}quality 1080p HD`, quality: "1080p HD", url: cleanTargetUrl },
          { label: `${cleanTitle} MP4 file, ${durStr}quality 720p HD`, quality: "720p HD", url: cleanTargetUrl },
          { label: `${cleanTitle} MP4 file, ${durStr}quality 480p`, quality: "480p", url: cleanTargetUrl },
          { label: `${cleanTitle} MP3 Audio, Original Audio`, quality: "Audio", url: cleanTargetUrl }
        );
      }
      if (mediaTarget.postUrl && mediaTarget.postUrl !== window.location.href) {
        options.push({
          label: `${cleanTitle} (Best HD & Audio via Post Link)`,
          quality: "Best",
          url: mediaTarget.postUrl,
        });
      }
    } else {
      // 3. Any other website
      const cleanTitle = title.length > 40 ? title.slice(0, 40) + "..." : title;

      const validStreams = sniffedStreams
        .filter((st) => {
          if (st.isAudio) return false;
          if (st.contentLength > 0 && st.contentLength < 50000) return false;
          if (directSrc) {
            const cleanSt = stripRangeParams(st.url);
            if (cleanSt === directSrc) return true;
            if (directPath) {
              try {
                if (new URL(cleanSt).pathname === directPath) return true;
              } catch (e) {}
            }
            return false;
          }
          return true;
        })
        .map((st) => ({
          ...st,
          url: stripRangeParams(st.url),
        }));

      validStreams.sort(
        (a, b) => (b.bitrate || b.contentLength || 0) - (a.bitrate || a.contentLength || 0)
      );

      const seen = new Set();
      validStreams.forEach((st) => {
        const bitStr = st.bitrate ? `${st.bitrate} kbps` : "";
        const key = `${st.quality}_${bitStr}_${st.url}`;
        if (seen.has(key)) return;
        seen.add(key);

        const detailsList = [bitStr, st.sizeFormatted].filter(Boolean);
        const detailStr = detailsList.length > 0 ? `, ${detailsList.join(", ")}` : "";

        options.push({
          label: `${cleanTitle}, MP4 file, ${durStr}quality ${st.quality}${detailStr}`,
          quality: st.quality,
          url: st.url,
        });
      });

      if (options.length === 0) {
        const cleanTargetUrl = directSrc || stripRangeParams(mediaTarget.url || window.location.href);
        options.push(
          { label: `${cleanTitle}, MP4 file, Best Available HD Quality`, quality: "Best", url: cleanTargetUrl },
          { label: `${cleanTitle}, MP4 file, quality 1080p HD`, quality: "1080p HD", url: cleanTargetUrl },
          { label: `${cleanTitle}, MP4 file, quality 720p HD`, quality: "720p HD", url: cleanTargetUrl },
          { label: `${cleanTitle}, MP4 file, quality 480p`, quality: "480p", url: cleanTargetUrl },
          { label: `${cleanTitle}, MP3 Audio`, quality: "Audio", url: cleanTargetUrl }
        );
      }
    }

    // Create dropdown container
    const dropdown = document.createElement("div");
    dropdown.id = "gdm-format-dropdown";
    Object.assign(dropdown.style, {
      position: "fixed",
      zIndex: "2147483647",
      background: "#ffffff",
      border: "1px solid #717171",
      boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
      borderRadius: "2px",
      minWidth: "340px",
      maxWidth: "540px",
      fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
      fontSize: "12px",
      color: "#0f172a",
      direction: "ltr",
      userSelect: "none",
      overflow: "hidden",
    });

    // Top Header: "Download all"
    const header = document.createElement("div");
    header.innerText = "Download all";
    Object.assign(header.style, {
      padding: "6px 12px",
      fontWeight: "700",
      fontSize: "12px",
      color: "#1e293b",
      background: "#f1f5f9",
      borderBottom: "1px solid #cbd5e1",
      cursor: "pointer",
    });
    header.addEventListener("mouseenter", () => {
      header.style.background = "#e2e8f0";
    });
    header.addEventListener("mouseleave", () => {
      header.style.background = "#f1f5f9";
    });
    header.addEventListener("click", (e) => {
      e.stopPropagation();
      hideDropdown();
      showToast(
        "Goat Download Manager 🐐",
        `Starting Best Quality download in GDM...`,
        "success"
      );
      chrome.runtime.sendMessage({
        action: "SEND_TO_GDM",
        url: stripRangeParams(options[0]?.url || mediaTarget.url),
        filename: mediaTarget.title,
        quality: "Best",
        autoStart: true,
      });
    });
    dropdown.appendChild(header);

    // Format list
    const list = document.createElement("div");
    list.style.maxHeight = "360px";
    list.style.overflowY = "auto";

    options.forEach((opt, idx) => {
      const item = document.createElement("div");
      item.innerText = `${idx + 1}. ${opt.label}`;
      item.title = opt.label;
      Object.assign(item.style, {
        padding: "5px 12px",
        fontSize: "11.5px",
        color: "#0f172a",
        cursor: "pointer",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        borderBottom: "1px solid #f1f5f9",
        transition: "background 0.08s ease, color 0.08s ease",
      });

      item.addEventListener("mouseenter", () => {
        item.style.background = "#2563eb";
        item.style.color = "#ffffff";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "transparent";
        item.style.color = "#0f172a";
      });

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        hideDropdown();
        if (activeGrabberButton) {
          activeGrabberButton.style.display = "none";
        }
        showToast(
          "Goat Download Manager 🐐",
          `Starting ${opt.quality} download in GDM...`,
          "success"
        );
        chrome.runtime.sendMessage({
          action: "SEND_TO_GDM",
          url: stripRangeParams(opt.url || mediaTarget.url),
          filename: mediaTarget.title,
          quality: opt.quality,
          autoStart: true,
        });
      });

      list.appendChild(item);
    });

    dropdown.appendChild(list);

    // Position directly beneath the grabber button
    const btnRect = anchorBtn.getBoundingClientRect();
    const top = Math.min(window.innerHeight - 200, btnRect.bottom + 2);
    const right = Math.max(8, window.innerWidth - btnRect.right);

    dropdown.style.top = `${top}px`;
    dropdown.style.right = `${right}px`;

    document.body.appendChild(dropdown);
    activeDropdown = dropdown;
  }

  // ---------------------------------------------------------------------------
  // IDM-Style Floating Video Grabber Overlay
  // ---------------------------------------------------------------------------
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
      btn.style.boxShadow =
        "0 3px 12px rgba(37,99,235,0.45), inset 0 1px 0 #ffffff";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
      btn.style.borderColor = "#64748b";
      btn.style.boxShadow =
        "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9)";
      scheduleHide();
    });

    btn.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.id === "gdm-close-btn") {
        e.stopPropagation();
        e.preventDefault();
        hideDropdown();
        btn.style.display = "none";
        isPermanentlyDismissed = true;
        setTimeout(() => {
          isPermanentlyDismissed = false;
        }, 8000);
        return;
      }
      if (target && target.id === "gdm-help-btn") {
        e.stopPropagation();
        e.preventDefault();
        showToast(
          "Goat Download Manager 🐐",
          "GDM High-Speed HTTP & Media Extractor",
          "info"
        );
        return;
      }

      e.stopPropagation();
      e.preventDefault();

      const mediaTarget = extractMediaTarget(
        currentTargetVideo || currentTargetContainer
      );
      showFormatDropdown(btn, mediaTarget);
    });

    document.body.appendChild(btn);
    activeGrabberButton = btn;
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (activeDropdown) return; // Never hide grabber if dropdown is actively open!
      if (activeGrabberButton && !activeGrabberButton.matches(":hover")) {
        activeGrabberButton.style.opacity = "0";
        activeGrabberButton.style.pointerEvents = "none";
        setTimeout(() => {
          if (
            activeGrabberButton &&
            activeGrabberButton.style.opacity === "0" &&
            !activeDropdown
          ) {
            activeGrabberButton.style.display = "none";
          }
        }, 200);
      }
    }, 1400);
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
      const top = Math.max(
        12,
        Math.min(window.innerHeight - 50, rect.top + 10)
      );
      const right = Math.max(
        12,
        Math.min(window.innerWidth - 180, window.innerWidth - rect.right + 10)
      );

      activeGrabberButton.style.top = `${top}px`;
      activeGrabberButton.style.right = `${right}px`;
    }

    activeGrabberButton.style.display = "flex";
    activeGrabberButton.style.opacity = "1";
    activeGrabberButton.style.pointerEvents = "auto";
  }

  // ---------------------------------------------------------------------------
  // Global Detection & Hover Logic (Supports YouTube, Instagram feed & all sites)
  // ---------------------------------------------------------------------------
  let lastCheckTime = 0;

  function handleGlobalPointerMove(e) {
    const now = Date.now();
    if (now - lastCheckTime < 45) return; // ~22fps throttle for zero-lag performance
    lastCheckTime = now;

    const x = e.clientX;
    const y = e.clientY;

    // 1. If pointer is over the IDM grabber or dropdown menu, keep open
    if (activeGrabberButton && activeGrabberButton.style.display !== "none") {
      const btnRect = activeGrabberButton.getBoundingClientRect();
      const dropRect = activeDropdown ? activeDropdown.getBoundingClientRect() : null;

      const overBtn =
        x >= btnRect.left - 20 &&
        x <= btnRect.right + 20 &&
        y >= btnRect.top - 20 &&
        y <= btnRect.bottom + 20;

      const overDrop =
        dropRect &&
        x >= dropRect.left - 10 &&
        x <= dropRect.right + 10 &&
        y >= dropRect.top - 10 &&
        y <= dropRect.bottom + 10;

      if (overBtn || overDrop) {
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

    // 3. Instagram Feed & Reels Special Fast-Path
    const instagramArticles = document.querySelectorAll(
      "article, div[role='dialog']"
    );
    for (let i = 0; i < instagramArticles.length; i++) {
      const art = instagramArticles[i];
      const vid = art.querySelector("video");
      if (!vid) continue;
      const rect = art.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        positionGrabber(vid, art);
        return;
      }
    }

    // 4. Scan all HTML5 video elements across any website
    const videos = document.querySelectorAll("video");
    let foundHovered = false;

    for (let i = 0; i < videos.length; i++) {
      const vid = videos[i];
      const rect = vid.getBoundingClientRect();
      if (rect.width < 140 || rect.height < 90) continue;

      // Expand detection rectangle to common player wrappers
      const parentContainer =
        vid.closest(
          '[class*="player"], [id*="player"], [class*="video"], .video-js, .jwplayer, .plyr, figure, article'
        ) || vid.parentElement;
      const containerRect = parentContainer
        ? parentContainer.getBoundingClientRect()
        : rect;

      const testRect =
        containerRect.width >= rect.width &&
        containerRect.height >= rect.height &&
        containerRect.width <= rect.width * 1.6
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
  window.addEventListener(
    "play",
    (e) => {
      if (e.target && e.target.tagName === "VIDEO") {
        const vid = e.target;
        const parentContainer =
          vid.closest('#movie_player, [class*="player"], [id*="player"], article') ||
          vid.parentElement;
        positionGrabber(vid, parentContainer);
        setTimeout(scheduleHide, 4000);
      }
    },
    true
  );

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
      const target = extractMediaTarget(
        currentTargetVideo || lastRightClickedElement
      );
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
      borderLeft:
        status === "success" ? "4px solid #10b981" : "4px solid #3b82f6",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
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
