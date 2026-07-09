// Mock 服务：在前端内存中模拟后端接口（任务、打卡、分析数据），用于无后端时的本地开发与演示。
import dayjs from 'dayjs';
import {
  Task,
  TaskType,
  IntervalUnit,
  ClockRecord,
  AnalysisOverview,
  DailyStat,
} from './api';

// ---------- 模拟网络延迟 ----------
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ---------- 内存数据库 ----------
let nextId = 100;
const now = dayjs();

const tasks: Task[] = [
  {
    id: 1, title: '每日英语单词背诵', description: '背诵 30 个新单词并复习旧词',
    topic: '英语', priority: 2, source: 'system', needReviewReminder: true, type: 'daily',
    completed: false, deadline: now.add(3, 'hour').toISOString(),
    createdAt: now.subtract(2, 'day').toISOString(), completedAt: null,
  },
  {
    id: 2, title: '编程练习: 两数之和', description: 'LeetCode 每日一题',
    topic: '编程', priority: 3, source: 'custom', needReviewReminder: false, type: 'daily',
    completed: false, deadline: now.subtract(2, 'hour').toISOString(),
    createdAt: now.subtract(1, 'day').toISOString(), completedAt: null,
  },
  {
    id: 3, title: '阅读技术文章', description: '阅读一篇前端性能优化文章',
    topic: '编程', priority: 1, source: 'system', needReviewReminder: false, type: 'once',
    completed: true, deadline: now.subtract(1, 'day').toISOString(),
    createdAt: now.subtract(3, 'day').toISOString(), completedAt: now.subtract(1, 'day').toISOString(),
  },
  {
    id: 4, title: '数学题练习', description: '高数习题 3.2',
    topic: '数学', priority: 2, source: 'custom', needReviewReminder: true, type: 'periodic', intervalValue: 2, intervalUnit: 'day', lastCheckIn: now.subtract(1, 'day').toISOString(),
    completed: false, deadline: now.add(20, 'hour').toISOString(),
    createdAt: now.subtract(2, 'day').toISOString(), completedAt: null,
  },
  {
    id: 5, title: '课程复习', description: '复习操作系统第三章',
    topic: '数学', priority: 1, source: 'system', needReviewReminder: false, type: 'periodic', intervalValue: 1, intervalUnit: 'week', lastCheckIn: now.subtract(3, 'day').toISOString(),
    completed: false, deadline: now.add(5, 'day').toISOString(),
    createdAt: now.subtract(1, 'day').toISOString(), completedAt: null,
  },
  {
    id: 6, title: '整理学习笔记', description: '',
    topic: '英语', priority: 0, source: 'custom', needReviewReminder: false, type: 'once',
    completed: true, deadline: now.subtract(4, 'day').toISOString(),
    createdAt: now.subtract(5, 'day').toISOString(), completedAt: now.subtract(4, 'day').toISOString(),
  },
  {
    id: 7, title: '背一篇英文短文', description: '',
    topic: '英语', priority: 1, source: 'custom', needReviewReminder: false, type: 'daily',
    completed: false, deadline: now.add(12, 'hour').toISOString(),
    createdAt: now.subtract(1, 'day').toISOString(), completedAt: null,
  },
  {
    id: 8, title: '算法: 动态规划入门', description: '看视频 + 做 2 题',
    topic: '编程', priority: 2, source: 'custom', needReviewReminder: false, type: 'periodic', intervalValue: 3, intervalUnit: 'day',
    completed: false, deadline: now.add(2, 'day').toISOString(),
    createdAt: now.subtract(1, 'day').toISOString(), completedAt: null,
  },
];

// 系统推荐任务
const systemTemplates: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt' | 'source'>[] = [
  { title: '每日英语单词背诵', description: '背诵 30 个新单词', topic: '英语', priority: 2, needReviewReminder: true, deadline: null, type: 'daily' },
  { title: '编程练习', description: '完成一道算法题', topic: '编程', priority: 2, needReviewReminder: false, deadline: null, type: 'daily' },
  { title: '阅读技术文章', description: '阅读一篇技术文章', topic: '编程', priority: 1, needReviewReminder: false, deadline: null, type: 'once' },
  { title: '数学题练习', description: '完成一节数学习题', topic: '数学', priority: 2, needReviewReminder: true, deadline: null, type: 'periodic', intervalValue: 2, intervalUnit: 'day' },
  { title: '课程复习', description: '复习当天课程内容', topic: '数学', priority: 1, needReviewReminder: false, deadline: null, type: 'periodic', intervalValue: 1, intervalUnit: 'week' },
];

// 最近几天的打卡记录
const clockRecords: ClockRecord[] = [
  { id: 1, taskId: 3, taskTitle: '阅读技术文章', checkInTime: now.subtract(1, 'day').toISOString() },
  { id: 2, taskId: 6, taskTitle: '整理学习笔记', checkInTime: now.subtract(4, 'day').toISOString() },
  { id: 3, taskId: 3, taskTitle: '阅读技术文章', checkInTime: now.subtract(3, 'day').toISOString() },
];

const findTask = (id: number) => tasks.find((t) => t.id === id);

// ---------- 各接口实现 ----------
export async function mockGetTasks(params?: Record<string, string>) {
  await delay();
  let list = [...tasks];
  if (params?.topic) list = list.filter((t) => t.topic === params.topic);
  if (params?.priority) list = list.filter((t) => String(t.priority) === params.priority);
  if (params?.source) list = list.filter((t) => t.source === params.source);
  if (params?.completed) list = list.filter((t) => String(t.completed) === params.completed);
  return { code: 0, data: list };
}

export async function mockGetTask(id: number) {
  await delay();
  const t = findTask(id);
  return t ? { code: 0, data: t } : { code: 404, message: 'not found' };
}

export async function mockCreateTask(data: any) {
  await delay();
  const id = ++nextId;
  tasks.unshift({
    id,
    title: data.title,
    description: data.description ?? '',
    topic: data.topic ?? '',
    priority: data.priority ?? 1,
    source: 'custom',
    needReviewReminder: !!data.needReviewReminder,
    completed: false,
    deadline: data.deadline ?? null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    type: (data.type as TaskType) ?? 'once',
    intervalValue: data.intervalValue,
    intervalUnit: data.intervalUnit as IntervalUnit | undefined,
    lastCheckIn: null,
  });
  return { code: 0, data: { id } };
}

export async function mockUpdateTask(id: number, data: any) {
  await delay();
  const t = findTask(id);
  if (!t) return { code: 404, message: 'not found' };
  Object.assign(t, data);
  return { code: 0, message: 'ok' };
}

export async function mockDeleteTask(id: number) {
  await delay();
  const i = tasks.findIndex((t) => t.id === id);
  if (i >= 0) tasks.splice(i, 1);
  return { code: 0, message: 'ok' };
}

export async function mockCompleteTask(id: number) {
  await delay();
  const t = findTask(id);
  if (!t) return { code: 404, message: 'not found' };
  t.completed = true;
  t.completedAt = new Date().toISOString();
  return { code: 0, message: 'ok' };
}

export async function mockGetSystemTasks() {
  await delay();
  const list = systemTemplates.map((t, i) => ({
    ...t,
    id: 900 + i,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  }));
  return { code: 0, data: list as Task[] };
}

export async function mockClockIn(taskId: number) {
  await delay();
  const t = findTask(taskId);
  if (!t) return { code: 404, message: 'task not found' };
  const today = dayjs().format('YYYY-MM-DD');
  const alreadyToday = clockRecords.some(
    (r) => r.taskId === taskId && dayjs(r.checkInTime).format('YYYY-MM-DD') === today,
  );

  if (t.type === 'once') {
    if (t.completed) return { code: 409, message: 'already completed' };
  } else if (t.type === 'daily') {
    if (alreadyToday) return { code: 409, message: 'already checked in today' };
  } else {
    // 周期任务：本周期（上次打卡至今）已打过则视为重复
    const start = t.lastCheckIn ? dayjs(t.lastCheckIn) : dayjs(t.createdAt);
    const inCycle = clockRecords.some(
      (r) =>
        r.taskId === taskId &&
        (dayjs(r.checkInTime).isSame(start) || dayjs(r.checkInTime).isAfter(start)),
    );
    if (inCycle) return { code: 409, message: 'already checked in this period' };
  }

  clockRecords.push({
    id: ++nextId,
    taskId,
    taskTitle: t.title,
    checkInTime: new Date().toISOString(),
  });
  t.lastCheckIn = new Date().toISOString();
  // 一次性任务打卡即完结；每天/周期任务仅记录打卡，不自动完结
  if (t.type === 'once') {
    t.completed = true;
    t.completedAt = new Date().toISOString();
  }
  return { code: 0, message: 'checked in' };
}

export async function mockGetClockRecords(params?: { taskId?: number; date?: string }) {
  await delay();
  let list = [...clockRecords];
  if (params?.taskId) list = list.filter((r) => r.taskId === params.taskId);
  if (params?.date) {
    list = list.filter((r) => dayjs(r.checkInTime).format('YYYY-MM-DD') === params.date);
  }
  return { code: 0, data: list };
}

export async function mockGetAnalysisOverview() {
  await delay();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
  const topicDistribution: Record<string, number> = {};
  const topicCompleted: Record<string, number> = {};
  for (const t of tasks) {
    topicDistribution[t.topic || '未分类'] = (topicDistribution[t.topic || '未分类'] || 0) + 1;
    if (t.completed) topicCompleted[t.topic || '未分类'] = (topicCompleted[t.topic || '未分类'] || 0) + 1;
  }
  const topicCompletionRate: Record<string, number> = {};
  for (const k of Object.keys(topicDistribution)) {
    topicCompletionRate[k] = Math.round(((topicCompleted[k] || 0) / topicDistribution[k]) * 1000) / 10;
  }
  const topicDist = Object.entries(topicDistribution).map(([topic, count]) => ({ topic, count }));
  const topicRate = Object.entries(topicCompletionRate).map(([topic, rate]) => ({ topic, completed: topicCompleted[topic] || 0, rate }));
  const data: AnalysisOverview = {
    totalTasks: total, completed, pending, completionRate,
    topicDist, topicRate,
  };
  return { code: 0, data };
}

function seeded(n: number) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

export async function mockGetDailyStats(start: string, end: string) {
  await delay();
  const days = dayjs(end).diff(dayjs(start), 'day');
  const list: DailyStat[] = [];
  for (let i = 0; i <= days; i++) {
    const d = dayjs(start).add(i, 'day');
    const seed = d.date();
    const added = Math.floor(seeded(seed) * 5);
    const completed = Math.floor(seeded(seed + 100) * (added + 1));
    const rate = added + completed > 0 ? Math.round((completed / (added + completed)) * 1000) / 10 : 0;
    list.push({ date: d.format('YYYY-MM-DD'), added, completed, rate });
  }
  return { code: 0, data: list };
}

export async function mockGetPriorityDistribution() {
  await delay();
  const dist: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0 };
  for (const t of tasks) dist[String(t.priority)] = (dist[String(t.priority)] || 0) + 1;
  return { code: 0, data: dist };
}
