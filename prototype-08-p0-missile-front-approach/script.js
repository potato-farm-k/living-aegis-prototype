const canvas = document.querySelector("#approach-canvas");
const ctx = canvas.getContext("2d");

const settings = {
  baseThreatRate: 0.06,
  lockRadius: 86,
  screenMargin: 28,
  edgeInset: 34,
  finalApproachStart: 0.95,
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
  sourcePreset: "center",
  lastFrameTime: performance.now(),
  intercepted: false,
  impactReached: false,
  fireStatus: "Waiting",
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
  return clamp(state.cameraPitch / 30, -1, 1);
}

function getSurfaceMetrics(width, height) {
  const pitchRatio = getPitchRatio();
  const surfaceTop = height * clamp(0.72 - pitchRatio * 0.16, 0.54, 0.84);
  const surfaceHeight = height - surfaceTop;

  return {
    top: surfaceTop,
    height: surfaceHeight,
    defense: {
      x: width * 0.5,
      y: surfaceTop + surfaceHeight * 0.38,
    },
  };
}

function getPathPoints(width, height) {
  const preset = sourcePresets[state.sourcePreset];
  const surface = getSurfaceMetrics(width, height);
  const pitchShift = -getPitchRatio() * height * 0.18;
  const source = {
    x: width * (0.5 + preset.x * 0.34),
    y: height * (0.34 + preset.y * 0.17) + pitchShift,
  };
  const target = surface.defense;
  const controlA = {
    x: source.x + (source.x - target.x) * 0.16,
    y: source.y - height * (0.07 + Math.abs(preset.x) * 0.02),
  };
  const controlB = {
    x: target.x + (source.x - target.x) * 0.24,
    y: target.y - height * 0.37,
  };

  return {
    source,
    controlA,
    controlB,
    target,
    surface,
  };
}

function getThreatPosition(progress, width, height) {
  const path = getPathPoints(width, height);
  const position = cubicBezier(path.source, path.controlA, path.controlB, path.target, progress);

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
  const lockReady = visualContact && aimDistance <= settings.lockRadius;
  const inCorridor = active && progress >= state.warningStart && progress < 1;
  const pulse = (Math.sin(now * 0.012) + 1) / 2;
  const size = lerp(4, 32, Math.pow(progress, 1.65)) + (inCorridor ? pulse * 4 : 0);

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
    state.fireStatus = "Impact Reached";
    state.fireMessageUntil = performance.now() + 1600;
  }
}

function resetThreat() {
  state.progress = 0;
  state.intercepted = false;
  state.impactReached = false;
  state.fireStatus = "Waiting";
  state.fireMessageUntil = 0;
  state.interceptFeedback = null;
  state.lastFrameTime = performance.now();
}

function togglePause() {
  state.paused = !state.paused;
  state.lastFrameTime = performance.now();
  els.pause.textContent = state.paused ? "Resume" : "Pause";
  els.pause.classList.toggle("is-paused", state.paused);
}

function tryFire() {
  if (state.intercepted) {
    state.fireStatus = "Intercept";
    state.fireMessageUntil = performance.now() + 1200;
    return;
  }

  if (state.impactReached) {
    state.fireStatus = "Impact Reached";
    state.fireMessageUntil = performance.now() + 1200;
    return;
  }

  const info = getThreatInfo(performance.now());

  if (info.lockReady) {
    state.intercepted = true;
    state.fireStatus = "Intercept";
    state.fireMessageUntil = performance.now() + 1800;
    state.interceptFeedback = {
      x: info.x,
      y: info.y,
      startedAt: performance.now(),
    };
    return;
  }

  if (!info.visualContact) {
    state.fireStatus = "No Visual Contact";
  } else {
    state.fireStatus = "Not Locked";
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
  const earthY = height * 0.18 - getPitchRatio() * height * 0.08;
  const earthRadius = Math.min(width, height) * 0.052;
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

function drawDefenseZone(surface, now, inCorridor) {
  const defense = surface.defense;
  const pulse = (Math.sin(now * 0.01) + 1) / 2;
  const ringRadius = 22 + (inCorridor ? pulse * 10 : pulse * 3);

  ctx.save();
  ctx.strokeStyle = inCorridor ? "rgba(255, 156, 108, 0.95)" : "rgba(123, 220, 255, 0.8)";
  ctx.fillStyle = inCorridor ? "rgba(255, 117, 93, 0.12)" : "rgba(123, 220, 255, 0.08)";
  ctx.lineWidth = inCorridor ? 3 : 2;
  ctx.beginPath();
  ctx.ellipse(defense.x, defense.y, ringRadius * 1.75, ringRadius * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(defense.x - 46, defense.y);
  ctx.lineTo(defense.x + 46, defense.y);
  ctx.moveTo(defense.x, defense.y - 14);
  ctx.lineTo(defense.x, defense.y + 14);
  ctx.stroke();

  ctx.fillStyle = "rgba(235, 246, 255, 0.88)";
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Lunar Defense Zone", defense.x, defense.y - 34);
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
    const p = cubicBezier(path.source, path.controlA, path.controlB, path.target, t);
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  if (info.inCorridor) {
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = `rgba(255, 156, 108, ${0.45 + info.pulse * 0.35})`;
    ctx.beginPath();
    for (let i = 0; i <= 24; i += 1) {
      const t = lerp(state.warningStart, settings.finalApproachStart, i / 24);
      const travelT = getTravelProgress(t);
      const p = cubicBezier(path.source, path.controlA, path.controlB, path.target, travelT);
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();

    const target = path.target;
    ctx.fillStyle = `rgba(255, 117, 93, ${0.06 + info.pulse * 0.06})`;
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

  ctx.strokeStyle = `rgba(255, 186, 112, ${info.inCorridor ? 0.32 : 0.18})`;
  ctx.lineWidth = info.inCorridor ? 2.5 : 1.5;
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
  const glowRadius = info.size * (info.inCorridor ? 3.2 : 2.2);
  const glow = ctx.createRadialGradient(info.x, info.y, info.size * 0.2, info.x, info.y, glowRadius);
  glow.addColorStop(0, `rgba(255, 223, 160, ${0.45 + info.pulse * 0.2})`);
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
    ctx.strokeStyle = info.lockReady ? "rgba(156, 255, 141, 0.85)" : `rgba(255, 156, 108, ${0.55 + info.pulse * 0.3})`;
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
}

function drawCrosshair(info) {
  const center = info.crosshair;
  const lockColor = info.lockReady ? "rgba(156, 255, 141, 0.94)" : "rgba(222, 241, 255, 0.72)";

  ctx.save();
  ctx.strokeStyle = lockColor;
  ctx.lineWidth = info.lockReady ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(center.x, center.y, settings.lockRadius, 0, Math.PI * 2);
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

function drawImpactOrIntercept(info, now) {
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

  if (state.impactReached) {
    const target = info.path.target;
    ctx.save();
    ctx.fillStyle = "rgba(255, 117, 93, 0.18)";
    ctx.strokeStyle = "rgba(255, 156, 108, 0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 48 + info.pulse * 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 235, 220, 0.95)";
    ctx.font = "700 16px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Impact", target.x, target.y - 58);
    ctx.restore();
  }
}

function drawWarningHud(info, width, height) {
  if (!info.inCorridor) {
    return;
  }

  const alpha = 0.38 + info.pulse * 0.28;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 117, 93, ${alpha})`;
  ctx.lineWidth = 5;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  ctx.fillStyle = `rgba(255, 117, 93, ${0.07 + info.pulse * 0.04})`;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = `rgba(255, 232, 176, ${0.82 + info.pulse * 0.12})`;
  ctx.font = "700 15px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Impact Warning Corridor", width * 0.5, 34);
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
  drawDefenseZone(info.path.surface, now, info.inCorridor || state.impactReached);
  drawThreat(info, now);
  drawOffscreenIndicator(info, width, height);
  drawImpactOrIntercept(info, now);
  drawCrosshair(info);
  drawWarningHud(info, width, height);
  updatePanels(info);
}

function updatePanels(info) {
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
    ? "Intercept"
    : state.impactReached
      ? "Impact Reached"
      : performance.now() < state.fireMessageUntil
        ? state.fireStatus
        : (info.lockReady ? "Ready" : "Waiting");

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

  els.progress.textContent = `${Math.round(info.progress * 100)}%`;
  els.corridorStatus.textContent = info.inCorridor ? "Active" : "Standby";
  els.sourceOffset.textContent = sourcePresets[state.sourcePreset].label;
  els.pitchValue.textContent = String(state.cameraPitch);
  els.visualContact.textContent = info.visualContact ? "Yes" : "No";
  els.offscreenState.textContent = !info.onScreen && info.active ? "Yes" : "No";
  els.aimDistance.textContent = `${Math.round(info.aimDistance)} px`;
  els.lockRadius.textContent = `${settings.lockRadius} px`;
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

    if (event.key.toLowerCase() === "r" || event.key.toLowerCase() === "n") {
      resetThreat();
    }

    if (event.key.toLowerCase() === "p") {
      togglePause();
    }
  });
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
bindControls();
requestAnimationFrame(animate);
