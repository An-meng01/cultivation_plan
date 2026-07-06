import axios from 'axios';

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
  return api.get('/tasks', { params }) as Promise<{ code: number; data: Task[] }>;
}

export function fetchTask(id: number) {
  return api.get(`/tasks/${id}`) as Promise<{ code: number; data: Task }>;
}

export function createTask(data: TaskForm) {
  return api.post('/tasks', data) as Promise<{ code: number; data: { id: number } }>;
}

export function updateTask(id: number, data: Partial<TaskForm & { completed: boolean }>) {
  return api.put(`/tasks/${id}`, data) as Promise<{ code: number; message: string }>;
}

export function deleteTask(id: number) {
  return api.delete(`/tasks/${id}`) as Promise<{ code: number; message: string }>;
}

export function completeTask(id: number) {
  return api.put(`/tasks/${id}/complete`) as Promise<{ code: number; message: string }>;
}

export function fetchSystemTasks() {
  return api.get('/tasks/system') as Promise<{ code: number; data: Task[] }>;
}

export function clockIn(taskId: number) {
  return api.post('/clock-in', { taskId }) as Promise<{ code: number; message: string }>;
}

export function fetchClockRecords(params?: { taskId?: number; date?: string }) {
  return api.get('/clock-records', { params }) as Promise<{ code: number; data: ClockRecord[] }>;
}

export function fetchAnalysisOverview() {
  return api.get('/analysis/overview') as Promise<{ code: number; data: AnalysisOverview }>;
}

export function fetchDailyStats(start: string, end: string) {
  return api.get('/analysis/daily', { params: { start, end } }) as Promise<{ code: number; data: DailyStat[] }>;
}

export function fetchPriorityDistribution() {
  return api.get('/analysis/priorities') as Promise<{ code: number; data: Record<string, number> }>;
}

export default api;
