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
    // 仅在已登录（存在 token）时，401 才视为会话失效跳转登录页；
    // 登录页本身的 401（账号密码错误）不要跳转，否则会刷新页面、吞掉错误提示。
    if (err.response?.status === 401 && localStorage.getItem('token')) {
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
  remindBeforeDays?: number | null;
  completed: boolean;
  deadline: string | null;
  reviewStatus?: string;
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
  remindBeforeDays?: number | null;
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

// 头像上传：提交 base64 图片，进入待审核(pending)状态，需管理员审核通过(approved)后对外展示
export function uploadAvatar(avatar: string) {
  if (USE_MOCK) return mock.mockUploadAvatar(avatar) as any;
  return api.post('/auth/avatar', { avatar }) as Promise<{
    code: number;
    data: { avatarUrl: string; avatarStatus: string };
  }>;
}

export interface UserProfile {
  userId: number;
  username: string;
  avatarUrl: string;
  avatarStatus: string;
  email: string;
  phone: string;
}

// 获取当前账号资料（含邮箱/电话，展示时由前端脱敏）
export function fetchProfile() {
  if (USE_MOCK) return mock.mockGetProfile() as any;
  return api.get('/auth/me') as Promise<{ code: number; data: UserProfile }>;
}

// 更新邮箱/电话
export function updateProfile(data: { email?: string; phone?: string }) {
  if (USE_MOCK) return mock.mockUpdateProfile(data) as any;
  return api.post('/auth/profile', data) as Promise<{ code: number; message: string }>;
}

// 修改自己的密码（需校验原密码）
export function changePassword(data: { oldPassword: string; newPassword: string }) {
  if (USE_MOCK) return mock.mockChangePassword(data) as any;
  return api.post('/auth/password', data) as Promise<{ code: number; message: string }>;
}

export interface AdminUser {
  id: number;
  username: string;
  role: string;
  avatarStatus: string;
  email: string;
  phone: string;
  taskCount: number;
  createdAt: string;
}

// 注：以下 admin 接口均经 AdminFilter（RBAC，仅 role='admin' 可访问）保护；
// USE_MOCK 时走前端内存模拟，否则走 axios 实例（自动附带 Bearer token）。

export interface PendingAvatar {
  id: number;
  username: string;
  avatarUrl: string;
  avatarStatus: string;
}

export interface PendingTask {
  id: number;
  userId: number;
  username: string;
  title: string;
  topic: string;
  priority: number;
  createdAt: string;
}

export interface ReviewNotice {
  id: number;
  kind: 'avatar' | 'task';
  refId: number;
  title: string;
  action: 'approved' | 'rejected';
  createdAt: string;
}

// 管理员：用户列表
export function fetchAdminUsers() {
  if (USE_MOCK) return mock.mockAdminUsers() as any;
  return api.get('/admin/users') as Promise<{ code: number; data: AdminUser[] }>;
}

// 管理员：待审核头像列表
export function fetchPendingAvatars() {
  if (USE_MOCK) return mock.mockPendingAvatars() as any;
  return api.get('/admin/avatars') as Promise<{ code: number; data: PendingAvatar[] }>;
}

// 管理员：审核头像（approved / rejected）
export function reviewAvatar(userId: number, action: 'approved' | 'rejected') {
  if (USE_MOCK) return mock.mockReviewAvatar(userId, action) as any;
  return api.post('/admin/avatars/review', { userId, action }) as Promise<{ code: number; message: string }>;
}

// 管理员：待审核任务列表（普通用户当日新增超过 30 个后的部分）
export function fetchPendingTasks() {
  if (USE_MOCK) return mock.mockPendingTasks() as any;
  return api.get('/admin/tasks/pending') as Promise<{ code: number; data: PendingTask[] }>;
}

// 管理员：审核任务（approved / rejected）
export function reviewTask(taskId: number, action: 'approved' | 'rejected') {
  if (USE_MOCK) return mock.mockReviewTask(taskId, action) as any;
  return api.post('/admin/tasks/review', { taskId, action }) as Promise<{ code: number; message: string }>;
}

// 管理员：注销用户（可注销普通用户与自己，不能注销其他管理员）
export function deleteUser(userId: number) {
  if (USE_MOCK) return mock.mockDeleteUser(userId) as any;
  return api.delete(`/admin/users/${userId}`) as Promise<{ code: number; data: { self: boolean }; message?: string }>;
}

// 管理员：将普通用户密码重置为固定初始口令 "1111"（不能重置管理员账号）
export function resetUserPassword(userId: number) {
  if (USE_MOCK) return mock.mockResetPassword(userId) as any;
  return api.post(`/admin/users/${userId}/reset-password`) as Promise<{ code: number; message: string }>;
}

// 当前用户：当日已新增任务数（用于判断再次创建是否需管理员审核）
export function fetchTodayTaskCount() {
  if (USE_MOCK) return mock.mockTodayTaskCount() as any;
  return api.get('/tasks/today-count') as Promise<{ code: number; data: { count: number } }>;
}

// 当前用户：未读审核结果通知（登录后弹出）
export function fetchNotices() {
  if (USE_MOCK) return mock.mockGetNotices() as any;
  return api.get('/auth/notices') as Promise<{ code: number; data: ReviewNotice[] }>;
}

// 当前用户：标记全部审核结果通知为已读
export function markNoticesSeen() {
  if (USE_MOCK) return mock.mockMarkNoticesSeen() as any;
  return api.post('/auth/notices/seen') as Promise<{ code: number; message: string }>;
}

export default api;
