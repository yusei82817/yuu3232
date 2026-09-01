const STORAGE_KEY = "excludedDomains";
const SPATIAL_AUDIO_KEY = "spatialAudioEnabled";
const SPATIAL_AUDIO_MODE_KEY = "spatialAudioMode";

const domainList = document.getElementById("domainList");
const emptyMessage = document.getElementById("emptyMessage");
const domainInput = document.getElementById("domainInput");
const addButton = document.getElementById("addButton");
const removeButton = document.getElementById("removeButton");
const playerTabButton = document.getElementById("playerTabButton");
const spatialAudioToggle = document.getElementById("spatialAudioToggle");
const spatialAudioState = document.getElementById("spatialAudioState");
const audioModeOptions = document.getElementById("audioModeOptions");
const audioMode = document.getElementById("audioMode");
const status = document.getElementById("status");

function normalizeDomain(value) {
  let domain = value.trim().toLowerCase();
  if (!domain) return "";

  try {
    if (!domain.includes("://")) domain = `https://${domain}`;
    const url = new URL(domain);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function getDomains() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
}

async function saveDomains(domains) {
  await chrome.storage.local.set({ [STORAGE_KEY]: domains });
}

async function loadSpatialAudioSetting() {
  const result = await chrome.storage.local.get([
    SPATIAL_AUDIO_KEY,
    SPATIAL_AUDIO_MODE_KEY
  ]);

  const enabled = result[SPATIAL_AUDIO_KEY] === true;
  const mode = ["3d", "8d-left", "8d-right", "8d-dual"].includes(result[SPATIAL_AUDIO_MODE_KEY])
    ? result[SPATIAL_AUDIO_MODE_KEY]
    : "3d";

  spatialAudioToggle.checked = enabled;
  audioMode.value = mode;
  updateSpatialAudioUI(enabled);
}

function updateSpatialAudioUI(enabled) {
  spatialAudioState.textContent = enabled ? "ON" : "OFF";
  audioModeOptions.hidden = !enabled;
}

function showStatus(message) {
  status.textContent = message;
  setTimeout(() => {
    if (status.textContent === message) status.textContent = "";
  }, 1800);
}

async function renderDomains() {
  const domains = await getDomains();
  domainList.replaceChildren();
  emptyMessage.hidden = domains.length > 0;

  for (const domain of domains) {
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = domain;

    const remove = document.createElement("button");
    remove.className = "remove-domain";
    remove.type = "button";
    remove.textContent = "削除";
    remove.addEventListener("click", async () => {
      const current = await getDomains();
      await saveDomains(current.filter(item => item !== domain));
      await renderDomains();
      showStatus(`${domain} を排除リストから削除しました。`);
    });

    li.append(text, remove);
    domainList.appendChild(li);
  }
}

addButton.addEventListener("click", async () => {
  const domain = normalizeDomain(domainInput.value);
  if (!domain) {
    showStatus("有効なドメインを入力してください。");
    return;
  }

  const domains = await getDomains();
  if (domains.includes(domain)) {
    showStatus("そのドメインは既に登録されています。");
    return;
  }

  domains.push(domain);
  domains.sort();
  await saveDomains(domains);
  domainInput.value = "";
  await renderDomains();
  showStatus(`${domain} を排除リストに追加しました。`);
});

removeButton.addEventListener("click", async () => {
  const domain = normalizeDomain(domainInput.value);
  if (!domain) {
    showStatus("撤回するドメインを入力してください。");
    return;
  }

  const domains = await getDomains();
  if (!domains.includes(domain)) {
    showStatus("そのドメインは排除リストにありません。");
    return;
  }

  await saveDomains(domains.filter(item => item !== domain));
  domainInput.value = "";
  await renderDomains();
  showStatus(`${domain} の排除を撤回しました。`);
});

domainInput.addEventListener("keydown", event => {
  if (event.key === "Enter") addButton.click();
});

spatialAudioToggle.addEventListener("change", async () => {
  const enabled = spatialAudioToggle.checked;
  updateSpatialAudioUI(enabled);
  await chrome.storage.local.set({ [SPATIAL_AUDIO_KEY]: enabled });
});

audioMode.addEventListener("change", async () => {
  await chrome.storage.local.set({
    [SPATIAL_AUDIO_MODE_KEY]: audioMode.value
  });
});

playerTabButton.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("player.html") });
});

renderDomains();
loadSpatialAudioSetting();
