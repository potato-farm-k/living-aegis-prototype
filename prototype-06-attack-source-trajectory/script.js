const canvas = document.querySelector("#source-canvas");
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
  threatRate: 0.052,
  impactWarningProgress: 0.82,
  launchSignalDuration: 1200,
};

const sourceModes = {
  earth: {
    label: "Earth Source",
    markerLabel: "Attack Source",
    profiles: [
      {
        label: "Earth Source / 왼쪽 가장자리",
        angle: -2.34,
        radiusMultiplier: 0.96,
        targetX: -18,
        curveBias: { x: -10, y: -6 },
        drift: 0,
      },
      {
        label: "Earth Source / 오른쪽 가장자리",
        angle: -0.82,
        radiusMultiplier: 0.96,
        targetX: 18,
        curveBias: { x: 10, y: -6 },
        drift: 0,
      },
    ],
  },
  orbital: {
    label: "Orbital Source",
    markerLabel: "Orbital Source",
    profiles: [
      {
        label: "Orbital Source / 오른쪽 궤도",
        angle: -0.62,
        radiusMultiplier: 1.36,
        targetX: 24,
        curveBias: { x: 10, y: -8 },
        drift: 0,
      },
      {
        label: "Orbital Source / 왼쪽 궤도",
        angle: -2.08,
        radiusMultiplier: 1.32,
        targetX: -24,
        curveBias: { x: -10, y: -8 },
        drift: 0,
      },
    ],
  },
};

const state = {
  earthScale: 6,
  sourceMode: "earth",
  sourceSequence: 0,
  viewX: 0,
  viewY: 0,
  viewportWidth: 1280,
  viewportHeight: 720,
  lastFrameTime: performance.now(),
  threatProgress: 0,
  intercepted: false,
  threatPassed: false,
  fireStatus: "No Visual Contact",
  fireMessageUntil: 0,
  launchStartedAt: performance.now(),
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
  sourceStatus: document.querySelector("#source-status"),
  sourceStatusValue: document.querySelector("#source-status-value"),
  sourceMode: document.querySelector("#attack-source-mode"),
  threatStatus: document.querySelector("#threat-status"),
  aimStatus: document.querySelector("#aim-status"),
  approachStatus: document.querySelector("#approach-status"),
  aimDistance: document.querySelector("#aim-distance"),
  aimGuideRadius: document.querySelector("#aim-guide-radius"),
  threatInView: document.querySelector("#threat-in-view"),
  visualContact: document.querySelector("#visual-contact"),
  occludedByLunar: document.querySelector("#occluded-by-lunar"),
  threatDirection: document.querySelector("#threat-direction"),
  threatProgress: document.querySelector("#threat-progress"),
  lunarSurfaceArea: document.querySelector("#lunar-surface-area"),
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

const stars = createStars(150);
const craters = createCraters(24);

function seededRandom(seed) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createStars(count) {
  const random = seededRandom(613);
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
  const random = seededRandom(941);
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

function getEarthWorldPosition(width, height) {
  return {
    x: 0,
    y: (height * settings.earthVerticalPosition - height * 0.5) / settings.viewScale,
  };
}

function getEarthWorldRadius(width, height) {
  const baseRadius = Math.min(width, height) * 0.035;
  return (baseRadius * state.earthScale) / settings.viewScale;
}

function getEarthMetrics(width, height) {
  const world = getEarthWorldPosition(width, height);
  const screen = projectWorldToScreen(world.x, world.y, width, height);

  return {
    screenX: screen.x,
    screenY: screen.y,
    radius: getEarthWorldRadius(width, height) * settings.viewScale,
  };
}

function getLunarSurfaceArea() {
  const lookDown = clamp(Math.max(state.viewY, 0) / settings.maxOffsetY, 0, 1);
  const lookUp = clamp(Math.max(-state.viewY, 0) / settings.maxOffsetY, 0, 1);

  return clamp(settings.lunarSurfaceArea + lookDown * 0.48 - lookUp * 0.08, 0.22, 0.78);
}

function getLunarSurfaceTop(height) {
  return height * (1 - getLunarSurfaceArea());
}

function getLunarSurfaceCurveY(width, height, screenX) {
  const top = getLunarSurfaceTop(height);
  const curveDepth = height * 0.045;
  const t = clamp(screenX / width, 0, 1);
  const inverse = 1 - t;

  return (
    inverse * inverse * (top + curveDepth) +
    2 * inverse * t * (top - curveDepth) +
    t * t * (top + curveDepth * 0.86)
  );
}

function getSourceModeConfig() {
  return sourceModes[state.sourceMode];
}

function getSourceProfile() {
  const mode = getSourceModeConfig();
  return mode.profiles[state.sourceSequence % mode.profiles.length];
}

function getSourceWorldPosition(width, height) {
  const profile = getSourceProfile();
  const earth = getEarthWorldPosition(width, height);
  const radius = getEarthWorldRadius(width, height);
  const unit = {
    x: Math.cos(profile.angle),
    y: Math.sin(profile.angle),
  };

  return {
    x: earth.x + unit.x * radius * profile.radiusMultiplier,
    y: earth.y + unit.y * radius * profile.radiusMultiplier,
    unitX: unit.x,
    unitY: unit.y,
  };
}

function getTrajectory(width, height) {
  const profile = getSourceProfile();
  const source = getSourceWorldPosition(width, height);
  const start = {
    x: source.x,
    y: source.y,
  };
  const end = getDefenseZoneWorldPosition(width, height, profile);
  const control = {
    x: (start.x + end.x) * 0.5 + profile.curveBias.x,
    y: (start.y + end.y) * 0.5 + profile.curveBias.y,
  };

  return {
    profile,
    source,
    start,
    control,
    end,
  };
}

function getDefenseZoneWorldPosition(width, height, profile) {
  const aimCenter = getAimCenter(width, height);
  const screenX = aimCenter.x + (profile.targetX - state.viewX) * settings.viewScale;
  const screenY = clamp(getLunarSurfaceCurveY(width, height, screenX), 42, height - 24);

  return {
    x: profile.targetX,
    y: state.viewY + (screenY - aimCenter.y) / settings.viewScale,
  };
}

function getThreatWorldPosition(width, height, progress = state.threatProgress) {
  const trajectory = getTrajectory(width, height);
  const t = clamp(progress, 0, 1);
  const inverse = 1 - t;
  const drift = Math.sin(t * Math.PI) * trajectory.profile.drift;

  return {
    x:
      inverse * inverse * trajectory.start.x +
      2 * inverse * t * trajectory.control.x +
      t * t * trajectory.end.x +
      drift,
    y:
      inverse * inverse * trajectory.start.y +
      2 * inverse * t * trajectory.control.y +
      t * t * trajectory.end.y,
  };
}

function resolveThreat(width, height) {
  const mode = getSourceModeConfig();
  const profile = getSourceProfile();
  const trajectory = getTrajectory(width, height);
  const sourceWorld = getSourceWorldPosition(width, height);
  const sourceScreen = projectWorldToScreen(sourceWorld.x, sourceWorld.y, width, height);
  const world = getThreatWorldPosition(width, height);
  const screen = projectWorldToScreen(world.x, world.y, width, height);
  const defenseScreen = projectWorldToScreen(trajectory.end.x, trajectory.end.y, width, height);
  const active = !state.intercepted && !state.threatPassed;
  const onScreen = active && isInsideViewport(screen.x, screen.y, width, height);
  const lunarSurfaceTop = getLunarSurfaceTop(height);
  const occluded = active && onScreen && screen.y >= lunarSurfaceTop;
  const visualContact = active && onScreen && !occluded;
  const aim = getAimMetrics(screen.x, screen.y, width, height);
  const lockReady = active && visualContact && aim.distance <= settings.aimGuideRadius;
  const distanceToDefense = Math.hypot(screen.x - defenseScreen.x, screen.y - defenseScreen.y);
  const impactWarning = active && (state.threatProgress >= settings.impactWarningProgress || distanceToDefense <= 58);

  return {
    mode: state.sourceMode,
    modeLabel: mode.label,
    markerLabel: mode.markerLabel,
    profileLabel: profile.label,
    active,
    intercepted: state.intercepted,
    threatPassed: state.threatPassed,
    progress: state.threatProgress,
    sourceWorldX: sourceWorld.x,
    sourceWorldY: sourceWorld.y,
    sourceScreenX: sourceScreen.x,
    sourceScreenY: sourceScreen.y,
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

function setSourceMode(mode) {
  state.sourceMode = mode;
  state.sourceSequence = 0;

  document.querySelectorAll(".source-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sourceMode === mode);
  });

  restartThreat(false);
}

function resetView() {
  state.viewX = 0;
  state.viewY = 0;
  updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
}

function restartThreat(advanceSource = true) {
  if (advanceSource) {
    state.sourceSequence += 1;
  }

  state.threatProgress = 0;
  state.intercepted = false;
  state.threatPassed = false;
  state.fireStatus = "No Visual Contact";
  state.fireMessageUntil = 0;
  state.launchStartedAt = performance.now();
  state.interceptFeedback = null;
  updateSettings(resolveThreat(state.viewportWidth, state.viewportHeight));
}

function updateThreat(deltaSeconds) {
  if (state.intercepted || state.threatPassed) {
    return;
  }

  state.threatProgress = clamp(state.threatProgress + settings.threatRate * deltaSeconds, 0, 1);

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

  const sourceStatus = getSourceStatusLabel(threat);
  const status = getThreatStatusLabel(threat);
  const aimStatus = getAimStatusLabel(threat);
  const fireStatus = getFireStatusLabel(threat);
  const approachStatus = getApproachStatusLabel(threat);

  settingEls.sourceStatus.textContent = sourceStatus;
  settingEls.sourceStatusValue.textContent = sourceStatus;
  settingEls.sourceStatus.classList.toggle("is-ready", sourceStatus === "Source Ready");
  settingEls.sourceMode.textContent = threat.modeLabel;
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
  settingEls.threatProgress.textContent = `${Math.round(threat.progress * 100)}%`;
  settingEls.lunarSurfaceArea.textContent = `${Math.round(getLunarSurfaceArea() * 100)}%`;
}

function getSourceStatusLabel(threat) {
  if (threat.intercepted || threat.threatPassed) {
    return "Source Ready";
  }

  if (performance.now() - state.launchStartedAt <= settings.launchSignalDuration) {
    return "Launch Signal";
  }

  return "Source Tracking";
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
    return `${threat.profileLabel} / 요격 완료`;
  }

  if (threat.threatPassed) {
    return `${threat.profileLabel} / 접근 완료`;
  }

  if (!threat.onScreen) {
    return `${threat.profileLabel} / ${threat.direction}`;
  }

  if (threat.occluded) {
    return `${threat.profileLabel} / 화면 안 / 달 표면 뒤`;
  }

  if (threat.lockReady) {
    return `${threat.profileLabel} / 화면 안 / 중앙 조준 근처`;
  }

  return `${threat.profileLabel} / 화면 안 / 시각 포착`;
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

function drawSourceMarker(threat, timestamp) {
  const sourceAge = timestamp - state.launchStartedAt;
  const launchProgress = clamp(sourceAge / settings.launchSignalDuration, 0, 1);
  const pulse = 0.5 + Math.sin(timestamp / 190) * 0.5;
  const isLaunchSignal = sourceAge <= settings.launchSignalDuration && threat.active;
  const sourceColor = threat.mode === "earth" ? "255, 207, 112" : "116, 221, 255";

  ctx.save();
  ctx.translate(threat.sourceScreenX, threat.sourceScreenY);

  if (isLaunchSignal) {
    const flashRadius = 12 + launchProgress * 48;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${sourceColor}, ${0.78 * (1 - launchProgress)})`;
    ctx.lineWidth = 2;
    ctx.arc(0, 0, flashRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = `rgba(${sourceColor}, ${0.18 * (1 - launchProgress)})`;
    ctx.arc(0, 0, flashRadius * 0.72, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.fillStyle = `rgba(${sourceColor}, 0.96)`;
  ctx.arc(0, 0, threat.mode === "earth" ? 5 : 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = `rgba(${sourceColor}, ${0.5 + pulse * 0.3})`;
  ctx.lineWidth = 2;
  ctx.arc(0, 0, 10 + pulse * 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = 1.4;
  ctx.moveTo(-12, 0);
  ctx.lineTo(-6, 0);
  ctx.moveTo(6, 0);
  ctx.lineTo(12, 0);
  ctx.moveTo(0, -12);
  ctx.lineTo(0, -6);
  ctx.moveTo(0, 6);
  ctx.lineTo(0, 12);
  ctx.stroke();

  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.fillStyle = threat.mode === "earth" ? "rgba(255, 232, 176, 0.94)" : "rgba(210, 246, 255, 0.94)";
  ctx.fillText(threat.markerLabel, 14, -12);

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

function drawDefenseZone(width, height, timestamp) {
  const trajectory = getTrajectory(width, height);
  const defense = projectWorldToScreen(trajectory.end.x, trajectory.end.y, width, height);
  const pulse = 0.5 + Math.sin(timestamp / 280) * 0.5;
  const margin = 76;

  if (
    defense.x < -margin ||
    defense.x > width + margin ||
    defense.y < -margin ||
    defense.y > height + margin
  ) {
    return;
  }

  ctx.save();
  ctx.translate(defense.x, defense.y);

  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = `rgba(255, 154, 82, ${0.38 + pulse * 0.2})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 8, 42, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 218, 150, 0.62)";
  ctx.lineWidth = 2;
  ctx.moveTo(-54, 0);
  ctx.lineTo(54, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 232, 190, 0.78)";
  ctx.lineWidth = 1.4;
  ctx.moveTo(0, -7);
  ctx.lineTo(0, 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = `rgba(255, 154, 82, ${0.16 + pulse * 0.08})`;
  ctx.ellipse(0, 8, 34, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 232, 190, 0.92)";
  ctx.fillText("Lunar Defense Zone", 0, -18);
  ctx.restore();
}

function drawTrajectoryTrace(width, height) {
  if (state.intercepted || state.threatPassed) {
    return;
  }

  const pointCount = 32;

  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 207, 112, 0.38)";
  ctx.beginPath();

  for (let i = 0; i <= pointCount; i += 1) {
    const progress = clamp((i / pointCount) * state.threatProgress, 0, 1);
    const world = getThreatWorldPosition(width, height, progress);
    const screen = projectWorldToScreen(world.x, world.y, width, height);

    if (i === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
  }

  ctx.stroke();

  ctx.setLineDash([5, 9]);
  ctx.strokeStyle = "rgba(255, 154, 82, 0.18)";
  ctx.beginPath();

  for (let i = 0; i <= pointCount; i += 1) {
    const progress = clamp(state.threatProgress + (i / pointCount) * (1 - state.threatProgress), 0, 1);
    const world = getThreatWorldPosition(width, height, progress);
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

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 1.2;
  ctx.moveTo(-14, 0);
  ctx.lineTo(-7, 0);
  ctx.moveTo(7, 0);
  ctx.lineTo(14, 0);
  ctx.moveTo(0, -14);
  ctx.lineTo(0, -7);
  ctx.moveTo(0, 7);
  ctx.lineTo(0, 14);
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
  drawSourceMarker(threat, timestamp);
  drawTrajectoryTrace(width, height);
  drawMoonSurface(width, height);
  drawDefenseZone(width, height, timestamp);
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

document.querySelectorAll(".source-button").forEach((button) => {
  button.addEventListener("click", () => {
    setSourceMode(button.dataset.sourceMode);
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
