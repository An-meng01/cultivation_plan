// API 服务层：定义任务/打卡/分析等后端接口请求函数、数据类型，并支持根据环境变量切换 Mock 数据。
import axios from 'axios';
import * as mock from './mockServer';

// 使用内置假数据测试前段时，把 .env 里 VITE_USE_MOCK 设为 true 
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  },
);

export type TaskType = 'daily' | 'periodic' | 'once';
export type IntervalUnit = 'day' | 'week' | 'month';

export interface Task {
  id: number;
  title: string;
  description: string;
  topic: string;
  priority: number;
  source: 'custom' | 'system';
  needReviewReminder: boolean;
  completed: boolean;
  deadline: string | null;
  createdAt: string;
  completedAt: string | null;
  type: TaskType;
  intervalValue?: number;
  intervalUnit?: IntervalUnit;
  lastCheckIn?: string | null;
}

export interface TaskForm {
  title: string;
  description?: string;
  topic?: string;
  priority?: number;
  source?: 'custom' | 'system';
  needReviewReminder?: boolean;
  deadline?: string;
  type?: TaskType;
  intervalValue?: number;
  intervalUnit?: IntervalUnit;
}

export interface ClockRecord {
  id: number;
  taskId: number;
  taskTitle: string;
  checkInTime: string;
}

export interface TopicDistItem {
  topic: string;
  count: number;
}

export interface TopicRateItem {
  topic: string;
  completed: number;
  rate: number;
}

export interface AnalysisOverview {
  totalTasks: number;
  completed: number;
  pending: number;
  completionRate: number;
  topicDist: TopicDistItem[];
  topicRate: TopicRateItem[];
}

export interface DailyStat {
  date: string;
  added: number;
  completed: number;
  rate: number;
}

export function fetchTasks(params?: Record<string, string>) {
  if (USE_MOCK) return mock.mockGetTasks(params) as any;
  return api.get('/tasks', { params }) as Promise<{ code: number; data: Task[] }>;
}

export function fetchTask(id: number) {
  if (USE_MOCK) return mock.mockGetTask(id) as any;
  return api.get(`/tasks/${id}`) as Promise<{ code: number; data: Task }>;
}

export function createTask(data: TaskForm) {
  if (USE_MOCK) return mock.mockCreateTask(data) as any;
  return api.post('/tasks', data) as Promise<{ code: number; data: { id: number } }>;
}

export function updateTask(id: number, data: Partial<TaskForm & { completed: boolean }>) {
  if (USE_MOCK) return mock.mockUpdateTask(id, data) as any;
  return api.put(`/tasks/${id}`, data) as Promise<{ code: number; message: string }>;
}

export function deleteTask(id: number) {
  if (USE_MOCK) return mock.mockDeleteTask(id) as any;
  return api.delete(`/tasks/${id}`) as Promise<{ code: number; message: string }>;
}

export function completeTask(id: number) {
  if (USE_MOCK) return mock.mockCompleteTask(id) as any;
  return api.put(`/tasks/${id}/complete`) as Promise<{ code: number; message: string }>;
}

export function fetchSystemTasks() {
  if (USE_MOCK) return mock.mockGetSystemTasks() as any;
  return api.get('/tasks/system') as Promise<{ code: number; data: Task[] }>;
}

export function clockIn(taskId: number) {
  if (USE_MOCK) return mock.mockClockIn(taskId) as any;
  return api.post('/clock-in', { taskId }) as Promise<{ code: number; message: string }>;
}

export function fetchClockRecords(params?: { taskId?: number; date?: string }) {
  if (USE_MOCK) return mock.mockGetClockRecords(params) as any;
  return api.get('/clock-records', { params }) as Promise<{ code: number; data: ClockRecord[] }>;
}

export function fetchAnalysisOverview() {
  if (USE_MOCK) return mock.mockGetAnalysisOverview() as any;
  return api.get('/analysis/overview') as Promise<{ code: number; data: AnalysisOverview }>;
}

export function fetchDailyStats(start: string, end: string) {
  if (USE_MOCK) return mock.mockGetDailyStats(start, end) as any;
  return api.get('/analysis/daily', { params: { start, end } }) as Promise<{ code: number; data: DailyStat[] }>;
}

export interface PriorityDistItem {
  priority: number;
  count: number;
}

export function fetchPriorityDistribution() {
  if (USE_MOCK) return mock.mockGetPriorityDistribution() as any;
  return api.get('/analysis/priorities') as Promise<{ code: number; data: Record<string, number> }>;
}

export default api;
