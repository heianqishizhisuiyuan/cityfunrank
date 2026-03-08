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
  algorithm: 'v1: rating(50%) + popularity(25%) + stability(15%) + value(10%)',
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

console.log('Generated rankings at data/generated/rankings.json');
