# CityFunRank

城市生活探索引擎（Vue3 + TypeScript）：输入城市，获得「好吃榜 / 好玩榜 / 具体位置 / 推荐路线」。

## 当前能力

- 🔎 城市切换（当前内置：北京、上海、广州、深圳、杭州、成都）
- 🍜 好吃榜（综合评分、热度、人均、稳定性）
- 🎡 好玩榜（景点/体验综合排序）
- 🎯 场景筛选（约会 / 亲子 / 独自 / 游客首访）
- 🧭 空结果友好提示（引导用户调整筛选）
- 🗺️ 推荐路线（半日）
- ♻️ 每日自动重算（GitHub Actions）
- ✅ CI 自检（Typecheck + Unit Test + Build）
- 🚀 GitHub Pages 自动部署

## 技术栈

- Frontend: Vue 3 + TypeScript + Vite
- Data: JSON（后续接入真实 POI/API）
- Test: Vitest
- CI/CD: GitHub Actions

## 本地开发

```bash
npm install
```

### 启动“真同步”龙虾看板（推荐双终端）

终端 1：启动本地 ops 服务（聚合 OpenClaw CLI）

```bash
npm run ops:start
```

终端 2：启动前端

```bash
npm run dev
```

前端将优先读取 `/api/ops`；若本地服务或 OpenClaw CLI 异常，会自动回退到内置 mock 数据。

### 轮询节流策略

- 页面前台（可见）：每 10 秒拉取一次 `/api/ops`
- 页面后台（隐藏）：每 30 秒拉取一次 `/api/ops`

## 质量门禁

```bash
npm run ci
```

包含：

1. `vue-tsc --noEmit`
2. `vitest run`
3. `npm run build`

## 自动化任务

- `ci.yml`：每次 push/PR 自动检查质量
- `pages.yml`：main 分支自动部署到 GitHub Pages
- `daily-refresh.yml`：每天 UTC 01:00 自动重算榜单并自动提交（如有变化）

## 路线图

详见 `docs/ROADMAP.md`。

## License

MIT
