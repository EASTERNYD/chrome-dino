/**
 * game.js — Chrome Dino 游戏核心（Sprite Sheet 方案）
 *
 * 所有视觉元素通过 drawImage() 从 assets/sprite01.png 截帧渲染。
 * 帧动画使用 200ms 时间间隔控速。
 */
/* ================================================================
 *  游戏状态枚举
 * ================================================================ */
const GameState = {
  IDLE:      'idle',
  PLAYING:   'playing',
  GAME_OVER: 'game_over',
};

/* ================================================================
 *  全局变量
 * ================================================================ */
let state = GameState.IDLE;
let config = GAME_CONFIG;
let canvas, ctx;
let spriteImg = null;          // sprite01.png Image 对象
let animFrameId = null;
let lastTimestamp = 0;
let audioCtx = null;

// 恐龙
let dino = {};

// 帧动画
let animFrame = 0;             // 当前动画帧索引 (0 or 1)
let lastAnimFlip = 0;          // 上次切换帧的时间戳

// 游戏数据
let score = 0;
let speed = 0;
let groundOffset = 0;
let lastObstacleTime = 0;
let milestoneLast = 0;
let frameCount = 0;

// 动态实体
let obstacles = [];
let clouds = [];

// 颜色
let colors = {};

/* ================================================================
 *  Canvas 响应式缩放
 * ================================================================ */
function resizeCanvas() {
  const isMobile = window.innerWidth < 900;
  const isGamePage = document.getElementById('page-game')?.classList.contains('active');
  const isLandscape = window.innerWidth > window.innerHeight;

  // 手机 + 横屏 + 游戏页 → 全屏撑满视口
  const fullscreen = isMobile && isGamePage && isLandscape;

  const maxWidth  = fullscreen ? window.innerWidth  : Math.min(window.innerWidth - 32, 800);
  const maxHeight = fullscreen ? window.innerHeight : Math.min(window.innerHeight - 160, 400);

  const scale = Math.min(maxWidth / config.canvasWidth, maxHeight / config.canvasHeight);
  canvas.style.width  = `${config.canvasWidth * scale}px`;
  canvas.style.height = `${config.canvasHeight * scale}px`;
}

/* ================================================================
 *  Sprite 加载
 * ================================================================ */
function loadSprite() {
  return new Promise((resolve, reject) => {
    spriteImg = new Image();
    spriteImg.onload = () => resolve();
    spriteImg.onerror = () => reject(new Error('sprite01.png 加载失败'));
    spriteImg.src = 'assets/sprite01.png';
  });
}

/* ================================================================
 *  绘制函数（全部通过 drawImage 截帧）
 * ================================================================ */

/** 恐龙 */
function drawDino() {
  const { x, y, width, height, status } = dino;
  let frame;

  if (status === 'duck') {
    frame = SPRITE.dinoDuck[animFrame];
    ctx.drawImage(spriteImg, frame.sx, frame.sy, frame.sw, frame.sh,
      x, y + height - config.dinoDuckH, width, config.dinoDuckH);
  } else if (status === 'dead') {
    frame = SPRITE.dinoDead;
    ctx.drawImage(spriteImg, frame.sx, frame.sy, frame.sw, frame.sh,
      x, y, width, height);
  } else {
    // stand | run | jump 都用跑步帧（跳跃时腿收起，看起来也合理）
    frame = SPRITE.dinoRun[animFrame];
    ctx.drawImage(spriteImg, frame.sx, frame.sy, frame.sw, frame.sh,
      x, y, width, height);
  }
}

/** 地面 */
function drawGround() {
  const groundY = config.canvasHeight * config.groundY;
  const g = SPRITE.ground;

  const offset = Math.floor(groundOffset) % g.sw;
  const displayH = config.groundDisplayH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, groundY, config.canvasWidth, displayH);
  ctx.clip();

  ctx.drawImage(spriteImg, g.sx, g.sy, g.sw, g.sh,
    -offset, groundY, g.sw, displayH);
  ctx.drawImage(spriteImg, g.sx, g.sy, g.sw, g.sh,
    -offset + g.sw, groundY, g.sw, displayH);

  ctx.restore();
}

/** 仙人掌 */
function drawCactus(obs) {
  const type = obs.cactusType;
  const src = SPRITE.cactus[type];
  ctx.drawImage(spriteImg, src.sx, src.sy, src.sw, src.sh,
    obs.x, obs.y, obs.width, obs.height);
}

/** 翼龙 */
function drawPterodactyl(obs) {
  const src = SPRITE.pterodactyl[animFrame];
  ctx.drawImage(spriteImg, src.sx, src.sy, src.sw, src.sh,
    obs.x, obs.y, obs.width, obs.height);
}

/** 云朵 */
function drawClouds() {
  const src = SPRITE.cloud;
  for (const cloud of clouds) {
    ctx.drawImage(spriteImg, src.sx, src.sy, src.sw, src.sh,
      cloud.x, cloud.y, cloud.width, cloud.height);
  }
}

/** 得分数字（右上角） */
function drawScore() {
  const scoreStr = String(Math.floor(score)).padStart(5, '0');
  const digitH = 24;  // 数字显示高
  const digitW = 14;  // 数字显示宽
  const startX = config.canvasWidth - 20 - scoreStr.length * digitW;

  // "HI" 标识
  const hi = SPRITE.HI;
  ctx.drawImage(spriteImg, hi[0].sx, hi[0].sy, hi[0].sw, hi[0].sh,
    startX - 36, 10, digitW, digitH);
  ctx.drawImage(spriteImg, hi[1].sx, hi[1].sy, hi[1].sw, hi[1].sh,
    startX - 18, 10, digitW, digitH);

  // 数字
  for (let i = 0; i < scoreStr.length; i++) {
    const d = SPRITE.digits[parseInt(scoreStr[i])];
    ctx.drawImage(spriteImg, d.sx, d.sy, d.sw, d.sh,
      startX + i * digitW, 10, digitW, digitH);
  }
}

/** Game Over 遮罩 */
function drawGameOverOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

  ctx.fillStyle = '#535353';
  ctx.font = 'bold 36px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('G A M E   O V E R', config.canvasWidth / 2, config.canvasHeight / 2 - 20);

  ctx.fillStyle = '#757575';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText(`得分：${Math.floor(score)}`, config.canvasWidth / 2, config.canvasHeight / 2 + 25);

  ctx.fillStyle = '#757575';
  ctx.font = '14px sans-serif';
  ctx.fillText('按空格键或点击屏幕重新开始', config.canvasWidth / 2, config.canvasHeight / 2 + 55);
}

/** IDLE 开始提示 */
function drawIdleHint() {
  const cx = config.canvasWidth / 2;
  const cy = config.canvasHeight / 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.fillRect(cx - 180, cy - 22, 360, 44);
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('按空格键或点击屏幕开始游戏', cx, cy);
  ctx.textBaseline = 'alphabetic';
}

/* ================================================================
 *  碰撞检测（AABB）
 * ================================================================ */
function checkCollision() {
  // 恐龙碰撞箱：各边缩进不同
  let dinoBox;
  if (dino.status === 'duck') {
    dinoBox = {
      x: dino.x + 6,
      y: dino.y + (dino.height - config.dinoDuckH) + 8,
      w: config.dinoDuckW - 12,
      h: config.dinoDuckH - 14,
    };
  } else {
    dinoBox = {
      x: dino.x + 6,
      y: dino.y + 8,
      w: dino.width - 12,
      h: dino.height - 30,     // 底部抬升，腿部不参与碰撞
    };
  }

  for (const obs of obstacles) {
    const oBox = {
      x: obs.x + 5,
      y: obs.y + 8,
      w: obs.width - 10,
      h: obs.height - 12,
    };
    if (
      dinoBox.x < oBox.x + oBox.w &&
      dinoBox.x + dinoBox.w > oBox.x &&
      dinoBox.y < oBox.y + oBox.h &&
      dinoBox.y + dinoBox.h > oBox.y
    ) {
      return true;
    }
  }
  return false;
}

/* ================================================================
 *  音效系统
 * ================================================================ */
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playJumpSound() {
  try {
    const ac = getAudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.15);
  } catch { /* 静默 */ }
}

function playCollisionSound() {
  try {
    const ac = getAudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.3);
  } catch { /* 静默 */ }
}

function playMilestoneSound() {
  try {
    const ac = getAudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ac.currentTime);
    gain.gain.setValueAtTime(0.2, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.08);
  } catch { /* 静默 */ }
}

/* ================================================================
 *  障碍物生成
 * ================================================================ */
function spawnObstacle() {
  const now = performance.now();
  lastObstacleTime = now;
  const groundY = config.canvasHeight * config.groundY;

  // 翼龙概率随分数上升（10% → 30%）
  const pteroChance = Math.min(0.1 + score * 0.0002, 0.3);

  if (Math.random() < pteroChance) {
    const isHigh = Math.random() < 0.5;
    const py = isHigh
      ? config.canvasHeight * config.pterodactylHighY
      : groundY - config.pterodactylH - Math.random() * 20;
    obstacles.push({
      type: 'pterodactyl',
      x: config.canvasWidth + 20,
      y: py,
      width: config.pterodactylW,
      height: config.pterodactylH,
    });
  } else {
    // 加权随机：单棵70% / 双棵20% / 三棵10%
    const r = Math.random();
    let typeIdx;
    if (r < 0.70) {
      typeIdx = Math.floor(Math.random() * 2);     // 类型 0~1（单棵）
    } else if (r < 0.90) {
      typeIdx = 2 + Math.floor(Math.random() * 2); // 类型 2~3（双棵）
    } else {
      typeIdx = 4;                                   // 类型 4（三棵）
    }
    const src = SPRITE.cactus[typeIdx];
    const displayH = CACTUS_DISPLAY_H[typeIdx];
    const scale = displayH / src.sh;                    // 等比缩放
    const displayW = Math.round(src.sw * scale);
    obstacles.push({
      type: 'cactus',
      cactusType: typeIdx,
      x: config.canvasWidth + 20,
      y: groundY - displayH + 19,                     // 底部沉入地面 19px（匹配 sprite 底部留白）
      width: displayW,
      height: displayH,
    });
  }
}

/* ================================================================
 *  重置游戏
 * ================================================================ */
function resetGame() {
  const groundY = config.canvasHeight * config.groundY;

  dino = {
    x: config.dinoX,
    y: groundY - config.dinoRunH + 14,
    width: config.dinoRunW,
    height: config.dinoRunH,
    status: 'stand',
    jumpPhase: null,        // null | 'rise' | 'fall'
    jumpStartY: 0,
    jumpStartTime: 0,
  };

  obstacles = [];
  clouds = [];
  score = 0;
  speed = config.initialSpeed;
  groundOffset = 0;
  frameCount = 0;
  animFrame = 0;
  lastAnimFlip = 0;
  milestoneLast = 0;
  lastObstacleTime = 0;

  // 预生成云朵
  for (let i = 0; i < config.cloudMaxCount; i++) {
    clouds.push({
      x: Math.random() * config.canvasWidth,
      y: config.cloudMinY + Math.random() * (config.cloudMaxY - config.cloudMinY),
      width: config.cloudW,
      height: config.cloudH,
      speed: config.cloudMinSpeed + Math.random() * (config.cloudMaxSpeed - config.cloudMinSpeed),
    });
  }

  updateColors();
}

/* ================================================================
 *  颜色
 * ================================================================ */
function updateColors() {
  const isNight = document.body.classList.contains('night-mode');
  const palette = isNight ? config.nightColors : config.dayColors;
  colors = { text: palette.text };
}

/* ================================================================
 *  主循环
 * ================================================================ */
function gameLoop(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  let dt = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  if (dt > 100) dt = 16;

  // 帧动画控速（200ms 切换）
  if (timestamp - lastAnimFlip > config.pageFlipInterval) {
    animFrame = (animFrame + 1) % 2;
    lastAnimFlip = timestamp;
  }

  update(dt);
  render();
  animFrameId = requestAnimationFrame(gameLoop);
}

function update(dt) {
  const groundY = config.canvasHeight * config.groundY;
  updateColors();

  // 速度归一化：以 60fps (≈16.67ms) 为基准，dt 越大补偿越多
  const speedNorm = dt / 16.67;

  // 云朵（始终移动）
  for (const cloud of clouds) {
    cloud.x -= cloud.speed * speedNorm;
    if (cloud.x + cloud.width < 0) {
      cloud.x = config.canvasWidth + 20;
      cloud.y = config.cloudMinY + Math.random() * (config.cloudMaxY - config.cloudMinY);
    }
  }

  if (state === GameState.IDLE) {
    dino.status = 'stand';
    dino.y = groundY - config.dinoRunH + 14;
    return;
  }

  if (state === GameState.GAME_OVER) return;

  // ---- PLAYING ----
  speed = Math.min(config.initialSpeed + score * config.speedIncrement, config.maxSpeed);
  groundOffset += speed * speedNorm;

  // 跳跃逻辑（计时器缓动）
  if (dino.jumpPhase) {
    const now = performance.now();
    const elapsed = now - dino.jumpStartTime;

    if (dino.jumpPhase === 'rise') {
      const t = Math.min(elapsed / config.riseDuration, 1);
      const eased = t * (2 - t);
      dino.y = dino.jumpStartY - config.jumpHeight * eased;
      if (t >= 1) {
        dino.jumpPhase = 'fall';
        dino.jumpStartTime = now;
      }
    } else {
      const t = Math.min(elapsed / config.fallDuration, 1);
      const eased = t * t;
      const groundY = config.canvasHeight * config.groundY;
      const landY = groundY - dino.height + 14;
      dino.y = dino.jumpStartY - config.jumpHeight + config.jumpHeight * eased;
      if (t >= 1) {
        dino.y = landY;
        dino.jumpPhase = null;
        dino.status = 'run';
      }
    }
  }

  dino.status = dino.jumpPhase ? 'jump' : (dino.status === 'duck' ? 'duck' : 'run');

  // 障碍物移动
  for (const obs of obstacles) obs.x -= speed * speedNorm;
  obstacles = obstacles.filter(obs => obs.x + obs.width > -80);

  // 生成新障碍物
  const now = performance.now();
  const intervalRange = config.obstacleMaxInterval - config.obstacleMinInterval;
  const currentMin = config.obstacleMaxInterval - intervalRange * Math.min(score / 500, 1);
  const nextInterval = currentMin + Math.random() * (config.obstacleMaxInterval - currentMin);

  if (obstacles.length === 0 && lastObstacleTime === 0) {
    spawnObstacle();
  } else if (now - lastObstacleTime > nextInterval) {
    spawnObstacle();
  }

  // 计分 + 里程碑音效
  score += speed * speedNorm / config.scoreDistance;
  const curMilestone = Math.floor(score / config.milestoneSoundInterval);
  if (curMilestone > milestoneLast) {
    milestoneLast = curMilestone;
    playMilestoneSound();
  }

  // 碰撞
  if (checkCollision()) {
    state = GameState.GAME_OVER;
    dino.status = 'dead';
    playCollisionSound();
    addScore(Math.floor(score));
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  frameCount++;
}

function render() {
  const isNight = document.body.classList.contains('night-mode');
  const bg = isNight ? config.nightColors.background : config.dayColors.background;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

  drawClouds();
  drawGround();
  for (const obs of obstacles) {
    if (obs.type === 'cactus') drawCactus(obs);
    else drawPterodactyl(obs);
  }
  drawDino();
  drawScore();

  if (state === GameState.IDLE) drawIdleHint();
  else if (state === GameState.GAME_OVER) drawGameOverOverlay();
}

/* ================================================================
 *  输入
 * ================================================================ */
function onInputJump() {
  if (state === GameState.IDLE) {
    resetGame();
    state = GameState.PLAYING;
    dino.status = 'run';
    lastTimestamp = 0;
    lastAnimFlip = performance.now();
    if (!animFrameId) animFrameId = requestAnimationFrame(gameLoop);
    return;
  }
  if (state === GameState.GAME_OVER) {
    resetGame();
    state = GameState.PLAYING;
    dino.status = 'run';
    lastTimestamp = 0;
    lastAnimFlip = performance.now();
    return;
  }
  if (state === GameState.PLAYING && !dino.jumpPhase) {
    dino.jumpPhase = 'rise';
    dino.jumpStartY = dino.y;
    dino.jumpStartTime = performance.now();
    dino.status = 'jump';
    playJumpSound();
  }
}

function onInputDuck(isDucking) {
  if (state !== GameState.PLAYING) return;
  if (isDucking && !dino.jumpPhase) {
    dino.status = 'duck';
  } else if (dino.status === 'duck' && !isDucking) {
    dino.status = dino.jumpPhase ? 'jump' : 'run';
  }
}

function setupInput() {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      onInputJump();
    }
    if (e.code === 'ArrowDown') { e.preventDefault(); onInputDuck(true); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') { e.preventDefault(); onInputDuck(false); }
  });

  canvas.addEventListener('click', (e) => { e.preventDefault(); onInputJump(); });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onInputJump(); });

  let touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches[0].clientY - touchStartY > 30) onInputDuck(true);
    else onInputDuck(false);
  }, { passive: true });
  canvas.addEventListener('touchend', () => onInputDuck(false));

  window.addEventListener('resize', resizeCanvas);
}

/* ================================================================
 *  启动/停止
 * ================================================================ */
function startGame() {
  canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  canvas.width = config.canvasWidth;
  canvas.height = config.canvasHeight;
  setupInput();
  resetGame();
  resizeCanvas();
  if (!animFrameId) {
    lastTimestamp = 0;
    lastAnimFlip = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
  }
}

function stopGame() {
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (state === GameState.PLAYING) { state = GameState.IDLE; resetGame(); }
}

/* ================================================================
 *  初始化：加载 sprite → 启动游戏
 * ================================================================ */
(async function init() {
  config = await loadConfig();

  try {
    await loadSprite();
  } catch (err) {
    console.error('Sprite 加载失败:', err);
    // sprite 加载失败仍可启动（显示空白画布，不崩溃）
  }

  canvas = document.getElementById('game-canvas');
  if (canvas) {
    ctx = canvas.getContext('2d');
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    setupInput();
    resetGame();
    resizeCanvas();
    lastAnimFlip = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  document.getElementById('btn-clear-scores')?.addEventListener('click', () => {
    if (confirm('确定要清空所有成绩记录吗？')) { clearScores(); renderScoreTable(); }
  });
  document.getElementById('theme-toggle')?.addEventListener('click', updateColors);
})();