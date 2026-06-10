"use strict";

// ---------------------------------------------------------------------------
// Living Aegis - 외부 라이브러리 없이 만든 Canvas API 게임 프로토타입
// ---------------------------------------------------------------------------

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  intro: document.querySelector("#introOverlay"),
  gameOver: document.querySelector("#gameOverOverlay"),
  objectiveBanner: document.querySelector("#objectiveBanner"),
  startButton: document.querySelector("#startButton"),
  restartButton: document.querySelector("#restartButton"),
  beginnerMode: document.querySelector("#beginnerMode"),
  restartBeginnerMode: document.querySelector("#restartBeginnerMode"),
  time: document.querySelector("#timeValue"),
  finalTime: document.querySelector("#finalTime"),
  score: document.querySelector("#scoreValue"),
  modeStatus: document.querySelector("#modeStatus"),
  finalScore: document.querySelector("#finalScore"),
  health: document.querySelector("#healthValue"),
  healthBar: document.querySelector("#healthBar"),
  energy: document.querySelector("#energyValue"),
  energyBar: document.querySelector("#energyBar"),
  shieldStatus: document.querySelector("#shieldStatus"),
  pulseStatus: document.querySelector("#pulseStatus"),
  pulseHint: document.querySelector("#pulseHint"),
  objectiveText: document.querySelector("#objectiveText"),
};

// 화면의 실제 CSS 픽셀 크기를 저장합니다. Canvas 내부 해상도는 resizeCanvas에서
// 기기의 픽셀 비율에 맞추지만 게임 계산은 이해하기 쉬운 CSS 픽셀 단위로 진행합니다.
let width = window.innerWidth;
let height = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

const keys = new Set();
const mouse = { x: width / 2, y: height / 2, down: false };

const state = {
  running: false,
  gameOver: false,
  elapsed: 0,
  score: 0,
  spawnTimer: 0,
  scrollX: 0,
  scrollY: 0,
  worldOffsetX: 0,
  worldOffsetY: 0,
  shake: 0,
  flash: 0,
  objectiveReached: false,
  beginnerMode: true,
  maxBeginnerEnemies: 10,
  lastTime: performance.now(),
};

const player = {
  x: width / 2,
  y: height / 2,
  radius: 18,
  angle: 0,
  scrollSpeed: 105,
  viewSpeed: 125,
  health: 100,
  maxHealth: 100,
  energy: 0,
  maxEnergy: 100,
  shootTimer: 0,
  shieldTimer: 0,
  shieldCooldown: 0,
  hitTimer: 0,
};

let stars = [];
let enemies = [];
let enemyBullets = [];
let playerBullets = [];
let particles = [];
let pulses = [];
let audioContext = null;
let audioOutput = null;
const soundCooldowns = {};
const sounds = {
  shot: { type: "triangle", start: 310, end: 105, duration: 0.08, volume: 0.08, cooldown: 0.07 },
  pulse: { type: "sine", start: 150, end: 34, duration: 0.72, volume: 0.2, cooldown: 0.3 },
  shield: { type: "triangle", start: 170, end: 620, duration: 0.25, volume: 0.14, cooldown: 0.18 },
  destroy: { type: "sawtooth", start: 125, end: 38, duration: 0.2, volume: 0.1, cooldown: 0.04 },
};

// 자주 쓰는 작은 수학 함수들입니다.
const random = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function shortestAngleDifference(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

// 별도 음원 파일 없이 Web Audio API의 오실레이터로 짧은 효과음을 만듭니다.
// 브라우저 정책상 오디오는 시작 버튼처럼 사용자가 직접 입력한 뒤 활성화됩니다.
function initializeAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
    audioOutput = audioContext.createGain();
    audioOutput.gain.value = 0.72;
    audioOutput.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {
      // 브라우저가 아직 오디오를 허용하지 않으면 다음 사용자 입력에서 다시 시도합니다.
    });
  }
  return audioContext;
}

function playSound(name) {
  const context = initializeAudio();
  if (!context || !audioOutput) return;

  // 일부 모바일 브라우저는 첫 입력 전 오디오를 정지합니다. 재개된 직후 효과음을 다시 요청합니다.
  if (context.state !== "running") {
    context.resume().then(() => {
      if (context.state === "running") playSound(name);
    }).catch(() => {});
    return;
  }

  const sound = sounds[name];
  const now = context.currentTime;

  if (!sound || now - (soundCooldowns[name] ?? -Infinity) < sound.cooldown) return;
  soundCooldowns[name] = now;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = sound.type;
  oscillator.frequency.setValueAtTime(sound.start, now);
  oscillator.frequency.exponentialRampToValueAtTime(sound.end, now + sound.duration);
  gain.gain.setValueAtTime(sound.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.duration);
  oscillator.connect(gain);
  gain.connect(audioOutput);
  oscillator.start(now);
  oscillator.stop(now + sound.duration);
}

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // 이후 모든 그리기 명령이 CSS 픽셀 단위로 동작하도록 좌표계를 맞춥니다.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  player.x = width / 2;
  player.y = height * 0.56;

  if (stars.length === 0) createStars();
}

function createStars() {
  stars = Array.from({ length: 170 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: random(0.4, 1.8),
    speed: random(8, 36),
    alpha: random(0.2, 0.9),
    layer: random(0.35, 1),
  }));
}

function syncModeSelectors(beginnerMode) {
  ui.beginnerMode.checked = beginnerMode;
  ui.restartBeginnerMode.checked = beginnerMode;
}

function resetGame(beginnerMode = state.beginnerMode) {
  state.running = true;
  state.gameOver = false;
  state.elapsed = 0;
  state.score = 0;
  state.spawnTimer = 3.5;
  state.scrollX = 0;
  state.scrollY = 0;
  state.worldOffsetX = 0;
  state.worldOffsetY = 0;
  state.shake = 0;
  state.flash = 0;
  state.objectiveReached = false;
  state.beginnerMode = beginnerMode;
  syncModeSelectors(beginnerMode);

  Object.assign(player, {
    x: width / 2,
    y: height * 0.56,
    health: player.maxHealth,
    energy: 0,
    shootTimer: 0,
    shieldTimer: 0,
    shieldCooldown: 0,
    hitTimer: 0,
  });

  enemies = [];
  enemyBullets = [];
  playerBullets = [];
  particles = [];
  pulses = [];

  ui.intro.hidden = true;
  ui.gameOver.hidden = true;
  ui.objectiveBanner.hidden = true;
  ui.objectiveText.textContent = "60초까지 생존하십시오";
  state.lastTime = performance.now();
  updateHud();
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  state.scrollX = 0;
  state.scrollY = 0;
  mouse.down = false;
  ui.finalTime.textContent = formatTime(state.elapsed);
  ui.finalScore.textContent = String(state.score).padStart(6, "0");
  syncModeSelectors(state.beginnerMode);
  ui.gameOver.hidden = false;
}

// 화면 바깥 네 방향 중 한 곳에서 적이 생성됩니다.
function spawnEnemy() {
  // 비기너 모드의 제한은 생성 함수 자체에서 강제해 다른 생성 경로가 생겨도 10기를 넘지 않습니다.
  if (state.beginnerMode && enemies.length >= state.maxBeginnerEnemies) return false;

  const margin = 65;
  const side = Math.floor(Math.random() * 4);
  let x;
  let y;

  if (side === 0) {
    x = random(0, width);
    y = -margin;
  } else if (side === 1) {
    x = width + margin;
    y = random(0, height);
  } else if (side === 2) {
    x = random(0, width);
    y = height + margin;
  } else {
    x = -margin;
    y = random(0, height);
  }

  // 초반에는 돌진형 위주로 등장하고, 시간이 흐를수록 사격형 비율과 체력이 증가합니다.
  const shooterChance = clamp(0.18 + state.elapsed / 210, 0.18, 0.58);
  const type = Math.random() < shooterChance ? "shooter" : "charger";
  const health = type === "shooter" ? 3 + Math.floor(state.elapsed / 45) : 2 + Math.floor(state.elapsed / 60);

  enemies.push({
    x,
    y,
    radius: type === "shooter" ? 17 : 15,
    type,
    health,
    maxHealth: health,
    speed: type === "shooter" ? random(32, 47) : random(58, 84),
    fireTimer: random(2.2, 3.4),
    phase: random(0, Math.PI * 2),
    touchTimer: 0,
  });
  return true;
}

function firePlayerBullet() {
  const angle = player.angle + random(-0.025, 0.025);
  const muzzleDistance = 23;

  playerBullets.push({
    x: player.x + Math.cos(angle) * muzzleDistance,
    y: player.y + Math.sin(angle) * muzzleDistance,
    vx: Math.cos(angle) * 650,
    vy: Math.sin(angle) * 650,
    radius: 4,
    life: 0.85,
    damage: 1,
  });

  createBurst(
    player.x + Math.cos(angle) * 25,
    player.y + Math.sin(angle) * 25,
    "#8affd9",
    3,
    40,
  );
  playSound("shot");
}

function fireEnemyBullet(enemy) {
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  const speed = random(112, 145) + Math.min(state.elapsed * 0.35, 42);

  enemyBullets.push({
    x: enemy.x + Math.cos(angle) * enemy.radius,
    y: enemy.y + Math.sin(angle) * enemy.radius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 6,
    life: 7,
  });

  createBurst(enemy.x, enemy.y, "#ff6d91", 5, 45);
}

function activateShield() {
  if (!state.running || player.shieldCooldown > 0) return;

  player.shieldTimer = 0.48;
  player.shieldCooldown = 1.15;
  createBurst(
    player.x + Math.cos(player.angle) * 38,
    player.y + Math.sin(player.angle) * 38,
    "#9fffe1",
    10,
    90,
  );
  playSound("shield");
}

function activatePulse() {
  if (!state.running || player.energy < player.maxEnergy) return;

  player.energy = 0;
  pulses.push({ x: player.x, y: player.y, radius: 20, maxRadius: 430, life: 0.72 });
  state.shake = 11;
  state.flash = 0.18;
  createBurst(player.x, player.y, "#c8fff0", 34, 260);
  playSound("pulse");
}

function damagePlayer(amount) {
  if (player.hitTimer > 0 || !state.running) return;

  player.health = Math.max(0, player.health - amount);
  player.hitTimer = 0.42;
  state.shake = 8;
  state.flash = 0.12;
  createBurst(player.x, player.y, "#ff587c", 18, 190);

  if (player.health <= 0) endGame();
}

function blockBullet(index, bullet) {
  enemyBullets.splice(index, 1);
  player.energy = clamp(player.energy + 13, 0, player.maxEnergy);
  state.score += 25;
  state.shake = Math.max(state.shake, 2);
  createBurst(bullet.x, bullet.y, "#baffeb", 12, 150);
}

function destroyEnemy(index, scoreValue = 100) {
  const enemy = enemies[index];
  createBurst(enemy.x, enemy.y, enemy.type === "shooter" ? "#ff7699" : "#c17bff", 18, 170);
  enemies.splice(index, 1);
  state.score += scoreValue;
  playSound("destroy");
}

// 여러 종류의 효과에 재사용하는 간단한 파티클 생성 함수입니다.
function createBurst(x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = random(0, Math.PI * 2);
    const velocity = random(speed * 0.25, speed);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      size: random(1.2, 4),
      life: random(0.25, 0.75),
      maxLife: 0.75,
      color,
    });
  }
}

function applyWorldScroll(object, dt, factor = 1) {
  object.x += state.scrollX * factor * dt;
  object.y += state.scrollY * factor * dt;
}

function updateWorldMotion(dt) {
  const forwardX = Math.cos(player.angle);
  const forwardY = Math.sin(player.angle);
  const rightX = -forwardY;
  const rightY = forwardX;
  let viewForward = 0;
  let viewRight = 0;

  if (keys.has("KeyW")) viewForward += 1;
  if (keys.has("KeyS")) viewForward -= 1;
  if (keys.has("KeyD")) viewRight += 1;
  if (keys.has("KeyA")) viewRight -= 1;

  const inputLength = Math.hypot(viewForward, viewRight) || 1;
  const viewX = (forwardX * viewForward + rightX * viewRight) / inputLength;
  const viewY = (forwardY * viewForward + rightY * viewRight) / inputLength;

  state.scrollX = -forwardX * player.scrollSpeed - viewX * player.viewSpeed;
  state.scrollY = -forwardY * player.scrollSpeed - viewY * player.viewSpeed;
  state.worldOffsetX += state.scrollX * dt * 0.34;
  state.worldOffsetY += state.scrollY * dt * 0.34;
}

function update(dt) {
  if (!state.running) {
    state.scrollX = 0;
    state.scrollY = 0;
    updateStars(dt);
    updateParticles(dt);
    return;
  }

  state.elapsed += dt;
  state.spawnTimer -= dt;
  state.shake = Math.max(0, state.shake - dt * 24);
  state.flash = Math.max(0, state.flash - dt);
  player.shootTimer -= dt;
  player.shieldTimer = Math.max(0, player.shieldTimer - dt);
  player.shieldCooldown = Math.max(0, player.shieldCooldown - dt);
  player.hitTimer = Math.max(0, player.hitTimer - dt);

  updatePlayer(dt);
  updateWorldMotion(dt);
  updateStars(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updatePulses(dt);
  updateParticles(dt);

  // 게임은 60초 뒤에도 계속되지만 목표 달성 메시지를 한 번 보여 줍니다.
  if (state.elapsed >= 60 && !state.objectiveReached) {
    state.objectiveReached = true;
    ui.objectiveText.textContent = "목표 달성 · 계속 생존 중";
    ui.objectiveBanner.hidden = false;
    window.setTimeout(() => {
      ui.objectiveBanner.hidden = true;
    }, 3900);
  }

  // 첫 몇 초는 여유를 주고, 생성 간격은 이후 서서히 짧아집니다.
  if (state.spawnTimer <= 0) {
    spawnEnemy();
    state.spawnTimer = Math.max(0.58, 2.15 - state.elapsed * 0.012) * random(0.85, 1.18);
  }

  updateHud();
}

function updatePlayer(dt) {
  // 플레이어는 화면 중앙보다 약간 아래에 고정되고 마우스 방향으로만 회전합니다.
  player.x = width / 2;
  player.y = height * 0.56;
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  if ((mouse.down || keys.has("KeyF")) && player.shootTimer <= 0) {
    firePlayerBullet();
    player.shootTimer = 0.145;
  }
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    applyWorldScroll(enemy, dt);
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const dist = distance(enemy, player);
    enemy.phase += dt * 3;
    enemy.touchTimer -= dt;

    if (enemy.type === "charger") {
      enemy.x += Math.cos(angle) * enemy.speed * dt;
      enemy.y += Math.sin(angle) * enemy.speed * dt;
    } else {
      // 사격형 적은 일정 거리를 유지하면서 천천히 옆으로 움직입니다.
      const desiredDistance = 270;
      const direction = dist > desiredDistance + 35 ? 1 : dist < desiredDistance - 35 ? -1 : 0;
      enemy.x += Math.cos(angle) * enemy.speed * direction * dt;
      enemy.y += Math.sin(angle) * enemy.speed * direction * dt;
      enemy.x += Math.cos(angle + Math.PI / 2) * Math.sin(enemy.phase) * 18 * dt;
      enemy.y += Math.sin(angle + Math.PI / 2) * Math.sin(enemy.phase) * 18 * dt;

      enemy.fireTimer -= dt;
      if (enemy.fireTimer <= 0 && dist < 620 && state.elapsed >= 7) {
        fireEnemyBullet(enemy);
        enemy.fireTimer = random(1.75, 2.65) * Math.max(0.68, 1 - state.elapsed / 240);
      }
    }

    if (dist < enemy.radius + player.radius && enemy.touchTimer <= 0) {
      damagePlayer(enemy.type === "charger" ? 14 : 9);
      enemy.touchTimer = 0.8;
      enemy.x -= Math.cos(angle) * 26;
      enemy.y -= Math.sin(angle) * 26;
    }

    if (isOutside(enemy, 560)) enemies.splice(i, 1);
  }
}

function updateBullets(dt) {
  for (let i = playerBullets.length - 1; i >= 0; i -= 1) {
    const bullet = playerBullets[i];
    applyWorldScroll(bullet, dt);
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j -= 1) {
      const enemy = enemies[j];
      if (distance(bullet, enemy) < bullet.radius + enemy.radius) {
        enemy.health -= bullet.damage;
        createBurst(bullet.x, bullet.y, "#80ffdb", 5, 80);
        if (enemy.health <= 0) destroyEnemy(j);
        hit = true;
        break;
      }
    }

    if (hit || bullet.life <= 0 || isOutside(bullet, 30)) playerBullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = enemyBullets[i];
    applyWorldScroll(bullet, dt);
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    const dist = distance(bullet, player);
    if (player.shieldTimer > 0 && dist < 92) {
      const bulletAngle = Math.atan2(bullet.y - player.y, bullet.x - player.x);
      const angleFromShieldCenter = Math.abs(shortestAngleDifference(bulletAngle, player.angle));

      // 방어막은 플레이어가 바라보는 방향의 120도 부채꼴 안에 있는 탄만 막습니다.
      if (angleFromShieldCenter < Math.PI / 3) {
        blockBullet(i, bullet);
        continue;
      }
    }

    if (dist < bullet.radius + player.radius) {
      enemyBullets.splice(i, 1);
      damagePlayer(10);
      continue;
    }

    if (bullet.life <= 0 || isOutside(bullet, 80)) enemyBullets.splice(i, 1);
  }
}

function updatePulses(dt) {
  for (let i = pulses.length - 1; i >= 0; i -= 1) {
    const pulse = pulses[i];
    applyWorldScroll(pulse, dt);
    const previousRadius = pulse.radius;
    pulse.life -= dt;
    pulse.radius += (pulse.maxRadius - pulse.radius) * Math.min(1, dt * 7.5);

    // 파동의 얇은 고리가 지나가는 순간 적과 적 탄을 제거합니다.
    for (let j = enemyBullets.length - 1; j >= 0; j -= 1) {
      const dist = distance(pulse, enemyBullets[j]);
      if (dist <= pulse.radius && dist > previousRadius - 18) {
        createBurst(enemyBullets[j].x, enemyBullets[j].y, "#a6fff0", 5, 100);
        enemyBullets.splice(j, 1);
        state.score += 10;
      }
    }

    for (let j = enemies.length - 1; j >= 0; j -= 1) {
      const dist = distance(pulse, enemies[j]);
      if (dist <= pulse.radius && dist > previousRadius - 28) {
        destroyEnemy(j, 175);
      }
    }

    if (pulse.life <= 0) pulses.splice(i, 1);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    applyWorldScroll(particle, dt);
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.97;
    particle.vy *= 0.97;
    particle.life -= dt;
    if (particle.life <= 0) particles.splice(i, 1);
  }
}

function updateStars(dt) {
  for (const star of stars) {
    star.x += (state.scrollX * star.layer - star.speed * 0.12) * dt;
    star.y += (state.scrollY * star.layer + star.speed * 0.22) * dt;
    if (star.x < -5) star.x = width + 5;
    if (star.x > width + 5) star.x = -5;
    if (star.y < -5) star.y = height + 5;
    if (star.y > height + 5) star.y = -5;
  }
}

function isOutside(object, margin) {
  return object.x < -margin || object.x > width + margin || object.y < -margin || object.y > height + margin;
}

function render() {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  drawBackground();

  const shakeX = state.shake > 0 ? random(-state.shake, state.shake) : 0;
  const shakeY = state.shake > 0 ? random(-state.shake, state.shake) : 0;
  ctx.translate(shakeX, shakeY);

  drawPulses();
  drawPlayerBullets();
  drawEnemyBullets();
  drawEnemies();
  drawPlayer();
  drawParticles();

  ctx.restore();

  if (state.flash > 0) {
    ctx.save();
    ctx.globalAlpha = state.flash * 1.7;
    ctx.fillStyle = player.health <= 0 ? "#ff436d" : "#d9fff5";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

function drawBackground() {
  const gradient = ctx.createRadialGradient(width * 0.48, height * 0.45, 20, width * 0.5, height * 0.5, width * 0.75);
  gradient.addColorStop(0, "#09202a");
  gradient.addColorStop(0.48, "#050e17");
  gradient.addColorStop(1, "#010409");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 희미한 성운 얼룩을 겹쳐 깊이 있는 우주 배경을 만듭니다.
  const nebula = ctx.createRadialGradient(width * 0.78, height * 0.25, 10, width * 0.78, height * 0.25, width * 0.45);
  nebula.addColorStop(0, "rgba(63, 24, 95, 0.22)");
  nebula.addColorStop(0.45, "rgba(14, 76, 78, 0.08)");
  nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, width, height);

  for (const star of stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = star.layer > 0.78 ? "#bffff0" : "#91adc0";
    ctx.beginPath();
    ctx.ellipse(star.x, star.y, star.size * 0.55, star.size * (1 + star.layer * 1.8), -0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 거의 보이지 않는 격자는 플레이 공간의 움직임을 읽기 쉽게 해 줍니다.
  ctx.strokeStyle = "rgba(102, 255, 215, 0.025)";
  ctx.lineWidth = 1;
  const grid = 90;
  const offsetX = ((state.worldOffsetX % grid) + grid) % grid;
  const offsetY = ((state.worldOffsetY % grid) + grid) % grid;
  for (let x = -grid + offsetX; x < width + grid; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = -grid + offsetY; y < height + grid; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  const breath = Math.sin(state.elapsed * 5) * 2;
  const damagedAlpha = player.hitTimer > 0 && Math.floor(player.hitTimer * 18) % 2 === 0 ? 0.35 : 1;
  ctx.globalAlpha = damagedAlpha;

  // 뒤쪽의 촉수 세 갈래를 곡선으로 표현합니다.
  for (let i = -1; i <= 1; i += 1) {
    ctx.strokeStyle = i === 0 ? "rgba(99, 255, 209, 0.58)" : "rgba(69, 179, 159, 0.48)";
    ctx.lineWidth = i === 0 ? 4 : 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, i * 8);
    ctx.bezierCurveTo(-28, i * 14, -28 - breath * 2, i * 20 + Math.sin(state.elapsed * 4 + i) * 8, -48 - breath, i * 25);
    ctx.stroke();
  }

  // 외피는 완벽한 원 대신 비대칭 곡선을 사용해 유기적인 인상을 줍니다.
  ctx.fillStyle = "rgba(35, 118, 105, 0.86)";
  ctx.strokeStyle = "#8affe0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(25 + breath, 0);
  ctx.bezierCurveTo(13, -20, -9, -24 - breath, -20, -9);
  ctx.bezierCurveTo(-25, 4, -11, 23 + breath, 6, 18);
  ctx.bezierCurveTo(15, 14, 18, 7, 25 + breath, 0);
  ctx.fill();
  ctx.stroke();

  // 안쪽 코어에는 두 겹의 빛을 줍니다.
  const coreGlow = ctx.createRadialGradient(2, 0, 1, 2, 0, 15);
  coreGlow.addColorStop(0, "#effff8");
  coreGlow.addColorStop(0.35, "#78ffd6");
  coreGlow.addColorStop(1, "rgba(21, 153, 127, 0)");
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(2, 0, 15 + breath * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(210, 255, 241, 0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(2, 0, 8 + Math.sin(state.elapsed * 7), 0, Math.PI * 2);
  ctx.stroke();

  if (player.shieldTimer > 0) drawShield();
  ctx.restore();
}

function drawShield() {
  const strength = Math.min(1, player.shieldTimer * 5);
  const radius = 70 + Math.sin(state.elapsed * 17) * 3;
  const start = -Math.PI / 3;
  const end = Math.PI / 3;

  ctx.save();
  ctx.globalAlpha = strength;
  const shieldGlow = ctx.createRadialGradient(0, 0, 40, 0, 0, radius + 14);
  shieldGlow.addColorStop(0, "rgba(91, 255, 204, 0)");
  shieldGlow.addColorStop(0.72, "rgba(91, 255, 204, 0.08)");
  shieldGlow.addColorStop(1, "rgba(191, 255, 235, 0.42)");
  ctx.fillStyle = shieldGlow;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius + 12, start, end);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#b7ffe9";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "#64ffd0";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(0, 0, radius, start, end);
  ctx.stroke();

  ctx.strokeStyle = "rgba(106, 255, 210, 0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const arcRadius = radius - 8 + Math.sin(state.elapsed * 13 + i) * 3;
    ctx.beginPath();
    ctx.arc(0, 0, arcRadius, start + i * 0.08, end - i * 0.05);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(Math.atan2(player.y - enemy.y, player.x - enemy.x));

    const pulse = Math.sin(enemy.phase * 2) * 2;
    const color = enemy.type === "shooter" ? "#ff6a91" : "#b77aff";
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = color;
    ctx.fillStyle = enemy.type === "shooter" ? "rgba(112, 25, 54, 0.72)" : "rgba(78, 38, 104, 0.74)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (enemy.type === "shooter") {
      ctx.moveTo(19 + pulse, 0);
      ctx.quadraticCurveTo(4, -20, -14, -10);
      ctx.quadraticCurveTo(-5, 0, -14, 10);
      ctx.quadraticCurveTo(4, 20, 19 + pulse, 0);
    } else {
      ctx.moveTo(21 + pulse, 0);
      ctx.lineTo(-10, -14);
      ctx.quadraticCurveTo(-20, 0, -10, 14);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffe0e9";
    ctx.beginPath();
    ctx.arc(3, 0, 4 + pulse * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 피해를 받은 적의 남은 체력을 작은 선으로 표시합니다.
    if (enemy.health < enemy.maxHealth) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(-15, -25, 30, 2);
      ctx.fillStyle = color;
      ctx.fillRect(-15, -25, 30 * (enemy.health / enemy.maxHealth), 2);
    }
    ctx.restore();
  }
}

function drawPlayerBullets() {
  ctx.save();
  ctx.fillStyle = "#d8fff3";
  ctx.shadowColor = "#5dffd1";
  ctx.shadowBlur = 14;
  for (const bullet of playerBullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemyBullets() {
  ctx.save();
  for (const bullet of enemyBullets) {
    const trailAngle = Math.atan2(bullet.vy, bullet.vx);
    ctx.strokeStyle = "rgba(255, 71, 117, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bullet.x, bullet.y);
    ctx.lineTo(bullet.x - Math.cos(trailAngle) * 16, bullet.y - Math.sin(trailAngle) * 16);
    ctx.stroke();

    ctx.fillStyle = "#ff7698";
    ctx.shadowColor = "#ff3469";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius + Math.sin(state.elapsed * 12) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPulses() {
  for (const pulse of pulses) {
    const alpha = clamp(pulse.life / 0.72, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#cafff1";
    ctx.lineWidth = 5 + alpha * 9;
    ctx.shadowColor = "#5dffd1";
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(109, 222, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.radius * 0.91, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParticles() {
  ctx.save();
  for (const particle of particles) {
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function updateHud() {
  const healthRatio = player.health / player.maxHealth;
  const energyRatio = player.energy / player.maxEnergy;
  ui.time.textContent = formatTime(state.elapsed);
  ui.score.textContent = String(state.score).padStart(6, "0");
  ui.modeStatus.textContent = state.beginnerMode
    ? `BEGINNER · HOSTILES ${enemies.length}/${state.maxBeginnerEnemies}`
    : `STANDARD · HOSTILES ${enemies.length}`;
  ui.health.textContent = String(Math.ceil(player.health));
  ui.healthBar.style.transform = `scaleX(${healthRatio})`;
  ui.energy.textContent = `${Math.floor(player.energy)}%`;
  ui.energyBar.style.transform = `scaleX(${energyRatio})`;

  if (player.shieldCooldown <= 0) {
    ui.shieldStatus.textContent = "READY";
  } else {
    ui.shieldStatus.textContent = `${player.shieldCooldown.toFixed(1)}s`;
  }

  const pulseReady = player.energy >= player.maxEnergy;
  ui.pulseStatus.textContent = pulseReady ? "READY · PRESS E" : "CHARGING";
  ui.pulseHint.classList.toggle("ready", pulseReady);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${remaining.toFixed(1).padStart(4, "0")}`;
}

function gameLoop(now) {
  // 탭을 오래 떠났다가 돌아와도 한 프레임에 게임이 폭주하지 않도록 dt를 제한합니다.
  const dt = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Space") {
    event.preventDefault();
  }
  if (event.code === "KeyF" && !event.repeat && state.running && player.shootTimer <= 0) {
    firePlayerBullet();
    player.shootTimer = 0.145;
  }
  if (event.code === "Space" && !event.repeat) activateShield();
  if (event.code === "KeyE" && !event.repeat) activatePulse();
  if (event.code === "Enter" && state.gameOver) {
    initializeAudio();
    resetGame(ui.restartBeginnerMode.checked);
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("blur", () => {
  keys.clear();
  mouse.down = false;
});

canvas.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    mouse.down = true;

    // 아주 짧게 클릭해도 최소 한 발은 즉시 발사되도록 처리합니다.
    if (state.running && player.shootTimer <= 0) {
      firePlayerBullet();
      player.shootTimer = 0.145;
    }
  }
  if (event.button === 2) activatePulse();
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) mouse.down = false;
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());
ui.startButton.addEventListener("click", () => {
  initializeAudio();
  resetGame(ui.beginnerMode.checked);
});
ui.restartButton.addEventListener("click", () => {
  initializeAudio();
  resetGame(ui.restartBeginnerMode.checked);
});
ui.beginnerMode.addEventListener("change", () => {
  ui.restartBeginnerMode.checked = ui.beginnerMode.checked;
});
ui.restartBeginnerMode.addEventListener("change", () => {
  ui.beginnerMode.checked = ui.restartBeginnerMode.checked;
});

resizeCanvas();
updateHud();
requestAnimationFrame(gameLoop);
