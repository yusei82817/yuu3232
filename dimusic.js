class DiMusic {
  constructor(mediaElement) {
    if (!(mediaElement instanceof HTMLMediaElement)) {
      throw new TypeError("DiMusicにはHTMLMediaElementを指定してください。");
    }

    this.mediaElement = mediaElement;
    this.audioContext = null;
    this.source = null;
    this.masterGain = null;
    this.pannerA = null;
    this.pannerB = null;
    this.gainA = null;
    this.gainB = null;
    this.animationFrame = null;
    this.mode = "3d";
    this.enabled = false;
    this.lastTime = 0;
    this.angle = 0;

    this.STORAGE_KEY = "spatialAudioEnabled";
    this.MODE_KEY = "spatialAudioMode";
  }

  initialize() {
    if (this.audioContext) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("このブラウザはWeb Audio APIに対応していません。");
    }

    this.audioContext = new AudioContextClass();
    this.source = this.audioContext.createMediaElementSource(this.mediaElement);

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 1;

    this.pannerA = this.createPanner();
    this.pannerB = this.createPanner();

    this.gainA = this.audioContext.createGain();
    this.gainB = this.audioContext.createGain();

    this.gainA.gain.value = 0.5;
    this.gainB.gain.value = 0.5;

    const listener = this.audioContext.listener;
    if ("positionX" in listener) {
      listener.positionX.value = 0;
      listener.positionY.value = 0;
      listener.positionZ.value = 0;
    } else if (listener.setPosition) {
      listener.setPosition(0, 0, 0);
    }

    this.connectNormalAudio();
  }

  createPanner() {
    const panner = this.audioContext.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 1;
    this.setPannerPosition(panner, 0, 0, -3);
    return panner;
  }

  setPannerPosition(panner, x, y, z) {
    if ("positionX" in panner) {
      panner.positionX.value = x;
      panner.positionY.value = y;
      panner.positionZ.value = z;
    } else if (panner.setPosition) {
      panner.setPosition(x, y, z);
    }
  }

  disconnectAll() {
    this.source?.disconnect();
    this.masterGain?.disconnect();
    this.pannerA?.disconnect();
    this.pannerB?.disconnect();
    this.gainA?.disconnect();
    this.gainB?.disconnect();
  }

  connectNormalAudio() {
    this.stopMovement();
    this.disconnectAll();
    this.source.connect(this.audioContext.destination);
  }

  connect3D() {
    this.disconnectAll();
    this.source.connect(this.pannerA);
    this.pannerA.connect(this.audioContext.destination);
    this.setPannerPosition(this.pannerA, 0, 0, -3);
  }

  connect8DLeft() {
    this.disconnectAll();
    this.source.connect(this.pannerA);
    this.pannerA.connect(this.audioContext.destination);
    this.gainA.gain.value = 1;
    this.startMovement(1);
  }

  connect8DRight() {
    this.disconnectAll();
    this.source.connect(this.pannerA);
    this.pannerA.connect(this.audioContext.destination);
    this.gainA.gain.value = 1;
    this.startMovement(-1);
  }

  connect8DDual() {
    this.disconnectAll();

    this.gainA.gain.value = 0.5;
    this.gainB.gain.value = 0.5;

    this.source.connect(this.gainA);
    this.source.connect(this.gainB);

    this.gainA.connect(this.pannerA);
    this.gainB.connect(this.pannerB);

    this.pannerA.connect(this.masterGain);
    this.pannerB.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    this.startMovement(1, true);
  }

  startMovement(direction, dual = false) {
    this.stopMovement();
    this.angle = 0;
    this.lastTime = performance.now();

    const speed = Math.PI * 2 / 8000;

    const animate = time => {
      if (!this.enabled) return;

      const delta = Math.min(time - this.lastTime, 100);
      this.lastTime = time;
      this.angle += delta * speed * direction;

      const radius = 3;

      const xA = Math.sin(this.angle) * radius;
      const zA = Math.cos(this.angle) * radius;
      this.setPannerPosition(this.pannerA, xA, 0, zA);

      if (dual) {
        const xB = Math.sin(-this.angle) * radius;
        const zB = Math.cos(-this.angle) * radius;
        this.setPannerPosition(this.pannerB, xB, 0, zB);
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  stopMovement() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  async setMode(mode) {
    this.initialize();
    this.mode = ["3d", "8d-left", "8d-right", "8d-dual"].includes(mode)
      ? mode
      : "3d";

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    if (!this.enabled) return;

    switch (this.mode) {
      case "8d-left":
        this.connect8DLeft();
        break;
      case "8d-right":
        this.connect8DRight();
        break;
      case "8d-dual":
        this.connect8DDual();
        break;
      default:
        this.connect3D();
        break;
    }
  }

  async setEnabled(enabled) {
    this.initialize();

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.enabled = Boolean(enabled);

    if (!this.enabled) {
      this.connectNormalAudio();
      return;
    }

    await this.setMode(this.mode);
  }

  async loadSettings() {
    const result = await chrome.storage.local.get([
      this.STORAGE_KEY,
      this.MODE_KEY
    ]);

    this.mode = ["3d", "8d-left", "8d-right", "8d-dual"].includes(result[this.MODE_KEY])
      ? result[this.MODE_KEY]
      : "3d";

    await this.setEnabled(result[this.STORAGE_KEY] === true);
  }

  async applyStorageChange(changes) {
    if (changes[this.MODE_KEY]) {
      await this.setMode(changes[this.MODE_KEY].newValue || "3d");
    }

    if (changes[this.STORAGE_KEY]) {
      await this.setEnabled(changes[this.STORAGE_KEY].newValue === true);
    }
  }

  destroy() {
    this.stopMovement();
    this.disconnectAll();
    this.audioContext?.close();
    this.audioContext = null;
  }
}

window.DiMusic = DiMusic;
