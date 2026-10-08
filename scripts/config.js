/**
 * 游戏配置常量（主方案，无需网络请求）
 * Sprite Sheet 方案：所有视觉元素来自 assets/sprite01.png
 */
const GAME_CONFIG = {
  // 画布
  canvasWidth: 800,
  canvasHeight: 400,

  // 地面（占画布高度的比例，从顶部算起）
  groundY: 0.78,
  groundDisplayH: 24,        // 地面纹理显示高度（与 sprite 源一致）

  // 恐龙（sprite 显示尺寸）
  dinoX: 80,
  dinoRunW: 44,              // 跑步帧显示宽（源 80）
  dinoRunH: 53,              // 跑步帧显示高（源 96）
  dinoDuckW: 59,             // 低头帧显示宽（源 110）
  dinoDuckH: 29,             // 低头帧显示高（源 54）
  dinoDeathW: 44,            // 死亡帧显示宽
  dinoDeathH: 53,            // 死亡帧显示高
  dinoJumpVelocity: -9,
  gravity: 0.25,
  // 跳跃缓动参数（计时器模式，替代纯物理）
  riseDuration: 350,        // 上升阶段（ms）
  fallDuration: 280,        // 下落阶段（ms）
  jumpHeight: 130,          // 跳跃高度（px）

  // 障碍物
  obstacleMinInterval: 1500,
  obstacleMaxInterval: 3000,

  // 翼龙（sprite 显示尺寸）
  pterodactylW: 42,          // 源 88
  pterodactylH: 38,          // 源 80
  pterodactylHighY: 0.36,   // 对齐恐龙跳跃最高点（143px）
  pterodactylLowY: 0.65,

  // 速度
  initialSpeed: 2.0,
  maxSpeed: 10,
  speedIncrement: 0.0005,

  // 云朵
  cloudW: 50,                // sprite 显示宽（源 100）
  cloudH: 16,                // sprite 显示高（源 32）
  cloudMinY: 40,
  cloudMaxY: 110,
  cloudMinSpeed: 0.5,
  cloudMaxSpeed: 2,
  cloudMaxCount: 4,

  // 计分
  scoreDistance: 100,
  milestoneSoundInterval: 100,

  // 帧动画间隔（毫秒）
  pageFlipInterval: 200,

  // 昼夜模式颜色
  dayColors: {
    background: '#f7f7f7',
    text: '#535353',
  },
  nightColors: {
    background: '#1a1a2e',
    text: '#e0e0e0',
  },
};

/* ================================================================
 *  Sprite 帧坐标表（基于 assets/sprite01.png）
 *  格式: { sx, sy, sw, sh }
 * ================================================================ */
const SPRITE = {
  // 恐龙跑步两帧（源 80×96）
  dinoRun: [
    { sx: 1858, sy: 0, sw: 80, sh: 96 },
    { sx: 1945, sy: 0, sw: 80, sh: 96 },
  ],
  // 恐龙死亡（源 80×96）
  dinoDead: { sx: 2033, sy: 0, sw: 80, sh: 96 },
  // 恐龙低头两帧（源 110×54）
  dinoDuck: [
    { sx: 2206, sy: 38, sw: 110, sh: 54 },
    { sx: 2325, sy: 38, sw: 110, sh: 54 },
  ],
  // 翼龙两帧（源 88×80）
  pterodactyl: [
    { sx: 264, sy: 0, sw: 88, sh: 80 },
    { sx: 356, sy: 0, sw: 88, sh: 80 },
  ],
  // 仙人掌组合（5 种，基于 GitHub 项目坐标）
  cactus: [
    { sx: 654, sy: 0, sw: 46, sh: 95 },   // 单棵-1
    { sx: 754, sy: 0, sw: 46, sh: 95 },   // 单棵-2
    { sx: 754, sy: 0, sw: 94, sh: 95 },   // 双棵-1
    { sx: 654, sy: 0, sw: 93, sh: 95 },   // 双棵-2
    { sx: 851, sy: 0, sw: 98, sh: 95 },   // 三棵
  ],
  // 云朵（源 100×32）
  cloud: { sx: 163, sy: 0, sw: 100, sh: 32 },
  // 地面纹理（源 2400×24）
  ground: { sx: 12, sy: 100, sw: 2400, sh: 24 },
  // 数字 0-9（源 18×24，等宽排列）
  digits: [
    { sx: 1293, sy: 0, sw: 18, sh: 24 },
    { sx: 1313, sy: 0, sw: 18, sh: 24 },
    { sx: 1333, sy: 0, sw: 18, sh: 24 },
    { sx: 1353, sy: 0, sw: 18, sh: 24 },
    { sx: 1373, sy: 0, sw: 18, sh: 24 },
    { sx: 1393, sy: 0, sw: 18, sh: 24 },
    { sx: 1413, sy: 0, sw: 18, sh: 24 },
    { sx: 1433, sy: 0, sw: 18, sh: 24 },
    { sx: 1453, sy: 0, sw: 18, sh: 24 },
    { sx: 1473, sy: 0, sw: 18, sh: 24 },
  ],
  // "HI" 标识两字母
  HI: [
    { sx: 1494, sy: 0, sw: 18, sh: 24 },
    { sx: 1515, sy: 0, sw: 18, sh: 24 },
  ],
};

/* ================================================================
 *  仙人掌目标显示高度（像素），实际宽高按 sprite 比例缩放
 *  索引对应 SPRITE.cactus
 * ================================================================ */
const CACTUS_DISPLAY_H = [57, 57, 57, 57, 57];