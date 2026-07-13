const canvas = document.querySelector("#approach-canvas");
const ctx = canvas.getContext("2d");

const settings = {
  baseThreatRate: 0.06,
  lockRadius: 86,
  warningIntensity: 1.15,
  screenMargin: 28,
  edgeInset: 34,
  finalApproachStart: 0.95,
  cameraPitchLimit: 45,
  pitchShiftRatio: 0.44,
  earthDirectionY: 0.145,
  earthDirectionRadius: 0.044,
  finalCurveStart: 0.82,
  showDefenseAnchor: false,
  impactBlinkDuration: 1000,
  impactBlinkCount: 3,
};

const sourcePresets = {
  center: { label: "Center", x: 0, y: 0 },
  upper: { label: "Upper", x: 0.04, y: -0.9 },
  lower: { label: "Lower", x: -0.04, y: 0.85 },
  left: { label: "Left", x: -0.95, y: -0.05 },
  right: { label: "Right", x: 0.95, y: -0.05 },
};

const state = {
  width: 1280,
  height: 720,
  progress: 0,
  speed: 1,
  paused: false,
  cameraPitch: 0,
  warningStart: 0.75,
  lockRadius: settings.lockRadius,
  warningIntensity: settings.warningIntensity,
  sourcePreset: "center",
  lastFrameTime: performance.now(),
  intercepted: false,
  impactReached: false,
  impactStartedAt: null,
  fireStatus: "Waiting",
  interceptResult: "Ready",
  fireMessageUntil: 0,
  interceptFeedback: null,
};

const els = {
  reset: document.querySelector("#reset-threat"),
  pause: document.querySelector("#pause-threat"),
  speed: document.querySelector("#speed-multiplier"),
  cameraPitch: document.querySelector("#camera-pitch"),
  cameraPitchValue: document.querySelector("#camera-pitch-value"),
  warningStart: document.querySelector("#warning-start"),
  warningStartValue: document.querySelector("#warning-start-value"),
  lockRadiusControl: document.querySelector("#lock-radius-control"),
  lockRadiusValue: document.querySelector("#lock-radius-value"),
  warningIntensity: document.querySelector("#warning-intensity"),
  warningIntensityValue: document.querySelector("#warning-intensity-value"),
  phaseStatus: document.querySelector("#phase-status"),
  visibilityStatus: document.querySelector("#visibility-status"),
  aimStatus: document.querySelector("#aim-status"),
  fireStatus: document.querySelector("#fire-status"),
  progress: document.querySelector("#threat-progress"),
  corridorStatus: document.querySelector("#corridor-status"),
  sourceOffset: document.querySelector("#source-offset-value"),
  pitchValue: document.querySelector("#pitch-value"),
  visualContact: document.querySelector("#visual-contact"),
  offscreenState: document.querySelector("#offscreen-state"),
  aimDistance: document.querySelector("#aim-distance"),
  lockRadius: document.querySelector("#lock-radius"),
  lockStateValue: document.querySelector("#lock-state-value"),
  interceptResult: document.querySelector("#intercept-result"),
  warningActive: document.querySelector("#warning-active"),
  inputHint: document.querySelector("#input-hint"),
  defenseAnchor: document.querySelector("#defense-anchor"),
  impactAnchor: document.querySelector("#impact-anchor"),
};

const stars = createStars(160);
const craters = createCraters(22);

function seededRandom(seed) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createStars(count) {
  const random = seededRandom(808);
  const result = [];

  for (let i = 0; i < count; i += 1) {
    result.push({
      x: random(),
      y: random() * 0.78,
      radius: 0.5 + random() * 1.5,
      alpha: 0.28 + random() * 0.62,
      layer: 0.2 + random() * 0.9,
    });
  }

  return result;
}

function createCraters(count) {
  const random = seededRandom(1814);
  const result = [];

  for (let i = 0; i < count; i += 1) {
    result.push({
      x: random(),
      y: random(),
      radius: 8 + random() * 30,
      alpha: 0.04 + random() * 0.12,
    });
  }

  return result;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function cubicBezier(a, b, c, d, t) {
  const inv = 1 - t;
  const inv2 = inv * inv;
  const t2 = t * t;

  return {
    x: inv2 * inv * a.x + 3 * inv2 * t * b.x + 3 * inv * t2 * c.x + t2 * t * d.x,
    y: inv2 * inv * a.y + 3 * inv2 * t * b.y + 3 * inv * t2 * c.y + t2 * t * d.y,
  };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.round(rect.width));
  const height = Math.max(180, Math.round(rect.height));

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  state.width = width;
  state.height = height;
}

function getPitchRatio() {
  return clamp(state.cameraPitch / settings.cameraPitchLimit, -1, 1);
}

function getSurfaceMetrics(width, height) {
  const pitchRatio = getPitchRatio();
  const surfaceTop = height * clamp(0.72 - pitchRatio * 0.2, 0.5, 0.86);
  const surfaceHeight = height - surfaceTop;
  const forwardGround = {
    x: width * 0.5,
    y: surfaceTop + surfaceHeight * 0.38,
  };
  const playerAnchorY = Math.min(
    Math.max(height * 0.82, surfaceTop + surfaceHeight * 0.62),
    height * 0.9,
  );
  const playerAnchor = {
    x: width * 0.5,
    y: playerAnchorY,
  };

  return {
    top: surfaceTop,
    height: surfaceHeight,
    forwardGround,
    defense: playerAnchor,
    anchorMode: "Logical / Hidden",
    impactMode: "Player Anchor / Hidden",
  };
}

function getPathPoints(width, height) {
  const preset = sourcePresets[state.sourcePreset];
  const surface = getSurfaceMetrics(width, height);
  const pitchShift = -getPitchRatio() * height * settings.pitchShiftRatio;
  const source = {
    x: width * (0.5 + preset.x * 0.34),
    y: height * (0.34 + preset.y * 0.17) + pitchShift,
  };
  const target = surface.defense;
  const forwardTarget = surface.forwardGround;
  const controlA = {
    x: source.x + (source.x - forwardTarget.x) * 0.16,
    y: source.y - height * (0.07 + Math.abs(preset.x) * 0.02),
  };
  const controlB = {
    x: forwardTarget.x + (source.x - forwardTarget.x) * 0.24,
    y: forwardTarget.y - height * 0.37,
  };
  const finalControl = {
    x: target.x + (source.x - target.x) * 0.06,
    y: Math.min(forwardTarget.y, target.y) - height * 0.18,
  };

  return {
    source,
    controlA,
    controlB,
    forwardTarget,
    finalControl,
    target,
    surface,
  };
}

function getThreatPosition(progress, width, height) {
  const path = getPathPoints(width, height);
  const finalStart = cubicBezier(
    path.source,
    path.controlA,
    path.controlB,
    path.forwardTarget,
    settings.finalCurveStart,
  );
  let position;

  if (progress <= settings.finalCurveStart) {
    position = cubicBezier(path.source, path.controlA, path.controlB, path.forwardTarget, progress);
  } else {
    const t = clamp((progress - settings.finalCurveStart) / (1 - settings.finalCurveStart), 0, 1);
    position = cubicBezier(finalStart, path.finalControl, path.target, path.target, t);
  }

  return {
    ...position,
    path,
  };
}

function getTravelProgress(progress) {
  if (progress <= settings.finalApproachStart) {
    return (progress / settings.finalApproachStart) * 0.82;
  }

  const finalT = (progress - settings.finalApproachStart) / (1 - settings.finalApproachStart);
  return lerp(0.82, 1, clamp(finalT, 0, 1));
}

function getPhase(progress) {
  if (state.intercepted) {
    return "intercepted";
  }

  if (state.impactReached || progress >= 1) {
    return "impact";
  }

  if (progress >= settings.finalApproachStart) {
    return "finalApproach";
  }

  if (progress >= state.warningStart) {
    return "impactWarningCorridor";
  }

  if (progress >= 0.15) {
    return "mainTrajectory";
  }

  if (progress >= 0.05) {
    return "boost";
  }

  return "source";
}

function getPhaseLabel(phase) {
  const labels = {
    source: "Source",
    boost: "Boost",
    mainTrajectory: "Main Trajectory",
    impactWarningCorridor: "Impact Warning Corridor",
    finalApproach: "Final Approach",
    impact: "Impact",
    intercepted: "Intercepted",
  };

  return labels[phase] || phase;
}

function getThreatInfo(now) {
  const width = state.width;
  const height = state.height;
  const progress = clamp(state.progress, 0, 1);
  const travelProgress = getTravelProgress(progress);
  const position = getThreatPosition(travelProgress, width, height);
  const phase = getPhase(progress);
  const active = !state.intercepted && !state.impactReached;
  const onScreen =
    position.x >= settings.screenMargin &&
    position.x <= width - settings.screenMargin &&
    position.y >= settings.screenMargin &&
    position.y <= height - settings.screenMargin;
  const visualContact = active && onScreen;
  const crosshair = { x: width * 0.5, y: height * 0.5 };
  const aimDistance = Math.hypot(position.x - crosshair.x, position.y - crosshair.y);
  const lockReady = visualContact && aimDistance <= state.lockRadius;
  const inCorridor = active && progress >= state.warningStart && progress < 1;
  const warningPressure = inCorridor
    ? clamp((progress - state.warningStart) / (1 - state.warningStart), 0, 1)
    : 0;
  const warningIntensity = inCorridor
    ? state.warningIntensity * lerp(0.78, 1.18, warningPressure)
    : 0;
  const pulse = (Math.sin(now * 0.012) + 1) / 2;
  const size = lerp(4, 32, Math.pow(progress, 1.65)) + (inCorridor ? pulse * 4.8 * warningIntensity : 0);

  return {
    ...position,
    progress,
    travelProgress,
    phase,
    active,
    onScreen,
    visualContact,
    lockReady,
    aimDistance,
    inCorridor,
    warningPressure,
    warningIntensity,
    pulse,
    size,
    crosshair,
  };
}

function updateThreat(deltaSeconds) {
  if (state.paused || state.intercepted || state.impactReached) {
    return;
  }

  state.progress = clamp(
    state.progress + deltaSeconds * settings.baseThreatRate * state.speed,
    0,
    1,
  );

  if (state.progress >= 1) {
    state.impactReached = true;
    state.impactStartedAt = performance.now();
    state.fireStatus = "Impact";
    state.interceptResult = "Impact";
    state.fireMessageUntil = performance.now() + 1600;
  }
}

function setPaused(paused) {
  state.paused = paused;
  state.lastFrameTime = performance.now();
  els.pause.textContent = state.paused ? "Resume" : "Pause";
  els.pause.classList.toggle("is-paused", state.paused);
}

function resetThreat() {
  state.progress = 0;
  state.intercepted = false;
  state.impactReached = false;
  state.impactStartedAt = null;
  state.fireStatus = "Waiting";
  state.interceptResult = "Ready";
  state.fireMessageUntil = 0;
  state.interceptFeedback = null;
  setPaused(false);
}

function togglePause() {
  setPaused(!state.paused);
}

function tryFire() {
  if (state.intercepted) {
    state.fireStatus = "Intercepted";
    state.interceptResult = "Intercepted";
    state.fireMessageUntil = performance.now() + 1200;
    return;
  }

  if (state.impactReached) {
    state.fireStatus = "Impact";
    state.interceptResult = "Missed - Impact";
    state.fireMessageUntil = performance.now() + 1200;
    return;
  }

  const info = getThreatInfo(performance.now());

  if (info.lockReady) {
    state.intercepted = true;
    state.fireStatus = "Intercepted";
    state.interceptResult = "Intercepted";
    state.fireMessageUntil = performance.now() + 1800;
    state.interceptFeedback = {
      x: info.x,
      y: info.y,
      startedAt: performance.now(),
    };
    return;
  }

  if (!info.visualContact) {
    state.fireStatus = "No Visual";
    state.interceptResult = "Missed - Off-screen";
  } else {
    state.fireStatus = "No Lock";
    state.interceptResult = "Missed - No Lock";
  }

  state.fireMessageUntil = performance.now() + 1200;
}

function drawBackground(width, height, now) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#07101b");
  gradient.addColorStop(0.56, "#05070d");
  gradient.addColorStop(1, "#0b1017");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  stars.forEach((star) => {
    const twinkle = 0.82 + Math.sin(now * 0.0016 + star.x * 18) * 0.18;
    ctx.beginPath();
    ctx.fillStyle = `rgba(235, 246, 255, ${star.alpha * twinkle})`;
    ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  const earthX = width * 0.5;
  const earthY = height * settings.earthDirectionY - getPitchRatio() * height * 0.1;
  const earthRadius = Math.min(width, height) * settings.earthDirectionRadius;
  const earthGlow = ctx.createRadialGradient(earthX, earthY, earthRadius * 0.2, earthX, earthY, earthRadius * 2.5);
  earthGlow.addColorStop(0, "rgba(126, 222, 255, 0.34)");
  earthGlow.addColorStop(1, "rgba(126, 222, 255, 0)");
  ctx.fillStyle = earthGlow;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "#8fddff";
  ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "rgba(14, 73, 92, 0.52)";
  ctx.ellipse(earthX + earthRadius * 0.18, earthY + earthRadius * 0.1, earthRadius * 0.72, earthRadius * 0.34, -0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(200, 239, 255, 0.78)";
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Earth direction", earthX, earthY - earthRadius - 12);
}

function drawLunarSurface(surface, width, height) {
  const horizonY = surface.top;
  const surfaceGradient = ctx.createLinearGradient(0, horizonY, 0, height);
  surfaceGradient.addColorStop(0, "#1b232b");
  surfaceGradient.addColorStop(1, "#0d1118");

  ctx.beginPath();
  ctx.moveTo(0, horizonY + height * 0.025);
  ctx.quadraticCurveTo(width * 0.5, horizonY - height * 0.035, width, horizonY + height * 0.02);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = surfaceGradient;
  ctx.fill();

  ctx.strokeStyle = "rgba(202, 228, 255, 0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + height * 0.025);
  ctx.quadraticCurveTo(width * 0.5, horizonY - height * 0.035, width, horizonY + height * 0.02);
  ctx.stroke();

  craters.forEach((crater) => {
    const x = crater.x * width;
    const y = horizonY + surface.height * (0.16 + crater.y * 0.78);
    ctx.beginPath();
    ctx.strokeStyle = `rgba(235, 243, 255, ${crater.alpha})`;
    ctx.lineWidth = 1;
    ctx.ellipse(x, y, crater.radius * 1.7, crater.radius * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawDefenseZone(surface, now, info) {
  if (!settings.showDefenseAnchor) {
    return;
  }

  const defense = surface.defense;
  const activeWarning = info.inCorridor || state.impactReached;
  const intensity = activeWarning ? Math.max(info.warningIntensity, 1) : 0;
  const pulse = (Math.sin(now * 0.01) + 1) / 2;
  const ringRadius = 32 + (activeWarning ? pulse * 11 * intensity : pulse * 4);
  const shieldWidth = ringRadius * 2.65;
  const shieldHeight = ringRadius * 1.08;

  ctx.save();
  ctx.strokeStyle = activeWarning ? "rgba(255, 156, 108, 0.95)" : "rgba(123, 220, 255, 0.8)";
  ctx.fillStyle = activeWarning ? `rgba(255, 117, 93, ${0.08 + 0.04 * intensity})` : "rgba(123, 220, 255, 0.07)";
  ctx.lineWidth = activeWarning ? 2 + intensity : 2;

  ctx.beginPath();
  ctx.ellipse(defense.x, defense.y + ringRadius * 0.08, shieldWidth, shieldHeight * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = activeWarning ? `rgba(255, 211, 180, ${0.7 + pulse * 0.18})` : "rgba(160, 236, 255, 0.58)";
  ctx.lineWidth = activeWarning ? 3 : 2;
  ctx.beginPath();
  ctx.arc(defense.x, defense.y - ringRadius * 0.08, shieldWidth * 0.58, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(defense.x - shieldWidth * 0.38, defense.y);
  ctx.lineTo(defense.x + shieldWidth * 0.38, defense.y);
  ctx.moveTo(defense.x, defense.y - shieldHeight * 0.54);
  ctx.lineTo(defense.x, defense.y + shieldHeight * 0.34);
  ctx.stroke();

  ctx.fillStyle = "rgba(235, 246, 255, 0.88)";
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Hidden Defense Anchor", defense.x, defense.y - shieldHeight * 0.64);
  ctx.fillStyle = "rgba(200, 239, 255, 0.62)";
  ctx.font = "700 10px Arial, Helvetica, sans-serif";
  ctx.fillText("debug only", defense.x, defense.y - shieldHeight * 0.42);
  ctx.restore();
}

function drawTrajectoryGuide(info, width, height) {
  const { path } = info;

  ctx.save();
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 8]);
  ctx.strokeStyle = "rgba(123, 220, 255, 0.18)";
  ctx.beginPath();
  for (let i = 0; i <= 48; i += 1) {
    const t = i / 48;
    const p = getThreatPosition(t, width, height);
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  if (info.inCorridor) {
    ctx.lineWidth = 2 + info.warningIntensity * 0.7;
    ctx.strokeStyle = `rgba(255, 156, 108, ${Math.min(0.9, 0.38 + info.pulse * 0.34 * info.warningIntensity)})`;
    ctx.beginPath();
    for (let i = 0; i <= 24; i += 1) {
      const t = lerp(state.warningStart, settings.finalApproachStart, i / 24);
      const travelT = getTravelProgress(t);
      const p = getThreatPosition(travelT, width, height);
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();

    const target = path.target;
    ctx.fillStyle = `rgba(255, 117, 93, ${0.05 + info.pulse * 0.05 * info.warningIntensity})`;
    ctx.beginPath();
    ctx.moveTo(info.x, info.y);
    ctx.lineTo(target.x - width * 0.09, target.y + height * 0.01);
    ctx.lineTo(target.x + width * 0.09, target.y + height * 0.01);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawSource(info, now) {
  const source = info.path.source;
  const sourcePulse = clamp(1 - state.progress / 0.15, 0, 1);

  ctx.save();
  if (sourcePulse > 0) {
    const radius = 14 + Math.sin(now * 0.018) * 4 + (1 - sourcePulse) * 28;
    ctx.strokeStyle = `rgba(255, 209, 116, ${0.2 + sourcePulse * 0.45})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(source.x, source.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 209, 116, 0.94)";
  ctx.strokeStyle = "rgba(255, 248, 218, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(source.x, source.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 232, 176, 0.9)";
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("P0 Source", source.x + 12, source.y - 12);
  ctx.restore();
}

function drawTrail(info) {
  if (!info.active) {
    return;
  }

  const trailCount = 9;
  ctx.save();
  for (let i = trailCount; i >= 1; i -= 1) {
    const offset = i * 0.026;
    const t = clamp(info.progress - offset, 0, 1);
    const travelT = getTravelProgress(t);
    const point = getThreatPosition(travelT, state.width, state.height);
    const age = i / trailCount;
    const size = lerp(3, info.size * 0.68, Math.pow(travelT, 1.4));
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 186, 112, ${0.24 * (1 - age)})`;
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = `rgba(255, 186, 112, ${info.inCorridor ? Math.min(0.46, 0.24 + info.warningIntensity * 0.07) : 0.18})`;
  ctx.lineWidth = info.inCorridor ? 1.8 + info.warningIntensity * 0.7 : 1.5;
  ctx.beginPath();
  for (let i = 0; i <= trailCount; i += 1) {
    const t = clamp(info.progress - (trailCount - i) * 0.022, 0, 1);
    const travelT = getTravelProgress(t);
    const point = getThreatPosition(travelT, state.width, state.height);
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawThreat(info, now) {
  if (!info.active || !info.onScreen) {
    return;
  }

  const alpha = 0.55 + info.progress * 0.4;
  const glowRadius = info.size * (info.inCorridor ? 2.6 + info.warningIntensity * 0.75 : 2.2);
  const glow = ctx.createRadialGradient(info.x, info.y, info.size * 0.2, info.x, info.y, glowRadius);
  glow.addColorStop(0, `rgba(255, 223, 160, ${Math.min(0.82, 0.42 + info.pulse * 0.18 * Math.max(info.warningIntensity, 1))})`);
  glow.addColorStop(1, "rgba(255, 117, 93, 0)");

  ctx.save();
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(info.x, info.y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(info.x, info.y);
  ctx.rotate(Math.sin(now * 0.004) * 0.18);
  ctx.fillStyle = info.inCorridor ? `rgba(255, 126, 88, ${alpha})` : `rgba(255, 209, 116, ${alpha})`;
  ctx.strokeStyle = info.lockReady ? "rgba(156, 255, 141, 0.95)" : "rgba(255, 246, 214, 0.88)";
  ctx.lineWidth = info.lockReady ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(0, -info.size * 1.15);
  ctx.lineTo(info.size * 0.75, 0);
  ctx.lineTo(0, info.size * 1.15);
  ctx.lineTo(-info.size * 0.75, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (info.inCorridor || info.lockReady) {
    ctx.strokeStyle = info.lockReady
      ? "rgba(156, 255, 141, 0.85)"
      : `rgba(255, 156, 108, ${Math.min(0.9, 0.48 + info.pulse * 0.25 * info.warningIntensity)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, info.size * (1.45 + info.pulse * 0.22), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = info.lockReady ? "rgba(196, 255, 186, 0.95)" : "rgba(255, 232, 176, 0.9)";
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(info.lockReady ? "Lock Ready" : "P0 Missile", info.x, info.y - info.size - 14);
}

function drawOffscreenIndicator(info, width, height) {
  if (info.onScreen || !info.active) {
    return;
  }

  const center = info.crosshair;
  const angle = Math.atan2(info.y - center.y, info.x - center.x);
  const x = clamp(center.x + Math.cos(angle) * width, settings.edgeInset, width - settings.edgeInset);
  const y = clamp(center.y + Math.sin(angle) * height, settings.edgeInset, height - settings.edgeInset);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(255, 156, 108, 0.95)";
  ctx.strokeStyle = "rgba(255, 239, 218, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "rgba(255, 232, 176, 0.9)";
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Off-screen", x, y - 18);
  ctx.fillStyle = "rgba(255, 232, 176, 0.68)";
  ctx.font = "700 10px Arial, Helvetica, sans-serif";
  ctx.fillText(`Pitch ${state.cameraPitch} / ${sourcePresets[state.sourcePreset].label}`, x, y - 5);
}

function drawDebugOverlay(info, width) {
  const visibility = info.visualContact ? "Visual Contact" : "Off-screen";
  const lockState = info.lockReady ? "Lock Ready" : "Not Locked";
  const warningState = info.inCorridor ? "Active" : "Standby";
  const inputHint = state.intercepted || state.impactReached ? "R Replay" : "Click/Space Intercept";
  const panelWidth = Math.min(360, width - 32);

  ctx.save();
  ctx.fillStyle = "rgba(5, 7, 13, 0.58)";
  ctx.strokeStyle = info.visualContact ? "rgba(123, 220, 255, 0.36)" : "rgba(255, 156, 108, 0.48)";
  ctx.lineWidth = 1;
  ctx.fillRect(16, 16, panelWidth, 120);
  ctx.strokeRect(16, 16, panelWidth, 120);

  ctx.fillStyle = info.lockReady
    ? "rgba(156, 255, 141, 0.96)"
    : info.visualContact
      ? "rgba(123, 220, 255, 0.96)"
      : "rgba(255, 156, 108, 0.96)";
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Phase: ${getPhaseLabel(info.phase)} / Progress: ${Math.round(info.progress * 100)}%`, 28, 38);

  ctx.fillStyle = "rgba(235, 246, 255, 0.76)";
  ctx.font = "700 10px Arial, Helvetica, sans-serif";
  ctx.fillText(`Visibility: ${visibility} / Warning: ${warningState}`, 28, 56);
  ctx.fillText(`Lock: ${lockState} (${Math.round(info.aimDistance)} / ${state.lockRadius}px)`, 28, 72);
  ctx.fillText(`Result: ${state.interceptResult} / Input: ${inputHint}`, 28, 88);
  ctx.fillText("Defense Zone: Logical / Hidden / Impact: Hidden", 28, 104);
  ctx.fillText(`Pitch: ${state.cameraPitch} / Source: ${sourcePresets[state.sourcePreset].label} / Fixed Boost`, 28, 120);
  ctx.restore();
}

function drawCrosshair(info) {
  const center = info.crosshair;
  const lockColor = info.lockReady
    ? "rgba(156, 255, 141, 0.94)"
    : info.inCorridor
      ? "rgba(255, 156, 108, 0.78)"
      : "rgba(222, 241, 255, 0.72)";

  ctx.save();
  ctx.strokeStyle = lockColor;
  ctx.lineWidth = info.lockReady ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(center.x, center.y, state.lockRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center.x - 22, center.y);
  ctx.lineTo(center.x - 8, center.y);
  ctx.moveTo(center.x + 8, center.y);
  ctx.lineTo(center.x + 22, center.y);
  ctx.moveTo(center.x, center.y - 22);
  ctx.lineTo(center.x, center.y - 8);
  ctx.moveTo(center.x, center.y + 8);
  ctx.lineTo(center.x, center.y + 22);
  ctx.stroke();

  ctx.fillStyle = lockColor;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawImpactOrIntercept(info, now, width) {
  if (state.interceptFeedback) {
    const age = now - state.interceptFeedback.startedAt;
    const t = clamp(age / 900, 0, 1);
    const radius = 18 + t * 82;

    ctx.save();
    ctx.strokeStyle = `rgba(143, 243, 255, ${1 - t})`;
    ctx.lineWidth = 4 - t * 2.5;
    ctx.beginPath();
    ctx.arc(state.interceptFeedback.x, state.interceptFeedback.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(143, 243, 255, ${0.22 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(state.interceptFeedback.x, state.interceptFeedback.y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (t >= 1) {
      state.interceptFeedback = null;
    }
  }

  if (state.intercepted) {
    ctx.save();
    ctx.fillStyle = "rgba(143, 243, 255, 0.92)";
    ctx.font = "700 18px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("INTERCEPTED", width * 0.5, 66);
    ctx.restore();
  }

  if (state.impactReached) {
    const impactAge = state.impactStartedAt === null ? settings.impactBlinkDuration : now - state.impactStartedAt;
    const blinkActive = impactAge < settings.impactBlinkDuration;
    const blinkProgress = clamp(impactAge / settings.impactBlinkDuration, 0, 1);
    const blinkPulse = blinkActive
      ? 0.5 + Math.sin(blinkProgress * Math.PI * settings.impactBlinkCount * 2) * 0.5
      : 0.35;
    const overlayAlpha = blinkActive ? 0.08 + blinkPulse * 0.1 : 0.09;
    const borderAlpha = blinkActive ? 0.42 + blinkPulse * 0.48 : 0.62;
    const titleAlpha = blinkActive ? 0.55 + blinkPulse * 0.45 : 0.9;

    ctx.save();
    ctx.fillStyle = `rgba(255, 117, 93, ${overlayAlpha})`;
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.strokeStyle = `rgba(255, 156, 108, ${borderAlpha})`;
    ctx.lineWidth = 7;
    ctx.strokeRect(18, 18, state.width - 36, state.height - 36);
    ctx.fillStyle = `rgba(255, 235, 220, ${titleAlpha})`;
    ctx.font = "700 20px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("IMPACT", state.width * 0.5, state.height * 0.5 + 42);
    ctx.fillStyle = `rgba(255, 232, 176, ${blinkActive ? 0.52 + blinkPulse * 0.3 : 0.76})`;
    ctx.font = "700 12px Arial, Helvetica, sans-serif";
    ctx.fillText("Player anchor compromised", state.width * 0.5, state.height * 0.5 + 62);
    ctx.restore();
  }
}

function drawWarningHud(info, width, height) {
  if (!info.inCorridor) {
    return;
  }

  const alpha = Math.min(0.86, 0.3 + info.pulse * 0.24 * info.warningIntensity);
  ctx.save();
  ctx.strokeStyle = `rgba(255, 117, 93, ${alpha})`;
  ctx.lineWidth = 4 + info.warningIntensity;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  ctx.fillStyle = `rgba(255, 117, 93, ${0.05 + info.pulse * 0.035 * info.warningIntensity})`;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = `rgba(255, 232, 176, ${0.82 + info.pulse * 0.12})`;
  ctx.font = "700 15px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Impact Warning Corridor", width * 0.5, 34);
  ctx.fillStyle = info.lockReady ? "rgba(196, 255, 186, 0.96)" : "rgba(255, 232, 176, 0.82)";
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.fillText(info.lockReady ? "LOCK READY - Click / Space" : "Align crosshair for Lock Ready", width * 0.5, 54);
  ctx.restore();
}

function drawResultHud(now, width) {
  const showingMessage = now < state.fireMessageUntil;
  const isMissed = state.interceptResult.startsWith("Missed");

  if (!showingMessage || state.intercepted || state.impactReached || !isMissed) {
    return;
  }

  const message = state.interceptResult.includes("No Lock") ? "NO LOCK" : "NO VISUAL CONTACT";

  ctx.save();
  ctx.fillStyle = "rgba(255, 156, 108, 0.92)";
  ctx.font = "700 16px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(message, width * 0.5, 66);
  ctx.restore();
}

function drawFrame(now) {
  const info = getThreatInfo(now);
  const width = state.width;
  const height = state.height;

  drawBackground(width, height, now);
  drawTrajectoryGuide(info, width, height);
  drawSource(info, now);
  drawTrail(info);
  drawLunarSurface(info.path.surface, width, height);
  drawDefenseZone(info.path.surface, now, info);
  drawThreat(info, now);
  drawOffscreenIndicator(info, width, height);
  drawImpactOrIntercept(info, now, width);
  drawCrosshair(info);
  drawWarningHud(info, width, height);
  drawResultHud(now, width);
  drawDebugOverlay(info, width);
  updatePanels(info);
}

function updatePanels(info) {
  const now = performance.now();
  const phaseLabel = getPhaseLabel(info.phase);
  const visibilityLabel = state.intercepted
    ? "Intercepted"
    : state.impactReached
      ? "Impact"
      : info.visualContact
        ? "Visual Contact"
        : "Off-screen";
  const aimLabel = state.intercepted
    ? "Intercepted"
    : info.lockReady
      ? "Lock Ready"
      : "Not Locked";

  const fireLabel = state.intercepted
    ? "Intercepted"
    : state.impactReached
      ? "Impact"
      : now < state.fireMessageUntil
        ? state.fireStatus
        : (info.lockReady ? "Ready" : (info.inCorridor ? "No Lock" : "Waiting"));
  const lockStateLabel = info.lockReady ? "true" : "false";
  const inputHint = state.intercepted || state.impactReached
    ? "R Replay"
    : info.lockReady
      ? "Click / Space"
      : "Aim then fire";

  els.phaseStatus.textContent = phaseLabel;
  els.phaseStatus.className = "";
  els.phaseStatus.classList.toggle("is-warning", info.inCorridor && !state.impactReached);
  els.phaseStatus.classList.toggle("is-impact", state.impactReached);

  els.visibilityStatus.textContent = visibilityLabel;
  els.visibilityStatus.className = "";
  els.visibilityStatus.classList.toggle("is-visual", info.visualContact);
  els.visibilityStatus.classList.toggle("is-warning", info.inCorridor && !info.visualContact);

  els.aimStatus.textContent = aimLabel;
  els.aimStatus.className = "";
  els.aimStatus.classList.toggle("is-lock-ready", info.lockReady);
  els.aimStatus.classList.toggle("is-intercepted", state.intercepted);

  els.fireStatus.textContent = fireLabel;
  els.fireStatus.className = "";
  els.fireStatus.classList.toggle("is-intercepted", state.intercepted);
  els.fireStatus.classList.toggle("is-impact", state.impactReached);
  els.fireStatus.classList.toggle("is-missed", state.interceptResult.startsWith("Missed") && now < state.fireMessageUntil);
  els.fireStatus.classList.toggle("is-ready", info.lockReady && !state.intercepted && !state.impactReached);

  els.progress.textContent = `${Math.round(info.progress * 100)}%`;
  els.corridorStatus.textContent = info.inCorridor ? `Active ${Math.round(info.warningIntensity * 100)}%` : "Standby";
  els.sourceOffset.textContent = sourcePresets[state.sourcePreset].label;
  els.pitchValue.textContent = String(state.cameraPitch);
  els.visualContact.textContent = info.visualContact ? "Yes" : "No";
  els.offscreenState.textContent = !info.onScreen && info.active ? "Yes" : "No";
  els.aimDistance.textContent = `${Math.round(info.aimDistance)} px`;
  els.lockRadius.textContent = `${state.lockRadius} px`;
  els.lockStateValue.textContent = lockStateLabel;
  els.interceptResult.textContent = state.interceptResult;
  els.warningActive.textContent = info.inCorridor ? "Active" : "Standby";
  els.inputHint.textContent = inputHint;
  els.defenseAnchor.textContent = info.path.surface.anchorMode;
  els.impactAnchor.textContent = info.path.surface.impactMode;
}

function animate(now) {
  const deltaSeconds = Math.min((now - state.lastFrameTime) / 1000, 0.08);
  state.lastFrameTime = now;
  updateThreat(deltaSeconds);
  drawFrame(now);
  requestAnimationFrame(animate);
}

function bindControls() {
  els.reset.addEventListener("click", resetThreat);
  els.pause.addEventListener("click", togglePause);

  els.speed.addEventListener("change", () => {
    state.speed = Number(els.speed.value);
  });

  els.cameraPitch.addEventListener("input", () => {
    state.cameraPitch = Number(els.cameraPitch.value);
    els.cameraPitchValue.textContent = String(state.cameraPitch);
  });

  els.warningStart.addEventListener("input", () => {
    state.warningStart = Number(els.warningStart.value) / 100;
    els.warningStartValue.textContent = `${els.warningStart.value}%`;
  });

  els.lockRadiusControl.addEventListener("input", () => {
    state.lockRadius = Number(els.lockRadiusControl.value);
    els.lockRadiusValue.textContent = `${state.lockRadius}px`;
  });

  els.warningIntensity.addEventListener("input", () => {
    state.warningIntensity = Number(els.warningIntensity.value) / 100;
    els.warningIntensityValue.textContent = `${els.warningIntensity.value}%`;
  });

  document.querySelectorAll(".source-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.sourcePreset = button.dataset.sourcePreset;
      document.querySelectorAll(".source-button").forEach((sourceButton) => {
        sourceButton.classList.toggle("is-active", sourceButton === button);
      });
      resetThreat();
    });
  });

  canvas.addEventListener("click", tryFire);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      tryFire();
    }

    if (event.code === "KeyR" || event.code === "KeyN") {
      event.preventDefault();
      resetThreat();
    }

    if (event.code === "KeyP") {
      event.preventDefault();
      togglePause();
    }
  });
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
bindControls();
requestAnimationFrame(animate);
