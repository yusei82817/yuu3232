const videoFile = document.getElementById("videoFile");
const videoPlayer = document.getElementById("videoPlayer");
const fileName = document.getElementById("fileName");
const spatialAudioStatus = document.getElementById("spatialAudioStatus");

const SPATIAL_AUDIO_KEY = "spatialAudioEnabled";
const SPATIAL_AUDIO_MODE_KEY = "spatialAudioMode";

let currentObjectUrl = null;
let diMusic = null;

function updateSpatialAudioStatus(enabled, mode = "3d") {
  const labels = {
    "3d": "3D",
    "8d-left": "8D 左回り",
    "8d-right": "8D 右回り",
    "8d-dual": "8D Dual"
  };

  spatialAudioStatus.textContent = enabled
    ? `立体音響: ON / ${labels[mode] || "3D"}`
    : "立体音響: OFF";
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

  updateSpatialAudioStatus(enabled, mode);

  if (diMusic) {
    await diMusic.setMode(mode);
    await diMusic.setEnabled(enabled);
  }
}

async function initializeDiMusic() {
  if (!diMusic) {
    diMusic = new DiMusic(videoPlayer);
  }

  const result = await chrome.storage.local.get([
    SPATIAL_AUDIO_KEY,
    SPATIAL_AUDIO_MODE_KEY
  ]);

  const enabled = result[SPATIAL_AUDIO_KEY] === true;
  const mode = ["3d", "8d-left", "8d-right", "8d-dual"].includes(result[SPATIAL_AUDIO_MODE_KEY])
    ? result[SPATIAL_AUDIO_MODE_KEY]
    : "3d";

  diMusic.mode = mode;
  await diMusic.setEnabled(enabled);
  updateSpatialAudioStatus(enabled, mode);
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
  if (areaName !== "local") return;
  if (!changes[SPATIAL_AUDIO_KEY] && !changes[SPATIAL_AUDIO_MODE_KEY]) return;

  try {
    const enabledChange = changes[SPATIAL_AUDIO_KEY];
    const modeChange = changes[SPATIAL_AUDIO_MODE_KEY];

    const enabled = enabledChange
      ? enabledChange.newValue === true
      : diMusic?.enabled === true;

    const mode = modeChange?.newValue || diMusic?.mode || "3d";

    updateSpatialAudioStatus(enabled, mode);

    if (diMusic) {
      if (modeChange) {
        await diMusic.setMode(mode);
      }
      if (enabledChange) {
        await diMusic.setEnabled(enabled);
      }
    }
  } catch (error) {
    console.error("立体音響の切り替えに失敗しました:", error);
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

  diMusic?.destroy();
});

loadSpatialAudioSetting();
