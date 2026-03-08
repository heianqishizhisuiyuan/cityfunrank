#!/usr/bin/env node
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MOCK_PATH = join(ROOT, 'src', 'mock', 'lobster-ops.json');

const PORT = Number(process.env.OPS_PORT || 8787);
const HOST = process.env.OPS_HOST || '127.0.0.1';

function nowISO() {
  return new Date().toISOString();
}

function hhmm(ts) {
  return new Date(ts).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function hashCode(text = '') {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function toAgentName(key = '') {
  if (!key) return '未知龙虾';
  const segments = key.split(':').filter(Boolean);
  const tail = segments[segments.length - 1] || key;
  if (tail === 'main') return '主控龙虾';
  if (tail === 'run') return '任务执行龙虾';
  if (tail.length >= 8) return `龙虾-${tail.slice(0, 6)}`;
  return `龙虾-${tail}`;
}

function toStatus(session) {
  if (session?.abortedLastRun) return 'error';
  const age = Number(session?.ageMs ?? Number.POSITIVE_INFINITY);
  if (age <= 120_000) return 'running';
  if (age <= 3_600_000) return 'idle';
  return 'done';
}

function toProgress(session, status) {
  const age = Number(session?.ageMs ?? 0);
  const seed = hashCode(session?.key ?? session?.sessionId ?? '0') % 100;
  if (status === 'running') {
    return clamp(20 + (seed % 55) + Math.floor((120_000 - Math.min(age, 120_000)) / 8_000), 18, 96);
  }
  if (status === 'idle') {
    return clamp(5 + (seed % 30), 5, 45);
  }
  if (status === 'error') {
    return clamp(25 + (seed % 60), 25, 95);
  }
  return 100;
}

function statusTask(status, session) {
  const kind = session?.kind ? `类型: ${session.kind}` : '类型: 未知';
  if (status === 'running') return `会话活跃中（${kind}）`;
  if (status === 'idle') return `最近活跃，等待新任务（${kind}）`;
  if (status === 'error') return '上次运行中断，待人工确认';
  return '历史任务已完成';
}

function buildTimeline(status, session) {
  const updatedAt = Number(session?.updatedAt ?? Date.now());
  const model = session?.model ?? 'unknown-model';
  const timeline = [
    { time: hhmm(updatedAt), label: `会话刷新（${model}）`, type: 'info' },
    { time: hhmm(updatedAt), label: `累计 Tokens: ${session?.totalTokens ?? 'n/a'}`, type: 'info' }
  ];

  if (status === 'error') {
    timeline.push({ time: hhmm(updatedAt), label: '检测到异常退出', type: 'error' });
  } else if (status === 'running') {
    timeline.push({ time: hhmm(updatedAt), label: '正在持续执行', type: 'success' });
  } else if (status === 'idle') {
    timeline.push({ time: hhmm(updatedAt), label: '当前无活跃动作', type: 'warning' });
  } else {
    timeline.push({ time: hhmm(updatedAt), label: '任务归档完成', type: 'success' });
  }

  return timeline;
}

async function runOpenclaw(args, timeout = 5000) {
  const { stdout } = await execFileAsync('openclaw', args, {
    cwd: ROOT,
    timeout,
    maxBuffer: 1024 * 1024
  });
  return stdout;
}

async function readMockBoard() {
  const raw = await readFile(MOCK_PATH, 'utf8');
  const board = JSON.parse(raw);
  return {
    ...board,
    generatedAt: nowISO(),
    squadName: `${board.squadName}（Mock 回退）`
  };
}

function parseGatewayRuntime(raw = '') {
  const line = raw
    .split('\n')
    .map((s) => s.trim())
    .find((s) => s.startsWith('Runtime:'));
  if (!line) return 'unknown';
  if (line.includes('running')) return 'running';
  if (line.includes('stopped')) return 'stopped';
  return 'unknown';
}

async function buildOpsBoard() {
  const sessionsRaw = await runOpenclaw(['sessions', '--json']);
  const sessionsData = JSON.parse(sessionsRaw);
  const sessions = Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : [];

  let gatewayRuntime = 'unknown';
  try {
    const gatewayRaw = await runOpenclaw(['gateway', 'status'], 4000);
    gatewayRuntime = parseGatewayRuntime(gatewayRaw);
  } catch {
    gatewayRuntime = 'unknown';
  }

  const lobsters = sessions.slice(0, 24).map((session) => {
    const status = toStatus(session);
    return {
      id: session?.sessionId || session?.key || `session-${Math.random().toString(36).slice(2, 8)}`,
      name: toAgentName(session?.key),
      status,
      currentTask: statusTask(status, session),
      progress: toProgress(session, status),
      updatedAt: new Date(session?.updatedAt || Date.now()).toISOString(),
      timeline: buildTimeline(status, session)
    };
  });

  const activeCount = lobsters.filter((item) => item.status === 'running').length;
  const runtimeBadge = gatewayRuntime === 'running' ? '网关在线' : gatewayRuntime === 'stopped' ? '网关离线' : '网关未知';

  return {
    generatedAt: nowISO(),
    squadName: `CityFunRank 龙虾行动队（${runtimeBadge}）`,
    activeCount,
    lobsters
  };
}

function sendJson(res, code, payload) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/healthz' || url.pathname === '/api/healthz')) {
    sendJson(res, 200, { ok: true, generatedAt: nowISO() });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/ops') {
    try {
      const board = await buildOpsBoard();
      sendJson(res, 200, board);
      return;
    } catch (error) {
      try {
        const fallback = await readMockBoard();
        sendJson(res, 200, fallback);
        return;
      } catch {
        sendJson(res, 500, {
          error: 'ops_board_unavailable',
          message: error instanceof Error ? error.message : String(error),
          generatedAt: nowISO()
        });
      }
      return;
    }
  }

  sendJson(res, 404, { error: 'not_found', path: url.pathname });
});

server.listen(PORT, HOST, () => {
  console.log(`[ops-server] listening on http://${HOST}:${PORT}`);
});
