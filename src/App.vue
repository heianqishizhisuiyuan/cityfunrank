<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import rankingRaw from '../data/generated/rankings.json';
import type { CityRanking, Place, RankingData } from './types';

const ranking = rankingRaw as RankingData;
const cityQuery = ref('');
const placeQuery = ref('');
const budgetMode = ref<'all' | 'budget' | 'balanced' | 'premium'>('all');
const selectedSlug = ref(ranking.cities[0]?.slug ?? '');
const copyHint = ref('');

const filteredCities = computed(() => {
  const q = cityQuery.value.trim().toLowerCase();
  if (!q) return ranking.cities;
  return ranking.cities.filter((c) => c.name.toLowerCase().includes(q));
});

watch(filteredCities, (list) => {
  if (!list.length) return;
  if (!list.some((c) => c.slug === selectedSlug.value)) {
    selectedSlug.value = list[0].slug;
  }
});

const city = computed<CityRanking | null>(() => {
  const list = filteredCities.value;
  return list.find((c) => c.slug === selectedSlug.value) ?? list[0] ?? null;
});

function passBudget(item: Place) {
  switch (budgetMode.value) {
    case 'budget':
      return item.value >= 86;
    case 'balanced':
      return item.value >= 80 && item.rating >= 4.4;
    case 'premium':
      return item.rating >= 4.6;
    default:
      return true;
  }
}

const filteredFoods = computed(() => {
  if (!city.value) return [];
  const q = placeQuery.value.trim().toLowerCase();
  return city.value.topFoods
    .filter(passBudget)
    .filter(
      (i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.address ?? '').toLowerCase().includes(q)
    )
    .slice(0, 10);
});

const filteredPlays = computed(() => {
  if (!city.value) return [];
  const q = placeQuery.value.trim().toLowerCase();
  return city.value.topPlays
    .filter(passBudget)
    .filter(
      (i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.address ?? '').toLowerCase().includes(q)
    )
    .slice(0, 10);
});

function citySubtitle(type: 'eat' | 'play') {
  return type === 'eat' ? '🍜 好吃榜 Top 10' : '🎡 好玩榜 Top 10';
}

function mapLink(step: { name: string; address?: string }) {
  const keyword = encodeURIComponent(step.address ? `${step.name} ${step.address}` : step.name);
  return `https://uri.amap.com/search?keyword=${keyword}`;
}

function routeText() {
  if (!city.value) return '';
  return city.value.route
    .map((step, idx) => `${idx + 1}. [${step.type === 'eat' ? '吃' : '玩'}] ${step.name}（${step.address || '地址待补充'}）`)
    .join('\n');
}

async function copyRoute() {
  const text = routeText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyHint.value = '路线已复制';
  } catch {
    copyHint.value = '复制失败，请手动复制';
  }
  setTimeout(() => (copyHint.value = ''), 2000);
}
</script>

<template>
  <div class="wrap">
    <h1>CityFunRank</h1>
    <div class="muted">城市生活探索引擎 · 好吃榜 / 好玩榜 / 路线推荐（自动重算）</div>

    <div class="card search-row">
      <input v-model="cityQuery" type="text" placeholder="搜索城市（如 上海 / 深圳）" />
      <input v-model="placeQuery" type="text" placeholder="搜索吃喝玩乐关键词（如 火锅 / 博物馆）" />
    </div>

    <div class="card filters-row">
      <label class="muted">预算偏好：</label>
      <select v-model="budgetMode">
        <option value="all">全部</option>
        <option value="budget">省钱优先</option>
        <option value="balanced">均衡体验</option>
        <option value="premium">品质优先</option>
      </select>
    </div>

    <div class="card">
      <button
        v-for="c in filteredCities"
        :key="c.slug"
        :class="{ active: c.slug === (city && city.slug) }"
        @click="selectedSlug = c.slug"
      >
        {{ c.name }}
      </button>
      <div v-if="!filteredCities.length" class="muted">未找到匹配城市，试试别的关键词</div>
    </div>

    <template v-if="city">
      <div class="card">
        <h2>{{ city.name }}</h2>
        <div class="muted">更新时间：{{ ranking.generatedAt }}</div>
      </div>

      <div class="grid">
        <div class="card">
          <h3>{{ citySubtitle('eat') }}</h3>
          <ol>
            <li v-for="(item, idx) in filteredFoods" :key="item.name">
              #{{ idx + 1 }} {{ item.name }}（综合分 {{ item.score }}）
              <br />
              <small>地址: {{ item.address || '待补充' }} · 分类: {{ item.category }}</small>
            </li>
          </ol>
        </div>

        <div class="card">
          <h3>{{ citySubtitle('play') }}</h3>
          <ol>
            <li v-for="(item, idx) in filteredPlays" :key="item.name">
              #{{ idx + 1 }} {{ item.name }}（综合分 {{ item.score }}）
              <br />
              <small>地址: {{ item.address || '待补充' }} · 分类: {{ item.category }}</small>
            </li>
          </ol>
        </div>
      </div>

      <div class="card">
        <div class="route-head">
          <h3>🗺️ 推荐路线（半日）</h3>
          <button class="small-btn" @click="copyRoute">复制路线</button>
        </div>
        <div class="muted" v-if="copyHint">{{ copyHint }}</div>
        <ol>
          <li v-for="(step, idx) in city.route" :key="`${step.type}-${step.name}`">
            {{ idx + 1 }}. [{{ step.type === 'eat' ? '吃' : '玩' }}] {{ step.name }}（{{ step.address || '地址待补充' }}）
            · <a :href="mapLink(step)" target="_blank" rel="noreferrer">地图导航</a>
          </li>
        </ol>
      </div>
    </template>
  </div>
</template>
