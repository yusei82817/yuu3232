class DiMusic {
  constructor(mediaElement) {
    if (!(mediaElement instanceof HTMLMediaElement)) {
      throw new TypeError("DiMusicにはHTMLMediaElementを指定してください。");
    }

    this.mediaElement = mediaElement;
    this.audioContext = null;
    this.source = null;
    this.panner = null;
    this.enabled = false;
  }

  initialize() {
    if (this.audioContext) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("このブラウザはWeb Audio APIに対応していません。");
    }

    this.audioContext = new AudioContextClass();
    this.source = this.audioContext.createMediaElementSource(this.mediaElement);

    this.panner = this.audioContext.createPanner();
    this.panner.panningModel = "HRTF";
    this.panner.distanceModel = "inverse";
    this.panner.refDistance = 1;
    this.panner.maxDistance = 10000;
    this.panner.rolloffFactor = 1;

    this.panner.positionX.value = 0;
    this.panner.positionY.value = 0;
    this.panner.positionZ.value = -1;

    const listener = this.audioContext.listener;
    if ("positionX" in listener) {
      listener.positionX.value = 0;
      listener.positionY.value = 0;
      listener.positionZ.value = 0;
    }

    this.connectNormalAudio();
  }

  connectNormalAudio() {
    this.source.disconnect();
    this.source.connect(this.audioContext.destination);
  }

  connectSpatialAudio() {
    this.source.disconnect();
    this.source.connect(this.panner);
    this.panner.connect(this.audioContext.destination);
  }

  async setEnabled(enabled) {
    this.initialize();

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.enabled = Boolean(enabled);

    if (this.enabled) {
      this.connectSpatialAudio();
    } else {
      this.panner.disconnect();
      this.connectNormalAudio();
    }
  }

  async resume() {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }
  }
}

window.DiMusic = DiMusic;
