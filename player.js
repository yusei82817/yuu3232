const audioFile = document.getElementById("audioFile");
const audioPlayer = document.getElementById("audioPlayer");
const fileName = document.getElementById("fileName");

let currentObjectUrl = null;

audioFile.addEventListener("change", () => {
  const file = audioFile.files?.[0];
  if (!file) return;

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }

  currentObjectUrl = URL.createObjectURL(file);
  audioPlayer.src = currentObjectUrl;
  audioPlayer.load();
  fileName.textContent = `選択中: ${file.name}`;
});

window.addEventListener("beforeunload", () => {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }
});
