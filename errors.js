const errorLayer = document.getElementById("errorLayer");

const ERROR_TYPES = [
  {
    level: "error",
    title: "SYSTEM ERROR",
    messages: [
      "The requested resource could not be loaded.",
      "Industrial control interface is not responding.",
      "Unexpected state detected in the facility network.",
      "A required subsystem failed to initialize."
    ]
  },
  {
    level: "warning",
    title: "SYSTEM WARNING",
    messages: [
      "Signal integrity is below the expected threshold.",
      "Auxiliary power connection is unstable.",
      "Environmental sensor returned an invalid value."
    ]
  },
  {
    level: "critical",
    title: "CRITICAL FAULT",
    messages: [
      "Core service heartbeat was not received.",
      "Unrecoverable communication fault detected.",
      "Facility monitoring service has stopped responding."
    ]
  }
];

const ERROR_CODES = [
  "0x0000042A",
  "0x0000F17C",
  "0x00A31E09",
  "0xDEAD0042",
  "0x7E4100C8",
  "0xC0000142",
  "0x0000A7F1"
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function createErrorWindow() {
  if (!errorLayer) return;

  const type = pick(ERROR_TYPES);
  const code = pick(ERROR_CODES);
  const windowElement = document.createElement("div");
  windowElement.className = `error-window ${type.level}`;

  const x = Math.max(12, Math.random() * (window.innerWidth - 360));
  const y = Math.max(76, Math.random() * (window.innerHeight - 260));
  windowElement.style.left = `${x}px`;
  windowElement.style.top = `${y}px`;
  windowElement.style.transform = `rotate(${(Math.random() - 0.5) * 0.8}deg)`;

  const title = document.createElement("div");
  title.className = "error-title";
  title.textContent = type.title;

  const codeElement = document.createElement("p");
  codeElement.className = "error-code";
  codeElement.textContent = `ERROR CODE: ${code}`;

  const message = document.createElement("p");
  message.className = "error-message";
  message.textContent = pick(type.messages);

  const close = document.createElement("button");
  close.className = "error-close";
  close.type = "button";
  close.textContent = "CLOSE";
  close.addEventListener("click", () => windowElement.remove());

  const noise = document.createElement("div");
  noise.className = "error-noise";
  noise.setAttribute("aria-hidden", "true");

  windowElement.append(title, codeElement, message, close, noise);
  errorLayer.appendChild(windowElement);

  console.error(
    `[SYSTEM ERROR] ${type.title} | ${code} | ${message.textContent}`
  );

  const lifetime = 4500 + Math.random() * 6500;
  window.setTimeout(() => windowElement.remove(), lifetime);
}

function scheduleNextError() {
  const delay = 12000 + Math.random() * 30000;
  window.setTimeout(() => {
    createErrorWindow();
    scheduleNextError();
  }, delay);
}

console.error("[SYSTEM] Facility diagnostic interface initialized.");
scheduleNextError();
