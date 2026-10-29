// Download with Parrot - Popup Logic
document.addEventListener("DOMContentLoaded", async () => {
  const currentUrlBox = document.getElementById("current-url");
  const btnDownloadCurrent = document.getElementById("btn-download-current");
  const customUrlInput = document.getElementById("custom-url-input");
  const btnDownloadCustom = document.getElementById("btn-download-custom");
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");

  let activeTabUrl = "";

  // 1. Get active tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("brave://")) {
      activeTabUrl = tab.url;
      currentUrlBox.textContent = activeTabUrl;
    } else {
      currentUrlBox.textContent = "No downloadable tab active";
      btnDownloadCurrent.disabled = true;
    }
  } catch (err) {
    currentUrlBox.textContent = "Could not read tab URL";
  }

  // 2. Check desktop app status
  checkParrotStatus();

  function checkParrotStatus() {
    chrome.runtime.sendMessage({ action: "CHECK_PARROT_STATUS" }, (resp) => {
      if (resp && resp.online) {
        statusDot.className = "status-dot online";
        statusText.textContent = "Parrot Ready (Desktop Connected)";
      } else {
        statusDot.className = "status-dot offline";
        statusText.textContent = "Parrot Standby (Auto-Launch Enabled)";
      }
    });
  }

  // 3. Download current tab
  btnDownloadCurrent.addEventListener("click", async () => {
    if (!activeTabUrl) return;
    btnDownloadCurrent.disabled = true;
    btnDownloadCurrent.textContent = "Sending to Parrot...";

    try {
      await navigator.clipboard.writeText(activeTabUrl);
    } catch {}

    chrome.runtime.sendMessage(
      { action: "SEND_TO_PARROT", url: activeTabUrl },
      (res) => {
        btnDownloadCurrent.textContent = "✔ Sent to Parrot!";
        setTimeout(() => window.close(), 1200);
      }
    );
  });

  // 4. Download custom URL
  btnDownloadCustom.addEventListener("click", async () => {
    const customUrl = customUrlInput.value.trim();
    if (!customUrl) return;
    btnDownloadCustom.disabled = true;
    btnDownloadCustom.textContent = "Sending...";

    try {
      await navigator.clipboard.writeText(customUrl);
    } catch {}

    chrome.runtime.sendMessage(
      { action: "SEND_TO_PARROT", url: customUrl },
      (res) => {
        btnDownloadCustom.textContent = "✔ Sent!";
        setTimeout(() => window.close(), 1200);
      }
    );
  });
});
