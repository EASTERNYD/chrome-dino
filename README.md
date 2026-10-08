# 🦖 Chrome Dino Runner

仿 Chrome 离线小恐龙游戏（T-Rex Runner），原生 HTML5 / CSS3 / JavaScript 实现。

## 功能

- Sprite Sheet 精灵图帧动画（`drawImage()` 截帧，200ms 切换）
- 恐龙跑步/跳跃/低头/死亡四种状态
- 仙人掌 5 种组合（加权随机）+ 翼龙双轨翅膀扇动
- 计时器缓动跳跃（easeOutQuad 上升 + easeInQuad 下落）
- AABB 碰撞检测（碰撞箱内缩，腿部不参与判定）
- Web Audio API 程序化音效
- 难度递增（速度 0.9→6，翼龙概率 10%→30%）
- LocalStorage 排行榜 Top 10
- 昼夜模式切换
- SPA 单页三视图
- 响应式布局

## 运行

### 桌面端

VS Code Live Server 或 `npx serve .`。直接双击 `index.html` 也可运行（Fetch 自动回退 `config.js`）。

### 手机端 & 在线访问（GitHub Pages）

1. Push 到 GitHub 仓库
2. Settings → Pages → Source 选 `main` 分支，根目录 `/` → Save
3. 访问 `https://<用户名>.github.io/<仓库名>/`

> 免费 HTTPS，无需服务器，每次 push 自动更新。手机直接浏览器打开即玩。

### 手机端（本地 WiFi 调试）

电脑启动 Live Server → `ipconfig` 查 IPv4 → 手机浏览器访问 `http://<IP>:5500`

## 操作

| 操作 | 桌面端 | 移动端 |
|------|--------|--------|
| 跳跃 | 空格 / ↑ | 点击屏幕 |
| 低头 | ↓ | 下滑 |

## 目录结构

```
chrome-dino/
├── index.html              # SPA 页面
├── styles/style.css        # 样式 + 昼夜主题
├── scripts/
│   ├── game.js             # 游戏核心
│   ├── app.js              # 路由/表单/排行榜
│   └── config.js           # 配置 + Sprite 坐标表
├── assets/
│   ├── sprite01.png        # 主精灵图
│   └── sprite02.png        # 辅助精灵图
├── config.json             # Fetch 演示配置
└── README.md
```

## 技术栈

HTML5 Canvas · CSS3 响应式 · JavaScript ES6+ · Web Audio API · LocalStorage · Fetch API