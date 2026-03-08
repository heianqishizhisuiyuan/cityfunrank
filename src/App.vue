<script setup lang="ts">
import { computed, ref } from 'vue';
import rankingRaw from '../data/generated/rankings.json';
import type { RankingData } from './types';

const ranking = rankingRaw as RankingData;
const selected = ref(0);

const city = computed(() => ranking.cities[selected.value]);

function citySubtitle(type: 'eat' | 'play') {
  return type === 'eat' ? '🍜 好吃榜 Top 5' : '🎡 好玩榜 Top 5';
}
</script>

<template>
  <div class="wrap">
    <h1>CityFunRank</h1>
    <div class="muted">城市生活探索引擎 · 好吃榜 / 好玩榜 / 路线推荐（自动重算）</div>

    <div class="card">
      <button
        v-for="(c, i) in ranking.cities"
        :key="c.slug"
        :class="{ active: i === selected }"
        @click="selected = i"
      >
        {{ c.name }}
      </button>
    </div>

    <div class="card">
      <h2>{{ city.name }}</h2>
      <div class="muted">更新时间：{{ ranking.generatedAt }}</div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>{{ citySubtitle('eat') }}</h3>
        <ol>
          <li v-for="(item, idx) in city.topFoods.slice(0, 5)" :key="item.name">
            #{{ idx + 1 }} {{ item.name }}（综合分 {{ item.score }}）
            <br />
            <small>位置: {{ item.lat }}, {{ item.lng }} · 分类: {{ item.category }}</small>
          </li>
        </ol>
      </div>

      <div class="card">
        <h3>{{ citySubtitle('play') }}</h3>
        <ol>
          <li v-for="(item, idx) in city.topPlays.slice(0, 5)" :key="item.name">
            #{{ idx + 1 }} {{ item.name }}（综合分 {{ item.score }}）
            <br />
            <small>位置: {{ item.lat }}, {{ item.lng }} · 分类: {{ item.category }}</small>
          </li>
        </ol>
      </div>
    </div>

    <div class="card">
      <h3>🗺️ 推荐路线（半日）</h3>
      <ol>
        <li v-for="(step, idx) in city.route" :key="`${step.type}-${step.name}`">
          {{ idx + 1 }}. [{{ step.type === 'eat' ? '吃' : '玩' }}] {{ step.name }}（{{ step.lat }}, {{ step.lng }}）
        </li>
      </ol>
    </div>
  </div>
</template>
