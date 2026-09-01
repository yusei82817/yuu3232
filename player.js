const videoFile = document.getElementById("videoFile");
const videoPlayer = document.getElementById("videoPlayer");
const fileName = document.getElementById("fileName");

let currentObjectUrl = null;

videoFile.addEventListener("change", () => {
  const file = videoFile.files?.[0];
  if (!file) return;

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }

  currentObjectUrl = URL.createObjectURL(file);
  videoPlayer.src = currentObjectUrl;
  videoPlayer.load();
  fileName.textContent = `選択中: ${file.name}`;
});

window.addEventListener("beforeunload", () => {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }
});
