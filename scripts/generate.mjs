import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(process.cwd());
const seedPath = resolve(root, 'data/seed/places.json');
const outPath = resolve(root, 'data/generated/rankings.json');

const seed = JSON.parse(readFileSync(seedPath, 'utf8'));

function score(item) {
  return (
    item.rating * 20 * 0.5 +
    item.popularity * 0.25 +
    item.stability * 0.15 +
    item.value * 0.1
  );
}

function sortRank(items) {
  return [...items]
    .map((x) => ({ ...x, score: Number(score(x).toFixed(2)) }))
    .sort((a, b) => b.score - a.score);
}

function buildRoute(foods, plays) {
  const route = [];
  if (foods[0]) route.push({ type: 'eat', name: foods[0].name, lat: foods[0].lat, lng: foods[0].lng });
  if (plays[0]) route.push({ type: 'play', name: plays[0].name, lat: plays[0].lat, lng: plays[0].lng });
  if (foods[1]) route.push({ type: 'eat', name: foods[1].name, lat: foods[1].lat, lng: foods[1].lng });
  if (plays[1]) route.push({ type: 'play', name: plays[1].name, lat: plays[1].lat, lng: plays[1].lng });
  return route;
}

const generated = {
  generatedAt: new Date().toISOString(),
  cities: seed.cities.map((city) => {
    const foods = sortRank(city.foods);
    const plays = sortRank(city.plays);
    return {
      name: city.name,
      slug: city.slug,
      topFoods: foods,
      topPlays: plays,
      route: buildRoute(foods, plays)
    };
  })
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(generated, null, 2), 'utf8');

const htmlPath = resolve(root, 'public/index.html');
mkdirSync(dirname(htmlPath), { recursive: true });

const cityButtons = generated.cities
  .map((c, i) => `<button onclick="renderCity(${i})">${c.name}</button>`)
  .join('');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CityFunRank</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; margin: 0; background:#0b1020; color:#e6ebff; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 24px; }
    .card { background: #141b34; border: 1px solid #243056; border-radius: 14px; padding: 16px; margin-top: 16px; }
    h1 { margin: 0 0 8px; }
    .muted { color:#a8b3d9; }
    button { margin-right:8px; margin-bottom:8px; background:#2a3a72; color:#fff; border:none; border-radius:8px; padding:8px 12px; cursor:pointer; }
    li { margin: 6px 0; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
    @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>CityFunRank</h1>
    <div class="muted">城市生活探索引擎 · 好吃榜 / 好玩榜 / 路线推荐（自动重算）</div>
    <div class="card">${cityButtons}</div>
    <div id="app"></div>
  </div>

<script>
const DATA = ${JSON.stringify(generated)};

function itemLine(x, i) {
  return '<li>#' + (i+1) + ' ' + x.name + '（综合分 ' + x.score + '）<br><small>位置: ' + x.lat + ', ' + x.lng + ' · 分类: ' + x.category + '</small></li>';
}

function renderCity(idx) {
  const city = DATA.cities[idx];
  const foods = city.topFoods.slice(0,5).map(itemLine).join('');
  const plays = city.topPlays.slice(0,5).map(itemLine).join('');
  const route = city.route.map(function(r, i){
    return '<li>' + (i+1) + '. [' + (r.type === 'eat' ? '吃' : '玩') + '] ' + r.name + '（' + r.lat + ', ' + r.lng + '）</li>';
  }).join('');

  document.getElementById('app').innerHTML =
    '<div class="card"><h2>' + city.name + '</h2><div class="muted">更新时间：' + DATA.generatedAt + '</div></div>' +
    '<div class="grid">' +
      '<div class="card"><h3>🍜 好吃榜 Top 5</h3><ol>' + foods + '</ol></div>' +
      '<div class="card"><h3>🎡 好玩榜 Top 5</h3><ol>' + plays + '</ol></div>' +
    '</div>' +
    '<div class="card"><h3>🗺️ 推荐路线（半日）</h3><ol>' + route + '</ol></div>';
}

renderCity(0);
</script>
</body>
</html>`;

writeFileSync(htmlPath, html, 'utf8');
console.log('Generated rankings + static site at public/index.html');
