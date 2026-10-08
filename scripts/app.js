/**
 * app.js — SPA 路由、表单校验、LocalStorage 排行榜管理
 */

/* ================================================================
 *  页面路由（SPA 三视图切换）
 * ================================================================ */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('active');

  // 导航高亮
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  // 页面切换时的游戏生命周期管理
  if (pageId === 'game') {
    document.body.classList.add('page-game-active');
    screen.orientation?.lock?.('landscape').catch(() => {});
    if (typeof startGame === 'function') startGame();
  } else {
    document.body.classList.remove('page-game-active');
    screen.orientation?.unlock?.();
    if (typeof stopGame === 'function') stopGame();
  }

  // 进入排行榜页时刷新数据
  if (pageId === 'score') {
    renderScoreTable();
  }

  // 进入首页时刷新最高分
  if (pageId === 'home') {
    updateHomeBestScore();
  }
}

/* ================================================================
 *  LocalStorage 排行榜管理
 *  Key: 'dino_scores'
 *  格式: [{ score, date }, ...]  按 score 降序，最多 10 条
 * ================================================================ */
const SCORES_KEY = 'dino_scores';
const MAX_SCORES = 10;

function getScores() {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScores(scores) {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
}

function addScore(score) {
  const scores = getScores();
  scores.push({
    score: score,
    date: new Date().toISOString(),
  });
  // 降序排列，保留前 N 条
  scores.sort((a, b) => b.score - a.score);
  saveScores(scores.slice(0, MAX_SCORES));
}

function getBestScore() {
  const scores = getScores();
  return scores.length > 0 ? scores[0].score : 0;
}

function clearScores() {
  localStorage.removeItem(SCORES_KEY);
}

/* ================================================================
 *  排行榜表格渲染
 * ================================================================ */
function renderScoreTable() {
  const tbody = document.getElementById('score-tbody');
  const emptyMsg = document.getElementById('score-empty');
  if (!tbody) return;

  const scores = getScores();

  if (scores.length === 0) {
    tbody.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  tbody.innerHTML = scores.map((s, i) => {
    const date = new Date(s.date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
    return `<tr>
      <td>${rankIcon}</td>
      <td>${s.score}</td>
      <td>${dateStr}</td>
    </tr>`;
  }).join('');
}

/* ================================================================
 *  首页最高分更新
 * ================================================================ */
function updateHomeBestScore() {
  const el = document.getElementById('home-best-score');
  if (el) {
    el.textContent = getBestScore();
  }
}

/* ================================================================
 *  表单校验（反馈/留言表单）
 * ================================================================ */
function initFeedbackForm() {
  const form = document.getElementById('feedback-form');
  if (!form) return;

  const nameInput = document.getElementById('feedback-name');
  const emailInput = document.getElementById('feedback-email');
  const messageInput = document.getElementById('feedback-message');
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const messageError = document.getElementById('message-error');
  const successMsg = document.getElementById('feedback-success');

  // 邮箱正则
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;

    // 姓名校验（必填 + 最少 2 字符）
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      nameError.textContent = '请输入至少 2 个字符的姓名';
      nameError.style.display = 'block';
      valid = false;
    } else {
      nameError.style.display = 'none';
    }

    // 邮箱校验（必填 + 格式）
    if (!emailInput.value.trim()) {
      emailError.textContent = '请输入邮箱地址';
      emailError.style.display = 'block';
      valid = false;
    } else if (!emailPattern.test(emailInput.value.trim())) {
      emailError.textContent = '请输入有效的邮箱地址';
      emailError.style.display = 'block';
      valid = false;
    } else {
      emailError.style.display = 'none';
    }

    // 留言校验（必填 + 最少 5 字符）
    if (!messageInput.value.trim() || messageInput.value.trim().length < 5) {
      messageError.textContent = '请输入至少 5 个字符的留言';
      messageError.style.display = 'block';
      valid = false;
    } else {
      messageError.style.display = 'none';
    }

    if (valid) {
      successMsg.style.display = 'block';
      form.reset();
      setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
    } else {
      successMsg.style.display = 'none';
    }
  });
}

/* ================================================================
 *  昼夜模式切换
 * ================================================================ */
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const saved = localStorage.getItem('dino_theme');
  if (saved === 'night') {
    document.body.classList.add('night-mode');
    btn.textContent = '☀️';
  }

  btn.addEventListener('click', () => {
    const isNight = document.body.classList.toggle('night-mode');
    btn.textContent = isNight ? '☀️' : '🌙';
    localStorage.setItem('dino_theme', isNight ? 'night' : 'day');
  });
}

/* ================================================================
 *  配置加载（Fetch 兜底方案）
 * ================================================================ */
async function loadConfig() {
  // file:// 协议直接返回默认配置
  if (location.protocol === 'file:') return GAME_CONFIG;

  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // 深度合并：JSON 覆盖 GAME_CONFIG 中的同名字段
    return { ...GAME_CONFIG, ...json };
  } catch {
    console.warn('config.json 加载失败，使用默认配置');
    return GAME_CONFIG;
  }
}

/* ================================================================
 *  初始化入口
 * ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // 导航点击事件
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(link.dataset.page);
    });
  });

  // 首页"开始游戏"按钮
  const startBtn = document.getElementById('btn-start-game');
  if (startBtn) {
    startBtn.addEventListener('click', () => showPage('game'));
  }

  // 初始化表单
  initFeedbackForm();

  // 初始化主题切换
  initThemeToggle();

  // 首页最高分
  updateHomeBestScore();

  // 初始显示首页
  showPage('home');
});