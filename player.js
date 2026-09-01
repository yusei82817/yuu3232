const videoFile = document.getElementById("videoFile");
const videoPlayer = document.getElementById("videoPlayer");
const fileName = document.getElementById("fileName");
const spatialAudioStatus = document.getElementById("spatialAudioStatus");

const SPATIAL_AUDIO_KEY = "spatialAudioEnabled";

let currentObjectUrl = null;
let diMusic = null;

function updateSpatialAudioStatus(enabled) {
  spatialAudioStatus.textContent = `立体音響: ${enabled ? "ON" : "OFF"}`;
}

async function loadSpatialAudioSetting() {
  const result = await chrome.storage.local.get(SPATIAL_AUDIO_KEY);
  const enabled = result[SPATIAL_AUDIO_KEY] === true;
  updateSpatialAudioStatus(enabled);

  if (diMusic) {
    await diMusic.setEnabled(enabled);
  }
}

async function initializeDiMusic() {
  if (!diMusic) {
    diMusic = new DiMusic(videoPlayer);
  }

  const result = await chrome.storage.local.get(SPATIAL_AUDIO_KEY);
  await diMusic.setEnabled(result[SPATIAL_AUDIO_KEY] === true);
}

videoFile.addEventListener("change", async () => {
  const file = videoFile.files?.[0];
  if (!file) return;

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }

  currentObjectUrl = URL.createObjectURL(file);
  videoPlayer.src = currentObjectUrl;
  videoPlayer.load();
  fileName.textContent = `選択中: ${file.name}`;

  try {
    await initializeDiMusic();
  } catch (error) {
    console.error("DiMusicの初期化に失敗しました:", error);
    updateSpatialAudioStatus(false);
  }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "local" || !changes[SPATIAL_AUDIO_KEY]) return;

  const enabled = changes[SPATIAL_AUDIO_KEY].newValue === true;
  updateSpatialAudioStatus(enabled);

  if (diMusic) {
    try {
      await diMusic.setEnabled(enabled);
    } catch (error) {
      console.error("立体音響の切り替えに失敗しました:", error);
    }
  }
});

videoPlayer.addEventListener("play", async () => {
  if (!diMusic) return;

  try {
    await diMusic.resume();
  } catch (error) {
    console.error("AudioContextの再開に失敗しました:", error);
  }
});

window.addEventListener("beforeunload", () => {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }
});

loadSpatialAudioSetting();
