import axios from 'axios';
import * as mock from './mockServer';

// 使用内置假数据测试前段时，把 .env 里 VITE_USE_MOCK 设为 true 
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || err),
);

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
}

export interface TaskForm {
  title: string;
  description?: string;
  topic?: string;
  priority?: number;
  needReviewReminder?: boolean;
  deadline?: string;
}

export interface ClockRecord {
  id: number;
  taskId: number;
  taskTitle: string;
  checkInTime: string;
}

export interface AnalysisOverview {
  totalTasks: number;
  completed: number;
  pending: number;
  completionRate: number;
  topicDistribution: Record<string, number>;
  topicCompletionRate: Record<string, number>;
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

export function fetchPriorityDistribution() {
  if (USE_MOCK) return mock.mockGetPriorityDistribution() as any;
  return api.get('/analysis/priorities') as Promise<{ code: number; data: Record<string, number> }>;
}

export default api;
