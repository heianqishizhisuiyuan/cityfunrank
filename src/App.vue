<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import rankingRaw from '../data/generated/rankings.json';
import lobsterOpsRaw from './mock/lobster-ops.json';
import type {
  CityRanking,
  LobsterAgent,
  LobsterOpsBoard,
  LobsterStatus,
  Place,
  RankingData,
  SceneTag
} from './types';

const ranking = rankingRaw as RankingData;
const opsSeed = lobsterOpsRaw as LobsterOpsBoard;

const viewMode = ref<'rank' | 'ops'>('rank');

const cityQuery = ref('');
const placeQuery = ref('');
const budgetMode = ref<'all' | 'budget' | 'balanced' | 'premium'>('all');
const sceneMode = ref<'all' | SceneTag>('all');
const selectedSlug = ref(ranking.cities[0]?.slug ?? '');
const copyHint = ref('');

const sceneOptions: Array<{ label: string; value: 'all' | SceneTag }> = [
  { label: '全部场景', value: 'all' },
  { label: '约会', value: 'date' },
  { label: '亲子', value: 'family' },
  { label: '独自', value: 'solo' },
  { label: '游客首访', value: 'first' }
];

const opsBoard = ref<LobsterOpsBoard>({
  ...opsSeed,
  lobsters: opsSeed.lobsters.map((lob) => ({ ...lob, timeline: [...lob.timeline] }))
});

function updateActiveCount(list: LobsterAgent[]) {
  return list.filter((lob) => lob.status === 'running').length;
}

let timer: ReturnType<typeof setInterval> | null = null;

function tickOpsBoard() {
  const current = opsBoard.value;
  const nextLobsters = current.lobsters.map((lob) => {
    const next = { ...lob, timeline: [...lob.timeline] };

    if (lob.status === 'running') {
      const gain = Math.floor(Math.random() * 10) + 3;
      const progress = Math.min(100, lob.progress + gain);
      next.progress = progress;
      if (progress >= 100) {
        next.status = 'done';
        next.currentTask = '任务完成，等待归档';
        next.timeline = [...next.timeline, { time: nowHHmm(), label: '任务执行完成', type: 'success' as const }].slice(-4);
      }
      next.updatedAt = new Date().toISOString();
      return next;
    }

    if (lob.status === 'idle' && Math.random() > 0.75) {
      next.status = 'running';
      next.progress = Math.max(5, lob.progress);
      next.currentTask = `执行增量任务 #${Math.floor(Math.random() * 90) + 10}`;
      next.updatedAt = new Date().toISOString();
      next.timeline = [...next.timeline, { time: nowHHmm(), label: '收到新任务并开始执行', type: 'info' as const }].slice(-4);
      return next;
    }

    if (lob.status === 'error' && Math.random() > 0.55) {
      next.status = 'running';
      next.currentTask = '异常恢复后继续执行';
      next.progress = Math.min(92, lob.progress + 12);
      next.updatedAt = new Date().toISOString();
      next.timeline = [...next.timeline, { time: nowHHmm(), label: '重试成功，恢复执行', type: 'success' as const }].slice(-4);
      return next;
    }

    return next;
  });

  if (Math.random() > 0.88) {
    const pick = nextLobsters.find((lob) => lob.status === 'running');
    if (pick) {
      pick.status = 'error';
      pick.currentTask = '出现异常，待重试';
      pick.updatedAt = new Date().toISOString();
      pick.timeline = [...pick.timeline, { time: nowHHmm(), label: '服务抖动，任务中断', type: 'error' as const }].slice(-4);
    }
  }

  opsBoard.value = {
    ...current,
    generatedAt: new Date().toISOString(),
    activeCount: updateActiveCount(nextLobsters),
    lobsters: nextLobsters
  };
}

function nowHHmm() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

timer = setInterval(tickOpsBoard, 2500);

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

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

function passScene(item: Place) {
  if (sceneMode.value === 'all') return true;
  return (item.sceneTags ?? []).includes(sceneMode.value);
}

const filteredFoods = computed(() => {
  if (!city.value) return [];
  const q = placeQuery.value.trim().toLowerCase();
  return city.value.topFoods
    .filter(passBudget)
    .filter(passScene)
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
    .filter(passScene)
    .filter(
      (i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.address ?? '').toLowerCase().includes(q)
    )
    .slice(0, 10);
});

const hasPlaceResults = computed(() => filteredFoods.value.length > 0 || filteredPlays.value.length > 0);

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

function statusLabel(status: LobsterStatus) {
  switch (status) {
    case 'idle':
      return '待机';
    case 'running':
      return '运行';
    case 'done':
      return '完成';
    case 'error':
      return '异常';
  }
}

function statusClass(status: LobsterStatus) {
  return `status-${status}`;
}

function timelineClass(type: 'info' | 'success' | 'warning' | 'error') {
  return `dot-${type}`;
}
</script>

<template>
  <div class="wrap">
    <h1>CityFunRank</h1>
    <div class="muted">城市生活探索引擎 · 好吃榜 / 好玩榜 / 路线推荐（自动重算）</div>

    <div class="card nav-tabs">
      <button :class="{ active: viewMode === 'rank' }" @click="viewMode = 'rank'">城市榜单</button>
      <button :class="{ active: viewMode === 'ops' }" @click="viewMode = 'ops'">龙虾任务看板</button>
    </div>

    <template v-if="viewMode === 'rank'">
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

      <div class="card filters-row">
        <label class="muted">场景筛选：</label>
        <select v-model="sceneMode">
          <option v-for="option in sceneOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
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

        <div v-if="!hasPlaceResults" class="card empty-state">
          <h3>没有找到匹配结果</h3>
          <p class="muted">你可以尝试：更换场景、放宽预算筛选，或清空关键词后再试一次。</p>
        </div>

        <div class="grid">
          <div class="card">
            <h3>{{ citySubtitle('eat') }}</h3>
            <ol v-if="filteredFoods.length">
              <li v-for="(item, idx) in filteredFoods" :key="item.name">
                #{{ idx + 1 }} {{ item.name }}（综合分 {{ item.score }}）
                <br />
                <small>地址: {{ item.address || '待补充' }} · 分类: {{ item.category }}</small>
              </li>
            </ol>
            <p v-else class="muted">当前条件下暂无“好吃榜”结果，试试切换筛选条件。</p>
          </div>

          <div class="card">
            <h3>{{ citySubtitle('play') }}</h3>
            <ol v-if="filteredPlays.length">
              <li v-for="(item, idx) in filteredPlays" :key="item.name">
                #{{ idx + 1 }} {{ item.name }}（综合分 {{ item.score }}）
                <br />
                <small>地址: {{ item.address || '待补充' }} · 分类: {{ item.category }}</small>
              </li>
            </ol>
            <p v-else class="muted">当前条件下暂无“好玩榜”结果，试试切换筛选条件。</p>
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
    </template>

    <template v-else>
      <div class="card ops-summary">
        <div>
          <h2>🦞 {{ opsBoard.squadName }}</h2>
          <div class="muted">看板更新时间：{{ new Date(opsBoard.generatedAt).toLocaleString('zh-CN') }}</div>
        </div>
        <div class="ops-active">活跃龙虾：{{ opsBoard.activeCount }}</div>
      </div>

      <div class="ops-grid">
        <div class="card lobster-card" v-for="lob in opsBoard.lobsters" :key="lob.id">
          <div class="lobster-head">
            <div>
              <h3>{{ lob.name }}</h3>
              <small class="muted">{{ lob.id }}</small>
            </div>
            <span class="status-badge" :class="statusClass(lob.status)">{{ statusLabel(lob.status) }}</span>
          </div>

          <div class="muted">当前任务：{{ lob.currentTask }}</div>

          <div class="progress-wrap">
            <div class="progress-text">进度 {{ lob.progress }}%</div>
            <div class="progress-track">
              <div class="progress-bar" :style="{ width: `${lob.progress}%` }" :class="statusClass(lob.status)"></div>
            </div>
          </div>

          <ul class="timeline">
            <li v-for="(item, idx) in lob.timeline" :key="`${lob.id}-${idx}-${item.time}`">
              <span class="timeline-dot" :class="timelineClass(item.type)"></span>
              <span class="timeline-time">{{ item.time }}</span>
              <span>{{ item.label }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>
