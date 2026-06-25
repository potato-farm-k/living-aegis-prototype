const canvas = document.querySelector("#lunar-canvas");
const ctx = canvas.getContext("2d");

const settings = {
  earthVerticalPosition: 0.3,
  lunarSurfaceArea: 0.3,
  maxOffsetX: 288,
  maxOffsetY: 192,
  viewSpeed: 86,
  keyStep: 18,
};

const state = {
  earthScale: 6,
  viewX: 0,
  viewY: 0,
  viewportWidth: 1280,
  viewportHeight: 720,
  lastFrameTime: performance.now(),
};

const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
};

const settingEls = {
  earthScale: document.querySelector("#earth-scale-value"),
  viewX: document.querySelector("#view-offset-x"),
  viewY: document.querySelector("#view-offset-y"),
  mouseView: document.querySelector("#mouse-view-status"),
  mouseHelp: document.querySelector("#mouse-view-help"),
};

const mouseSensitivityLevels = {
  low: 0.35,
  medium: 0.65,
  high: 1,
};

const mouseView = {
  active: false,
  dragging: false,
  sensitivity: "medium",
  lastX: 0,
  lastY: 0,
};

const stars = createStars(130);
const craters = createCraters(24);

function seededRandom(seed) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createStars(count) {
  const random = seededRandom(107);
  const result = [];

  for (let i = 0; i < count; i += 1) {
    result.push({
      x: random(),
      y: random() * 0.76,
      radius: 0.6 + random() * 1.5,
      alpha: 0.35 + random() * 0.58,
      layer: 0.25 + random() * 0.9,
    });
  }

  return result;
}

function createCraters(count) {
  const random = seededRandom(293);
  const result = [];

  for (let i = 0; i < count; i += 1) {
    result.push({
      x: random(),
      y: random(),
      radius: 10 + random() * 34,
      alpha: 0.05 + random() * 0.11,
    });
  }

  return result;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wrap(value, max) {
  return ((value % max) + max) % max;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.round(rect.width));
  const height = Math.max(180, Math.round(rect.height));

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  state.viewportWidth = width;
  state.viewportHeight = height;
}

function setEarthScale(scale) {
  state.earthScale = scale;

  document.querySelectorAll(".scale-button").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.scale) === scale);
  });

  updateSettings();
}

function resetView() {
  state.viewX = 0;
  state.viewY = 0;
  updateSettings();
}

function setMouseViewActive(active) {
  mouseView.active = active;
  canvas.classList.toggle("is-mouse-view", active);
  updateMouseViewStatus();
}

function updateSettings() {
  settingEls.earthScale.textContent = `${state.earthScale}x`;
  settingEls.viewX.textContent = Math.round(state.viewX).toString();
  settingEls.viewY.textContent = Math.round(state.viewY).toString();
}

function updateMouseViewStatus() {
  settingEls.mouseView.textContent = mouseView.active ? "켜짐" : "꺼짐";
  settingEls.mouseView.classList.toggle("is-on", mouseView.active);
  settingEls.mouseHelp.textContent = mouseView.active
    ? "마우스를 움직여 시야를 이동합니다. Esc 키로 해제합니다."
    : "Canvas를 클릭하면 마우스 시야 이동을 시작합니다. 필요하면 드래그로 확인합니다.";
}

function updateSensitivityButtons() {
  document.querySelectorAll(".sensitivity-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sensitivity === mouseView.sensitivity);
  });
}

function updateView(deltaSeconds) {
  const horizontal = Number(keys.right) - Number(keys.left);
  const vertical = Number(keys.down) - Number(keys.up);

  state.viewX = clamp(
    state.viewX + horizontal * settings.viewSpeed * deltaSeconds,
    -settings.maxOffsetX,
    settings.maxOffsetX,
  );
  state.viewY = clamp(
    state.viewY + vertical * settings.viewSpeed * deltaSeconds,
    -settings.maxOffsetY,
    settings.maxOffsetY,
  );
}

function nudgeView(direction) {
  const offsets = {
    left: [-settings.keyStep, 0],
    right: [settings.keyStep, 0],
    up: [0, -settings.keyStep],
    down: [0, settings.keyStep],
  };
  const [x, y] = offsets[direction];

  state.viewX = clamp(state.viewX + x, -settings.maxOffsetX, settings.maxOffsetX);
  state.viewY = clamp(state.viewY + y, -settings.maxOffsetY, settings.maxOffsetY);
  updateSettings();
}

function moveViewByMouse(deltaX, deltaY) {
  const sensitivity = mouseSensitivityLevels[mouseView.sensitivity];

  state.viewX = clamp(state.viewX + deltaX * sensitivity, -settings.maxOffsetX, settings.maxOffsetX);
  state.viewY = clamp(state.viewY + deltaY * sensitivity, -settings.maxOffsetY, settings.maxOffsetY);
  updateSettings();
}

function startMouseDrag(event) {
  mouseView.dragging = true;
  mouseView.lastX = event.clientX;
  mouseView.lastY = event.clientY;
  setMouseViewActive(true);
}

function stopMouseDrag() {
  mouseView.dragging = false;

  if (document.pointerLockElement !== canvas) {
    setMouseViewActive(false);
  }
}

function requestMouseView(event) {
  if (event.button !== 0) {
    return;
  }

  event.preventDefault();
  startMouseDrag(event);

  if (canvas.requestPointerLock) {
    const lockRequest = canvas.requestPointerLock();

    if (lockRequest && typeof lockRequest.catch === "function") {
      lockRequest.catch(() => {});
    }

    return;
  }
}

function releaseMouseView() {
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock();
  }

  stopMouseDrag();
  setMouseViewActive(false);
}

function handlePointerLockChange() {
  const isLocked = document.pointerLockElement === canvas;

  mouseView.dragging = false;
  setMouseViewActive(isLocked);
}

function handleMouseMove(event) {
  if (document.pointerLockElement === canvas) {
    moveViewByMouse(event.movementX, event.movementY);
    return;
  }

  if (!mouseView.dragging) {
    return;
  }

  const deltaX = event.clientX - mouseView.lastX;
  const deltaY = event.clientY - mouseView.lastY;
  mouseView.lastX = event.clientX;
  mouseView.lastY = event.clientY;
  moveViewByMouse(deltaX, deltaY);
}

function drawSpace(width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#060914");
  gradient.addColorStop(0.58, "#080b12");
  gradient.addColorStop(1, "#11100d");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  stars.forEach((star) => {
    const x = wrap(star.x * width - state.viewX * star.layer * 0.45, width);
    const y = wrap(star.y * height - state.viewY * star.layer * 0.22, height);

    ctx.beginPath();
    ctx.fillStyle = `rgba(238, 247, 255, ${star.alpha})`;
    ctx.arc(x, y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawEarth(width, height) {
  const baseRadius = Math.min(width, height) * 0.035;
  const radius = baseRadius * state.earthScale;
  const centerX = width * 0.5 - state.viewX * 0.72;
  const centerY = height * settings.earthVerticalPosition - state.viewY * 0.42;

  const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.9, centerX, centerY, radius * 1.9);
  glow.addColorStop(0, "rgba(95, 188, 255, 0.22)");
  glow.addColorStop(0.55, "rgba(95, 188, 255, 0.08)");
  glow.addColorStop(1, "rgba(95, 188, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.9, 0, Math.PI * 2);
  ctx.fill();

  const ocean = ctx.createRadialGradient(
    centerX - radius * 0.25,
    centerY - radius * 0.35,
    radius * 0.08,
    centerX,
    centerY,
    radius,
  );
  ocean.addColorStop(0, "#a8e5ff");
  ocean.addColorStop(0.22, "#3aa5f4");
  ocean.addColorStop(0.72, "#1161a8");
  ocean.addColorStop(1, "#072a58");

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = ocean;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  drawLandmass(centerX - radius * 0.38, centerY - radius * 0.2, radius, [
    [-0.2, -0.44],
    [0.16, -0.52],
    [0.32, -0.23],
    [0.2, 0.02],
    [0.36, 0.28],
    [0.04, 0.46],
    [-0.22, 0.22],
    [-0.46, 0.08],
    [-0.42, -0.24],
  ]);
  drawLandmass(centerX + radius * 0.35, centerY + radius * 0.1, radius, [
    [-0.18, -0.3],
    [0.18, -0.4],
    [0.42, -0.1],
    [0.32, 0.24],
    [0.06, 0.38],
    [-0.26, 0.28],
    [-0.36, -0.04],
  ]);

  drawCloudBand(centerX, centerY - radius * 0.2, radius, -0.16);
  drawCloudBand(centerX, centerY + radius * 0.18, radius, 0.12);

  const shadow = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
  shadow.addColorStop(0, "rgba(255, 255, 255, 0.08)");
  shadow.addColorStop(0.52, "rgba(0, 0, 0, 0)");
  shadow.addColorStop(1, "rgba(0, 0, 0, 0.46)");
  ctx.fillStyle = shadow;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  ctx.strokeStyle = "rgba(197, 232, 255, 0.42)";
  ctx.lineWidth = Math.max(1, radius * 0.018);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLandmass(originX, originY, radius, points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const px = originX + x * radius;
    const py = originY + y * radius;

    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(82, 177, 106, 0.78)";
  ctx.fill();
}

function drawCloudBand(centerX, centerY, radius, tilt) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(tilt);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = Math.max(2, radius * 0.045);
  ctx.lineCap = "round";

  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.75, i * radius * 0.06);
    ctx.bezierCurveTo(
      -radius * 0.28,
      -radius * 0.14 + i * radius * 0.05,
      radius * 0.22,
      radius * 0.12 + i * radius * 0.03,
      radius * 0.72,
      i * radius * 0.06,
    );
    ctx.stroke();
  }

  ctx.restore();
}

function drawMoonSurface(width, height) {
  const baseTop = height * (1 - settings.lunarSurfaceArea);
  const top = baseTop - state.viewY * 0.18;
  const curveDepth = height * 0.045;

  ctx.beginPath();
  ctx.moveTo(0, top + curveDepth);
  ctx.quadraticCurveTo(width * 0.5, top - curveDepth, width, top + curveDepth * 0.86);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();

  const surface = ctx.createLinearGradient(0, top, 0, height);
  surface.addColorStop(0, "#9a9284");
  surface.addColorStop(0.45, "#716b61");
  surface.addColorStop(1, "#3d3934");
  ctx.fillStyle = surface;
  ctx.fill();

  ctx.strokeStyle = "rgba(241, 200, 106, 0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, top + curveDepth);
  ctx.quadraticCurveTo(width * 0.5, top - curveDepth, width, top + curveDepth * 0.86);
  ctx.stroke();

  craters.forEach((crater) => {
    const x = wrap(crater.x * width - state.viewX * 0.28, width);
    const y = top + 30 + crater.y * Math.max(1, height - top - 20);

    ctx.beginPath();
    ctx.fillStyle = `rgba(0, 0, 0, ${crater.alpha})`;
    ctx.ellipse(x, y, crater.radius * 1.35, crater.radius * 0.42, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = `rgba(255, 255, 255, ${crater.alpha * 0.7})`;
    ctx.ellipse(x - crater.radius * 0.12, y - crater.radius * 0.08, crater.radius * 1.2, crater.radius * 0.36, -0.08, 0, Math.PI);
    ctx.stroke();
  });

  const foreground = ctx.createLinearGradient(0, top, 0, height);
  foreground.addColorStop(0, "rgba(255, 255, 255, 0)");
  foreground.addColorStop(1, "rgba(0, 0, 0, 0.28)");
  ctx.fillStyle = foreground;
  ctx.fillRect(0, top, width, height - top);
}

function drawVignette(width, height) {
  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.48, height * 0.1, width * 0.5, height * 0.48, width * 0.72);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.36)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function render() {
  const width = state.viewportWidth;
  const height = state.viewportHeight;

  ctx.clearRect(0, 0, width, height);
  drawSpace(width, height);
  drawEarth(width, height);
  drawMoonSurface(width, height);
  drawVignette(width, height);
}

function loop(now) {
  const deltaSeconds = Math.min((now - state.lastFrameTime) / 1000, 0.05);
  state.lastFrameTime = now;

  updateView(deltaSeconds);
  updateSettings();
  render();
  requestAnimationFrame(loop);
}

function keyToDirection(event) {
  switch (event.code) {
    case "ArrowLeft":
    case "KeyA":
      return "left";
    case "ArrowRight":
    case "KeyD":
      return "right";
    case "ArrowUp":
    case "KeyW":
      return "up";
    case "ArrowDown":
    case "KeyS":
      return "down";
    default:
      break;
  }

  switch (event.key.toLowerCase()) {
    case "arrowleft":
    case "a":
      return "left";
    case "arrowright":
    case "d":
      return "right";
    case "arrowup":
    case "w":
      return "up";
    case "arrowdown":
    case "s":
      return "down";
    default:
      return null;
  }
}

function scaleFromKey(event) {
  switch (event.code) {
    case "Digit5":
    case "Numpad5":
      return 5;
    case "Digit6":
    case "Numpad6":
      return 6;
    case "Digit7":
    case "Numpad7":
      return 7;
    default:
      break;
  }

  if (event.key === "5" || event.key === "6" || event.key === "7") {
    return Number(event.key);
  }

  return null;
}

function isResetKey(event) {
  return event.code === "KeyR" || event.key.toLowerCase() === "r";
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    releaseMouseView();
    event.preventDefault();
    return;
  }

  const direction = keyToDirection(event);

  if (direction) {
    if (!keys[direction] && !event.repeat) {
      nudgeView(direction);
    }

    keys[direction] = true;
    event.preventDefault();
    return;
  }

  const scale = scaleFromKey(event);

  if (scale) {
    setEarthScale(scale);
    event.preventDefault();
    return;
  }

  if (isResetKey(event)) {
    resetView();
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  const direction = keyToDirection(event);

  if (direction) {
    keys[direction] = false;
    event.preventDefault();
  }
});

window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

window.addEventListener("blur", () => {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
  releaseMouseView();
});

document.querySelectorAll(".scale-button").forEach((button) => {
  button.addEventListener("click", () => {
    setEarthScale(Number(button.dataset.scale));
  });
});

document.querySelectorAll(".sensitivity-button").forEach((button) => {
  button.addEventListener("click", () => {
    mouseView.sensitivity = button.dataset.sensitivity;
    updateSensitivityButtons();
  });
});

document.querySelector("#reset-view").addEventListener("click", resetView);
canvas.addEventListener("mousedown", requestMouseView);
document.addEventListener("pointerlockchange", handlePointerLockChange);
window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mouseup", stopMouseDrag);

resizeCanvas();
updateSettings();
updateMouseViewStatus();
updateSensitivityButtons();
requestAnimationFrame(loop);
