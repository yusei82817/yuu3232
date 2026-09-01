(() => {
  const STORAGE_KEY = "excludedDomains";
  const PLAYER_ID = "search-domain-exclusion-player";

  let excludedDomains = [];

  function isExcludedHostname(hostname) {
    const host = hostname.toLowerCase().replace(/^www\./, "");
    return excludedDomains.some(domain => {
      const normalized = domain.toLowerCase().replace(/^www\./, "");
      return host === normalized || host.endsWith(`.${normalized}`);
    });
  }

  function findResultContainer(link) {
    const selectors = [
      "div.MjjYud",
      "div.g",
      "div[data-snhf]",
      "li.b_algo",
      "article"
    ];

    for (const selector of selectors) {
      const container = link.closest(selector);
      if (container) return container;
    }

    let current = link;
    for (let i = 0; i < 5 && current && current.parentElement; i++) {
      current = current.parentElement;
    }
    return current || link.parentElement;
  }

  function removeExcludedResults(root = document) {
    if (!excludedDomains.length) return;

    const links = root.querySelectorAll
      ? root.querySelectorAll("a[href]")
      : [];

    for (const link of links) {
      const href = link.href;
      if (!href) continue;

      try {
        const url = new URL(href, location.href);
        if (!/^https?:$/.test(url.protocol)) continue;
        if (!isExcludedHostname(url.hostname)) continue;

        const container = findResultContainer(link);
        if (container && container !== document.body && container !== document.documentElement) {
          container.remove();
        }
      } catch {
        // 無効なURLは無視する。
      }
    }
  }

  function hideGoogleAds() {
    document.querySelectorAll("#taw").forEach(element => {
      element.style.setProperty("display", "none", "important");
    });
  }

  function styleOutsideBox() {
    document.querySelectorAll("h1, h2, p").forEach(element => {
      if (element.closest("box")) return;
      element.style.setProperty("color", "#39ff14", "important");
      element.style.setProperty("background", "#000", "important");
    });
  }

  function createAudioPlayer() {
    if (!document.body || document.getElementById(PLAYER_ID)) return;

    const host = document.createElement("div");
    host.id = PLAYER_ID;

    const shadow = host.attachShadow({ mode: "closed" });
    const wrapper = document.createElement("div");
    wrapper.className = "player";

    const label = document.createElement("label");
    label.textContent = "オーディオファイル選択";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "再生";

    const audio = document.createElement("audio");
    audio.preload = "metadata";

    let objectUrl = null;

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      audio.load();
    });

    button.addEventListener("click", async () => {
      if (!audio.src) return;
      try {
        if (audio.paused) {
          await audio.play();
          button.textContent = "一時停止";
        } else {
          audio.pause();
          button.textContent = "再生";
        }
      } catch {
        button.textContent = "再生";
      }
    });

    audio.addEventListener("ended", () => {
      button.textContent = "再生";
    });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }
      .player {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
        width: 250px;
        padding: 12px;
        border: 1px solid #39ff14;
        border-radius: 6px;
        background: #000;
        color: #39ff14;
        font-family: Arial, sans-serif;
        box-shadow: 0 0 12px rgba(57, 255, 20, 0.45);
      }
      label {
        display: block;
        margin-bottom: 7px;
        font-size: 13px;
      }
      input {
        display: block;
        width: 100%;
        margin-bottom: 8px;
        color: #39ff14;
        background: #000;
        font-size: 11px;
      }
      button {
        width: 100%;
        padding: 7px;
        border: 1px solid #39ff14;
        background: #000;
        color: #39ff14;
        cursor: pointer;
        font-size: 13px;
      }
      button:hover {
        background: #39ff14;
        color: #000;
      }
    `;

    wrapper.append(label, input, button, audio);
    shadow.append(style, wrapper);
    document.body.appendChild(host);
  }

  async function loadDomains() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      excludedDomains = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
      removeExcludedResults();
    } catch {
      excludedDomains = [];
    }
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) return;
    excludedDomains = Array.isArray(changes[STORAGE_KEY].newValue)
      ? changes[STORAGE_KEY].newValue
      : [];
    removeExcludedResults();
  });

  function runPageFilters() {
    hideGoogleAds();
    removeExcludedResults();
    styleOutsideBox();
  }

  const observer = new MutationObserver(mutations => {
    hideGoogleAds();
    removeExcludedResults();
    styleOutsideBox();

    if (document.body && !document.getElementById(PLAYER_ID)) {
      createAudioPlayer();
    }
  });

  function start() {
    loadDomains();
    runPageFilters();
    createAudioPlayer();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
