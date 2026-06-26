const canvas = document.querySelector("#approach-canvas");
const ctx = canvas.getContext("2d");

const settings = {
  earthVerticalPosition: 0.3,
  lunarSurfaceArea: 0.3,
  maxOffsetX: 288,
  maxOffsetY: 192,
  viewSpeed: 86,
  keyStep: 18,
  mouseSensitivity: 0.65,
  edgeInset: 30,
  screenMargin: 18,
  aimGuideRadius: 64,
  viewScale: 2.45,
  impactWarningProgress: 0.82,
};

const speedConfigs = {
  Slow: {
    label: "Slow",
    rate: 0.035,
  },
  Normal: {
    label: "Normal",
    rate: 0.055,
  },
  Fast: {
    label: "Fast",
    rate: 0.085,
  },
};

const state = {
  earthScale: 6,
  viewX: 0,
  viewY: 0,
  viewportWidth: 1280,
  viewportHeight: 720,
  lastFrameTime: performance.now(),
  threatPathIndex: 0,
  threatProgress: 0,
  threatSpeed: "Normal",
  intercepted: false,
  threatPassed: false,
  fireStatus: "No Visual Contact",
  fireMessageUntil: 0,
  interceptFeedback: null,
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
  threatStatus: document.querySelector("#threat-status"),
  aimStatus: document.querySelector("#aim-status"),
  approachStatus: document.querySelector("#approach-status"),
  approachStatusValue: document.querySelector("#approach-status-value"),
  aimDistance: document.querySelector("#aim-distance"),
  aimGuideRadius: document.querySelector("#aim-guide-radius"),
  threatInView: document.querySelector("#threat-in-view"),
  visualContact: document.querySelector("#visual-contact"),
  occludedByLunar: document.querySelector("#occluded-by-lunar"),
  threatDirection: document.querySelector("#threat-direction"),
  threatSpeed: document.querySelector("#threat-speed"),
  threatProgress: document.querySelector("#threat-progress"),
  fireStatus: document.querySelector("#fire-status"),
  fireStatusValue: document.querySelector("#fire-status-value"),
  mouseView: document.querySelector("#mouse-view-status"),
  mouseHelp: document.querySelector("#mouse-view-help"),
};

const mouseView = {
  active: false,
  dragging: false,
  lastX: 0,
  lastY: 0,
};

const approachPaths = [
  {
    label: "오른쪽 상단 접근",
    start: { x: 318, y: -146 },
    control: { x: 166, y: -112 },
    end: { x: -72, y: 104 },
  },
  {
    label: "왼쪽 상단 접근",
    start: { x: -318, y: -128 },
    control: { x: -140, y: -74 },
    end: { x: 92, y: 104 },
  },
  {
    label: "상단 급강하",
    start: { x: 44, y: -218 },
    control: { x: 118, y: -84 },
    end: { x: -24, y: 108 },
  },
];

const stars = createStars(140);
const craters = createCraters(24);

function seededRandom(seed) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createStars(count) {
  const random = seededRandom(211);
  const result = [];

  for (let i = 0; i < count; i += 1) {
    result.push({
      x: random(),
      y: random() * 0.76,
      radius: 0.5 + random() * 1.55,
      alpha: 0.32 + random() * 0.6,
      layer: 0.24 + random() * 0.9,
    });
  }

  return result;
}

function createCraters(count) {
  const random = seededRandom(397);
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

function getEarthMetrics(width, height) {
  const baseRadius = Math.min(width, height) * 0.035;
  const radius = baseRadius * state.earthScale;
  const world = getEarthWorldPosition(width, height);
  const screen = projectWorldToScreen(world.x, world.y, width, height);

  return {
    baseX: screen.x,
    baseY: screen.y,
    screenX: screen.x,
    screenY: screen.y,
    radius,
  };
}

function getEarthWorldPosition(width, height) {
  return {
    x: 0,
    y: (height * settings.earthVerticalPosition - height * 0.5) / settings.viewScale,
  };
}

function getLunarSurfaceTop(height) {
  return height * (1 - settings.lunarSurfaceArea) - state.viewY * 0.18;
}

function getThreatPath() {
  return approachPaths[state.threatPathIndex];
}

function getThreatWorldPosition(progress = state.threatProgress) {
  const path = getThreatPath();
  const t = clamp(progress, 0, 1);
  const inverse = 1 - t;
  const drift = Math.sin(t * Math.PI) * 18;

  return {
    x: inverse * inverse * path.start.x + 2 * inverse * t * path.control.x + t * t * path.end.x + drift,
    y: inverse * inverse * path.start.y + 2 * inverse * t * path.control.y + t * t * path.end.y,
  };
}

function resolveThreat(width, height) {
  const path = getThreatPath();
  const world = getThreatWorldPosition();
  const screen = projectWorldToScreen(world.x, world.y, width, height);
  const active = !state.intercepted && !state.threatPassed;
  const onScreen = active && isInsideViewport(screen.x, screen.y, width, height);
  const lunarSurfaceTop = getLunarSurfaceTop(height);
  const occluded = active && onScreen && screen.y >= lunarSurfaceTop;
  const visualContact = active && onScreen && !occluded;
  const aim = getAimMetrics(screen.x, screen.y, width, height);
  const lockReady = active && visualContact && aim.distance <= settings.aimGuideRadius;
  const impactWarning = active && (state.threatProgress >= settings.impactWarningProgress || screen.y >= lunarSurfaceTop - 42);

  return {
    label: path.label,
    active,
    intercepted: state.intercepted,
    threatPassed: state.threatPassed,
    progress: state.threatProgress,
    speed: state.threatSpeed,
    worldX: world.x,
    worldY: world.y,
    screenX: screen.x,
    screenY: screen.y,
    onScreen,
    occluded,
    visualContact,
    lockReady,
    impactWarning,
    aimDistance: aim.distance,
    aimDx: aim.dx,
    aimDy: aim.dy,
    lunarSurfaceTop,
    direction: getDirectionLabel(screen.x, screen.y, width, height),
  };
}

function projectWorldToScreen(worldX, worldY, width, height) {
  const aimCenter = getAimCenter(width, height);

  return {
    x: aimCenter.x + (worldX - state.viewX) * settings.viewScale,
    y: aimCenter.y + (worldY - state.viewY) * settings.viewScale,
  };
}

function getCameraScreenOffset() {
  return {
    x: state.viewX * settings.viewScale,
    y: state.viewY * settings.viewScale,
  };
}

function isInsideViewport(screenX, screenY, width, height) {
  const margin = settings.screenMargin;

  return screenX >= margin && screenX <= width - margin && screenY >= margin && screenY <= height - margin;
}

function getAimCenter(width, height) {
  return {
    x: width * 0.5,
    y: height * 0.5,
  };
}

function getAimMetrics(screenX, screenY, width, height) {
  const aimCenter = getAimCenter(width, height);
  const dx = screenX - aimCenter.x;
  const dy = screenY - aimCenter.y;

  return {
    dx,
    dy,
    distance: Math.hypot(dx, dy),
  };
}

function setEarthScale(scale) {
  state.earthScale = scale;

  document.querySelectorAll(".scale-button").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.scale) === scale);
  });

  updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
}

function setThreatSpeed(speed) {
  state.threatSpeed = speed;

  document.querySelectorAll(".speed-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.speed === speed);
  });

  updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
}

function resetView() {
  state.viewX = 0;
  state.viewY = 0;
  updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
}

function restartThreat(advancePath = true) {
  if (advancePath && approachPaths.length > 1) {
    state.threatPathIndex = (state.threatPathIndex + 1) % approachPaths.length;
  }

  state.threatProgress = 0;
  state.intercepted = false;
  state.threatPassed = false;
  state.fireStatus = "No Visual Contact";
  state.fireMessageUntil = 0;
  state.interceptFeedback = null;
  updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
}

function updateThreat(deltaSeconds) {
  if (state.intercepted || state.threatPassed) {
    return;
  }

  state.threatProgress = clamp(state.threatProgress + speedConfigs[state.threatSpeed].rate * deltaSeconds, 0, 1);

  if (state.threatProgress >= 1) {
    state.threatPassed = true;
    state.fireStatus = "Threat Passed";
    state.fireMessageUntil = performance.now() + 1400;
  }
}

function attemptFire() {
  const threat = resolveThreat(state.viewportWidth, state.viewportHeight);

  if (threat.intercepted) {
    setFireMessage("Already Intercepted", 900);
    return "already-intercepted";
  }

  if (threat.threatPassed) {
    setFireMessage("Threat Passed", 900);
    return "threat-passed";
  }

  if (threat.lockReady) {
    state.intercepted = true;
    state.fireStatus = "Intercepted";
    state.fireMessageUntil = performance.now() + 1000;
    state.interceptFeedback = {
      x: threat.screenX,
      y: threat.screenY,
      startedAt: performance.now(),
    };
    updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
    return "intercepted";
  }

  if (threat.visualContact) {
    setFireMessage("Not Aligned", 1000);
    return "not-aligned";
  }

  if (threat.occluded) {
    setFireMessage("Occluded", 1000);
    return "occluded";
  }

  setFireMessage("No Visual Contact", 1000);
  return "no-visual-contact";
}

function setFireMessage(message, duration) {
  state.fireStatus = message;
  state.fireMessageUntil = performance.now() + duration;
  updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
}

function setMouseViewActive(active) {
  mouseView.active = active;
  canvas.classList.toggle("is-mouse-view", active);
  updateMouseViewStatus();
}

function updateSettings(threat) {
  settingEls.earthScale.textContent = `${state.earthScale}x`;
  settingEls.viewX.textContent = Math.round(state.viewX).toString();
  settingEls.viewY.textContent = Math.round(state.viewY).toString();

  if (!threat) {
    return;
  }

  const status = getThreatStatusLabel(threat);
  const aimStatus = getAimStatusLabel(threat);
  const fireStatus = getFireStatusLabel(threat);
  const approachStatus = getApproachStatusLabel(threat);

  settingEls.threatStatus.textContent = status;
  settingEls.threatStatus.classList.toggle("is-occluded", threat.occluded);
  settingEls.threatStatus.classList.toggle("is-visual", threat.visualContact);
  settingEls.threatStatus.classList.toggle("is-lock-ready", threat.lockReady);
  settingEls.threatStatus.classList.toggle("is-intercepted", threat.intercepted);
  settingEls.threatStatus.classList.toggle("is-passed", threat.threatPassed);
  settingEls.aimStatus.textContent = aimStatus;
  settingEls.aimStatus.classList.toggle("is-searching", threat.visualContact && !threat.lockReady);
  settingEls.aimStatus.classList.toggle("is-lock-ready", threat.lockReady);
  settingEls.aimStatus.classList.toggle("is-intercepted", threat.intercepted);
  settingEls.approachStatus.textContent = approachStatus;
  settingEls.approachStatus.classList.toggle("is-warning", approachStatus === "Impact Warning");
  settingEls.approachStatus.classList.toggle("is-intercepted", approachStatus === "Intercepted");
  settingEls.approachStatus.classList.toggle("is-passed", approachStatus === "Threat Passed");
  settingEls.approachStatusValue.textContent = approachStatus;
  settingEls.fireStatus.textContent = fireStatus;
  settingEls.fireStatus.classList.toggle("is-ready", fireStatus === "Lock Ready");
  settingEls.fireStatus.classList.toggle("is-warning", isFireWarning(fireStatus));
  settingEls.fireStatus.classList.toggle("is-intercepted", fireStatus === "Intercepted");
  settingEls.fireStatusValue.textContent = fireStatus;
  settingEls.aimDistance.textContent = threat.intercepted || threat.threatPassed ? "-" : `${Math.round(threat.aimDistance)} px`;
  settingEls.aimGuideRadius.textContent = `${settings.aimGuideRadius} px`;
  settingEls.threatInView.textContent = threat.onScreen ? "Yes" : "No";
  settingEls.visualContact.textContent = threat.visualContact ? "Yes" : "No";
  settingEls.occludedByLunar.textContent = threat.occluded ? "Yes" : "No";
  settingEls.threatDirection.textContent = getThreatDirectionLabel(threat);
  settingEls.threatSpeed.textContent = speedConfigs[state.threatSpeed].label;
  settingEls.threatProgress.textContent = `${Math.round(threat.progress * 100)}%`;
}

function getThreatStatusLabel(threat) {
  if (threat.intercepted) {
    return "Intercepted";
  }

  if (threat.threatPassed) {
    return "Threat Passed";
  }

  if (!threat.onScreen) {
    return "Off-screen";
  }

  if (threat.occluded) {
    return "Detected / Occluded";
  }

  if (threat.lockReady) {
    return "Lock Ready";
  }

  return "Visual Contact";
}

function getAimStatusLabel(threat) {
  if (threat.intercepted) {
    return "Intercepted";
  }

  if (threat.threatPassed) {
    return "Not Available";
  }

  if (threat.lockReady) {
    return "Aim Aligned / Lock Ready";
  }

  if (threat.visualContact) {
    return "Aim Searching";
  }

  return "Not Available";
}

function getApproachStatusLabel(threat) {
  if (threat.intercepted) {
    return "Intercepted";
  }

  if (threat.threatPassed) {
    return "Threat Passed";
  }

  if (threat.impactWarning) {
    return "Impact Warning";
  }

  return "Approaching";
}

function getFireStatusLabel(threat) {
  if (performance.now() < state.fireMessageUntil) {
    return state.fireStatus;
  }

  if (threat.intercepted) {
    return "Intercepted";
  }

  if (threat.threatPassed) {
    return "Threat Passed";
  }

  if (threat.lockReady) {
    return "Lock Ready";
  }

  if (threat.visualContact) {
    return "Not Aligned";
  }

  if (threat.occluded) {
    return "Occluded";
  }

  return "No Visual Contact";
}

function isFireWarning(status) {
  return (
    status === "Not Aligned" ||
    status === "Occluded" ||
    status === "No Visual Contact" ||
    status === "Already Intercepted" ||
    status === "Threat Passed"
  );
}

function getThreatDirectionLabel(threat) {
  if (threat.intercepted) {
    return `${threat.label} / 요격 완료`;
  }

  if (threat.threatPassed) {
    return `${threat.label} / 접근 완료`;
  }

  if (!threat.onScreen) {
    return `${threat.label} / ${threat.direction}`;
  }

  if (threat.occluded) {
    return `${threat.label} / 화면 안 / 달 표면 뒤`;
  }

  if (threat.lockReady) {
    return `${threat.label} / 화면 안 / 중앙 조준 근처`;
  }

  return `${threat.label} / 화면 안 / 시각 포착`;
}

function updateMouseViewStatus() {
  settingEls.mouseView.textContent = mouseView.active ? "켜짐" : "꺼짐";
  settingEls.mouseView.classList.toggle("is-on", mouseView.active);
  settingEls.mouseHelp.textContent = mouseView.active
    ? "마우스를 움직여 시야를 이동합니다. Esc 키로 해제합니다."
    : "Canvas를 클릭하면 발사와 마우스 시야 이동을 함께 확인합니다. 필요하면 드래그로 확인합니다.";
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
  updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
}

function moveViewByMouse(deltaX, deltaY) {
  state.viewX = clamp(state.viewX + deltaX * settings.mouseSensitivity, -settings.maxOffsetX, settings.maxOffsetX);
  state.viewY = clamp(state.viewY + deltaY * settings.mouseSensitivity, -settings.maxOffsetY, settings.maxOffsetY);
  updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
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
  const fireResult = attemptFire();

  if (fireResult === "intercepted" && document.pointerLockElement !== canvas) {
    return;
  }

  startMouseDrag(event);

  if (canvas.requestPointerLock) {
    const lockRequest = canvas.requestPointerLock();

    if (lockRequest && typeof lockRequest.catch === "function") {
      lockRequest.catch(() => {});
    }
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

  const camera = getCameraScreenOffset();

  stars.forEach((star) => {
    const x = wrap(star.x * width - camera.x * star.layer, width);
    const y = wrap(star.y * height - camera.y * star.layer, height);

    ctx.beginPath();
    ctx.fillStyle = `rgba(238, 247, 255, ${star.alpha})`;
    ctx.arc(x, y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawEarth(width, height) {
  const earth = getEarthMetrics(width, height);
  const { screenX: centerX, screenY: centerY, radius } = earth;

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
  const top = getLunarSurfaceTop(height);
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

function drawApproachTrace(width, height) {
  if (state.intercepted || state.threatPassed) {
    return;
  }

  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 154, 82, 0.28)";
  ctx.beginPath();

  for (let i = 0; i <= 24; i += 1) {
    const progress = clamp((i / 24) * state.threatProgress, 0, 1);
    const world = getThreatWorldPosition(progress);
    const screen = projectWorldToScreen(world.x, world.y, width, height);

    if (i === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
  }

  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawThreat(threat, width, height, timestamp) {
  if (threat.intercepted || threat.threatPassed) {
    return;
  }

  if (!threat.onScreen) {
    drawEdgeIndicator(threat, width, height, timestamp);
    return;
  }

  if (threat.occluded) {
    drawOccludedIndicator(threat, timestamp);
    return;
  }

  const pulse = 0.5 + Math.sin(timestamp / 210) * 0.5;
  const radius = 6 + pulse * 4;
  const coreColor = threat.lockReady ? "rgba(156, 255, 138, 0.96)" : "rgba(255, 107, 74, 0.92)";
  const ringColor = threat.lockReady
    ? `rgba(156, 255, 138, ${0.42 + pulse * 0.34})`
    : `rgba(255, 154, 82, ${0.42 + pulse * 0.28})`;

  ctx.save();
  ctx.translate(threat.screenX, threat.screenY);

  ctx.beginPath();
  ctx.fillStyle = coreColor;
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2;
  ctx.arc(0, 0, threat.lockReady ? radius + 3 : radius, 0, Math.PI * 2);
  ctx.stroke();

  if (threat.impactWarning && !threat.lockReady) {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 210, 122, 0.54)";
    ctx.lineWidth = 1.5;
    ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.fillStyle = threat.lockReady ? "rgba(222, 255, 216, 0.94)" : "rgba(255, 230, 210, 0.92)";
  ctx.fillText(threat.lockReady ? "Lock Ready" : "Visual Contact", 12, -10);
  ctx.restore();
}

function drawOccludedIndicator(threat, timestamp) {
  const pulse = 0.5 + Math.sin(timestamp / 240) * 0.5;
  const radius = 8 + pulse * 5;

  ctx.save();
  ctx.translate(threat.screenX, threat.screenY);
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = `rgba(241, 200, 106, ${0.52 + pulse * 0.24})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.fillStyle = "rgba(241, 200, 106, 0.84)";
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "rgba(255, 232, 170, 0.9)";
  ctx.fillText(threat.impactWarning ? "Impact Warning" : "Occluded", 12, -10);
  ctx.restore();
}

function drawEdgeIndicator(threat, width, height, timestamp) {
  const edge = getEdgePoint(threat.screenX, threat.screenY, width, height);
  const pulse = 0.55 + Math.sin(timestamp / 190) * 0.45;

  ctx.save();
  ctx.translate(edge.x, edge.y);
  ctx.rotate(edge.angle);

  ctx.beginPath();
  ctx.moveTo(15 + pulse * 3, 0);
  ctx.lineTo(-10, -10);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 107, 74, 0.95)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 230, 210, 0.72)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 216, 190, 0.9)";
  ctx.fillText("위협 방향", edge.x, clamp(edge.y + 25, 22, height - 14));
  ctx.restore();
}

function getEdgePoint(screenX, screenY, width, height) {
  const inset = settings.edgeInset;
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const dx = screenX - centerX;
  const dy = screenY - centerY;
  const scaleX = dx === 0 ? Infinity : (dx > 0 ? width - inset - centerX : inset - centerX) / dx;
  const scaleY = dy === 0 ? Infinity : (dy > 0 ? height - inset - centerY : inset - centerY) / dy;
  const scale = Math.max(0, Math.min(scaleX, scaleY));

  return {
    x: clamp(centerX + dx * scale, inset, width - inset),
    y: clamp(centerY + dy * scale, inset, height - inset),
    angle: Math.atan2(dy, dx),
  };
}

function getDirectionLabel(screenX, screenY, width, height) {
  const dx = screenX - width * 0.5;
  const dy = screenY - height * 0.5;
  const angle = Math.atan2(dy, dx);
  const octant = Math.round(angle / (Math.PI / 4));
  const labels = {
    0: "오른쪽",
    1: "오른쪽 아래",
    2: "아래쪽",
    3: "왼쪽 아래",
    4: "왼쪽",
    "-4": "왼쪽",
    "-3": "왼쪽 위",
    "-2": "위쪽",
    "-1": "오른쪽 위",
  };

  return labels[octant] || "오른쪽";
}

function drawAimGuide(width, height, threat, timestamp) {
  const aimCenter = getAimCenter(width, height);
  const pulse = 0.5 + Math.sin(timestamp / 260) * 0.5;
  const color = threat.intercepted ? "143, 243, 255" : threat.lockReady ? "156, 255, 138" : "116, 221, 255";

  ctx.save();
  ctx.translate(aimCenter.x, aimCenter.y);

  ctx.beginPath();
  ctx.strokeStyle = `rgba(${color}, ${0.3 + pulse * 0.16})`;
  ctx.lineWidth = threat.lockReady || threat.intercepted ? 2.5 : 1.5;
  ctx.arc(0, 0, settings.aimGuideRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = `rgba(${color}, 0.86)`;
  ctx.lineWidth = 2;
  ctx.moveTo(-18, 0);
  ctx.lineTo(-6, 0);
  ctx.moveTo(6, 0);
  ctx.lineTo(18, 0);
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -6);
  ctx.moveTo(0, 6);
  ctx.lineTo(0, 18);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = `rgba(${color}, 0.92)`;
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawInterceptFeedback(width, height, timestamp) {
  if (!state.interceptFeedback) {
    return;
  }

  const elapsed = timestamp - state.interceptFeedback.startedAt;
  const duration = 1000;
  const progress = clamp(elapsed / duration, 0, 1);
  const fade = 1 - progress;
  const burstRadius = 18 + progress * 74;

  if (progress >= 1) {
    state.interceptFeedback = null;
    return;
  }

  ctx.save();
  ctx.fillStyle = `rgba(143, 243, 255, ${0.13 * fade})`;
  ctx.fillRect(0, 0, width, height);

  ctx.translate(state.interceptFeedback.x, state.interceptFeedback.y);

  ctx.beginPath();
  ctx.strokeStyle = `rgba(143, 243, 255, ${0.86 * fade})`;
  ctx.lineWidth = 3;
  ctx.arc(0, 0, burstRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.64 * fade})`;
  ctx.lineWidth = 1.5;
  ctx.arc(0, 0, burstRadius * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    const inner = 10 + progress * 16;
    const outer = 20 + progress * 46;

    ctx.beginPath();
    ctx.strokeStyle = `rgba(143, 243, 255, ${0.48 * fade})`;
    ctx.lineWidth = 2;
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.font = "700 13px Arial, Helvetica, sans-serif";
  ctx.fillStyle = `rgba(221, 252, 255, ${0.94 * fade})`;
  ctx.fillText("Intercepted", 18, -18);
  ctx.restore();
}

function drawVignette(width, height) {
  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.48, height * 0.1, width * 0.5, height * 0.48, width * 0.72);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.36)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function render(timestamp) {
  const width = state.viewportWidth;
  const height = state.viewportHeight;
  const threat = resolveThreat(width, height);

  ctx.clearRect(0, 0, width, height);
  drawSpace(width, height);
  drawEarth(width, height);
  drawApproachTrace(width, height);
  drawMoonSurface(width, height);
  drawVignette(width, height);
  drawThreat(threat, width, height, timestamp);
  drawAimGuide(width, height, threat, timestamp);
  drawInterceptFeedback(width, height, timestamp);
  updateSettings(threat);
}

function loop(now) {
  const deltaSeconds = Math.min((now - state.lastFrameTime) / 1000, 0.05);
  state.lastFrameTime = now;

  updateView(deltaSeconds);
  updateThreat(deltaSeconds);
  render(now);
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

function speedFromKey(event) {
  switch (event.code) {
    case "Digit1":
    case "Numpad1":
      return "Slow";
    case "Digit2":
    case "Numpad2":
      return "Normal";
    case "Digit3":
    case "Numpad3":
      return "Fast";
    default:
      return null;
  }
}

function isResetKey(event) {
  return event.code === "KeyR" || event.key.toLowerCase() === "r";
}

function isNextThreatKey(event) {
  return event.code === "KeyN" || event.key.toLowerCase() === "n";
}

function isFireKey(event) {
  return event.code === "Space" || event.key === " ";
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    releaseMouseView();
    event.preventDefault();
    return;
  }

  if (isFireKey(event)) {
    if (!event.repeat) {
      attemptFire();
    }

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

  const speed = speedFromKey(event);

  if (speed) {
    setThreatSpeed(speed);
    event.preventDefault();
    return;
  }

  if (isResetKey(event)) {
    resetView();
    event.preventDefault();
    return;
  }

  if (isNextThreatKey(event)) {
    restartThreat();
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
  render(performance.now());
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

document.querySelectorAll(".speed-button").forEach((button) => {
  button.addEventListener("click", () => {
    setThreatSpeed(button.dataset.speed);
  });
});

document.querySelector("#reset-view").addEventListener("click", resetView);
document.querySelector("#restart-threat").addEventListener("click", () => restartThreat());
canvas.addEventListener("mousedown", requestMouseView);
document.addEventListener("pointerlockchange", handlePointerLockChange);
window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mouseup", stopMouseDrag);

resizeCanvas();
updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
updateMouseViewStatus();
requestAnimationFrame(loop);
