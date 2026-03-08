# CityFunRank

城市生活探索引擎（Vue3 + TypeScript）：输入城市，获得「好吃榜 / 好玩榜 / 具体位置 / 推荐路线」。

## 当前能力

- 🔎 城市切换（当前内置：上海、北京）
- 🍜 好吃榜（综合评分、热度、人均、稳定性）
- 🎡 好玩榜（景点/体验综合排序）
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
npm run dev
```

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
