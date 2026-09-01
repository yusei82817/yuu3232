const canvas = document.getElementById("factoryCanvas");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let scale = 1;
let seed = 73421;
let particles = [];
let dust = [];

function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function resize() {
  scale = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  buildDust();
}

function buildDust() {
  dust = Array.from({ length: Math.max(70, Math.floor(width * height / 14000)) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.3 + 0.2,
    a: Math.random() * 0.16 + 0.03,
    speed: Math.random() * 0.16 + 0.03
  }));
}

function polygon(points, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawSkyGlow() {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, "#111315");
  g.addColorStop(0.45, "#191a18");
  g.addColorStop(1, "#050606");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * 0.5, height * 0.37, 0, width * 0.5, height * 0.37, width * 0.58);
  glow.addColorStop(0, "rgba(190,190,165,0.22)");
  glow.addColorStop(0.28, "rgba(130,130,115,0.09)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawWindows() {
  const horizon = height * 0.52;
  const rows = 4;
  const cols = 15;
  const left = width * 0.16;
  const right = width * 0.84;
  const top = height * 0.1;
  const bottom = horizon * 0.94;
  const cellW = (right - left) / cols;
  const cellH = (bottom - top) / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = left + col * cellW;
      const y = top + row * cellH;
      const broken = ((col * 7 + row * 11) % 13) < 2;
      const light = broken ? "#292b28" : ((col + row) % 4 === 0 ? "#6f6d5d" : "#30322e");
      ctx.fillStyle = light;
      ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

      if (broken) {
        ctx.fillStyle = "rgba(5,5,5,0.85)";
        ctx.fillRect(x + cellW * 0.35, y, cellW * 0.32, cellH);
      }
    }
  }
}

function drawBackWall() {
  const horizon = height * 0.54;
  polygon([
    [width * 0.17, height * 0.04],
    [width * 0.83, height * 0.04],
    [width * 0.79, horizon],
    [width * 0.21, horizon]
  ], "#171918", "#343632", 2);

  drawWindows();

  ctx.strokeStyle = "rgba(65,67,62,0.65)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const y = height * (0.13 + i * 0.05);
    ctx.beginPath();
    ctx.moveTo(width * 0.18, y);
    ctx.lineTo(width * 0.82, y);
    ctx.stroke();
  }
}

function drawRoof() {
  ctx.fillStyle = "#090a0a";
  polygon([
    [0, 0], [width, 0], [width, height * 0.06], [width * 0.8, height * 0.22],
    [width * 0.2, height * 0.22], [0, height * 0.06]
  ], "#080909");

  ctx.strokeStyle = "#292b29";
  ctx.lineWidth = 5;
  for (let x = -width; x < width * 2; x += width * 0.12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(width * 0.5 + (x - width * 0.5) * 0.34, height * 0.42);
    ctx.stroke();
  }
}

function drawSteelFrames() {
  const posts = [0.04, 0.16, 0.84, 0.96];
  for (const p of posts) {
    const x = width * p;
    const inner = p < 0.5 ? width * 0.21 : width * 0.79;
    ctx.strokeStyle = "#30322f";
    ctx.lineWidth = Math.max(8, width * 0.012);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (inner - x) * 0.14, height * 0.75);
    ctx.stroke();

    ctx.strokeStyle = "rgba(7,8,8,0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 5, 0);
    ctx.lineTo(x + (inner - x) * 0.14 + 5, height * 0.75);
    ctx.stroke();
  }

  ctx.strokeStyle = "#393b36";
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    const y = height * (0.1 + i * 0.12);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width * 0.2, y + height * 0.12);
    ctx.moveTo(width, y);
    ctx.lineTo(width * 0.8, y + height * 0.12);
    ctx.stroke();
  }
}

function drawCatwalks() {
  const y = height * 0.43;
  const left = width * 0.03;
  const right = width * 0.97;

  ctx.fillStyle = "#242624";
  ctx.fillRect(left, y, width * 0.29, 12);
  ctx.fillRect(width * 0.68, y + height * 0.03, width * 0.29, 12);

  ctx.strokeStyle = "#4b4d47";
  ctx.lineWidth = 2;
  for (let x = left; x < width * 0.32; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y + 12);
    ctx.stroke();
  }
  for (let x = width * 0.68; x < right; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.03);
    ctx.lineTo(x + 8, y + height * 0.03 + 12);
    ctx.stroke();
  }

  ctx.strokeStyle = "#343630";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width * 0.12, y);
  ctx.lineTo(width * 0.16, height * 0.67);
  ctx.moveTo(width * 0.88, y + height * 0.03);
  ctx.lineTo(width * 0.83, height * 0.69);
  ctx.stroke();
}

function drawMachinery() {
  const baseY = height * 0.68;

  const machines = [
    { x: 0.07, w: 0.13, h: 0.22 },
    { x: 0.78, w: 0.14, h: 0.27 },
    { x: 0.27, w: 0.1, h: 0.14 },
    { x: 0.61, w: 0.12, h: 0.17 }
  ];

  for (const m of machines) {
    const x = width * m.x;
    const w = width * m.w;
    const h = height * m.h;
    ctx.fillStyle = "#202220";
    ctx.fillRect(x, baseY - h, w, h);
    ctx.strokeStyle = "#464841";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, baseY - h, w, h);

    for (let yy = baseY - h + 16; yy < baseY; yy += 20) {
      ctx.strokeStyle = "#30332f";
      ctx.beginPath();
      ctx.moveTo(x + 5, yy);
      ctx.lineTo(x + w - 5, yy);
      ctx.stroke();
    }
  }

  const tankX = width * 0.48;
  const tankY = height * 0.55;
  const tankW = width * 0.09;
  const tankH = height * 0.16;
  ctx.fillStyle = "#242723";
  ctx.fillRect(tankX, tankY, tankW, tankH);
  ctx.strokeStyle = "#575951";
  ctx.lineWidth = 3;
  ctx.strokeRect(tankX, tankY, tankW, tankH);
  ctx.beginPath();
  ctx.ellipse(tankX + tankW / 2, tankY, tankW / 2, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#0d0e0d";
  ctx.fillRect(tankX + tankW * 0.28, tankY + 22, tankW * 0.44, tankH - 35);
}

function drawFloor() {
  const horizon = height * 0.56;
  const floor = ctx.createLinearGradient(0, horizon, 0, height);
  floor.addColorStop(0, "#252724");
  floor.addColorStop(0.35, "#151716");
  floor.addColorStop(1, "#080909");
  polygon([[0, horizon], [width, horizon], [width, height], [0, height]], floor);

  ctx.strokeStyle = "rgba(70,72,66,0.38)";
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i++) {
    const bottomX = width * 0.5 + i * width * 0.12;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, horizon);
    ctx.lineTo(bottomX, height);
    ctx.stroke();
  }
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    const y = horizon + Math.pow(t, 1.8) * (height - horizon);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = horizon + Math.random() * (height - horizon);
    ctx.fillStyle = "rgba(80,82,76,0.15)";
    ctx.fillRect(x, y, Math.random() * 80 + 15, Math.random() * 3 + 1);
  }

  const reflection = ctx.createLinearGradient(0, horizon, 0, height);
  reflection.addColorStop(0, "rgba(185,185,165,0)");
  reflection.addColorStop(0.45, "rgba(185,185,165,0.06)");
  reflection.addColorStop(1, "rgba(185,185,165,0)");
  ctx.fillStyle = reflection;
  ctx.fillRect(width * 0.36, horizon, width * 0.28, height - horizon);
}

function drawLightBeams() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  polygon([
    [width * 0.22, 0], [width * 0.28, 0], [width * 0.47, height * 0.63], [width * 0.37, height * 0.63]
  ], "rgba(190,190,165,0.045)");
  polygon([
    [width * 0.73, 0], [width * 0.78, 0], [width * 0.63, height * 0.63], [width * 0.55, height * 0.63]
  ], "rgba(190,190,165,0.035)");
  ctx.restore();
}

function drawRustAndGrime() {
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.8;
    const len = Math.random() * 40 + 3;
    ctx.strokeStyle = `rgba(${45 + Math.floor(Math.random() * 35)}, ${30 + Math.floor(Math.random() * 25)}, ${20 + Math.floor(Math.random() * 15)}, ${Math.random() * 0.22})`;
    ctx.lineWidth = Math.random() * 2 + 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 5, y + len);
    ctx.stroke();
  }
}

function drawDust() {
  for (const p of dust) {
    p.y -= p.speed;
    p.x += Math.sin(p.y * 0.012) * 0.08;
    if (p.y < 0) p.y = height;
    ctx.fillStyle = `rgba(205,205,185,${p.a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVignette() {
  const v = ctx.createRadialGradient(width * 0.5, height * 0.45, height * 0.12, width * 0.5, height * 0.45, Math.max(width, height) * 0.72);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(0.7, "rgba(0,0,0,0.15)");
  v.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, width, height);
}

function render() {
  seed = 73421;
  ctx.clearRect(0, 0, width, height);
  drawSkyGlow();
  drawBackWall();
  drawRoof();
  drawSteelFrames();
  drawCatwalks();
  drawMachinery();
  drawFloor();
  drawLightBeams();
  drawRustAndGrime();
  drawDust();
  drawVignette();
  requestAnimationFrame(render);
}

window.addEventListener("resize", resize, { passive: true });
resize();
render();
