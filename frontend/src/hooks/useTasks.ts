import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  fetchSystemTasks,
  Task,
  TaskForm,
} from '../services/api';
import { extractErrorMessage } from '../utils/response';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [systemTasks, setSystemTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const res = await fetchTasks(params);
      const err = extractErrorMessage(res);
      if (err) { message.error(err); return; }   // 后端返回了失败码
      setTasks(res.data);
    } catch (e: any) {
      // 网络错误 / 接口挂了：axios 会在这里抛异常
      message.error(e?.message || '加载任务失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadSystemTasks = useCallback(async () => {
    try {
      const res = await fetchSystemTasks();
      const err = extractErrorMessage(res);
      if (err) { message.error(err); return; }
      setSystemTasks(res.data);
    } catch (e: any) {
      message.error(e?.message || '加载推荐任务失败');
    }
  }, []);

  // 【React 概念：把"可能失败的操作"封装成统一模式】
  // 每个写操作都遵守同一套路：
  //   1. 调接口
  //   2. 业务失败(code!==0) → 转成异常 throw（让 call 方的 await 中断）
  //   3. catch 里弹一次友好错误，然后"继续抛出"——这样调用方知道失败了
  //      （不会误弹"成功"，也不会执行后续逻辑）
  const add = useCallback(async (data: TaskForm) => {
    try {
      const res = await createTask(data);
      const err = extractErrorMessage(res);
      if (err) throw new Error(err);   // 业务错误 → 抛异常，交给下方 catch 提示
      await load();
    } catch (e: any) {
      message.error(e?.message || '创建任务失败');
      throw e;                          // 继续抛出，阻止调用方弹"成功"
    }
  }, [load]);

  const edit = useCallback(async (id: number, data: Partial<TaskForm & { completed: boolean }>) => {
    try {
      const res = await updateTask(id, data);
      const err = extractErrorMessage(res);
      if (err) throw new Error(err);
      await load();
    } catch (e: any) {
      message.error(e?.message || '更新任务失败');
      throw e;
    }
  }, [load]);

  const remove = useCallback(async (id: number) => {
    try {
      const res = await deleteTask(id);
      const err = extractErrorMessage(res);
      if (err) throw new Error(err);
      await load();
    } catch (e: any) {
      message.error(e?.message || '删除任务失败');
      throw e;
    }
  }, [load]);

  const done = useCallback(async (id: number) => {
    try {
      const res = await completeTask(id);
      const err = extractErrorMessage(res);
      if (err) throw new Error(err);
      await load();
    } catch (e: any) {
      message.error(e?.message || '完成任务失败');
      throw e;
    }
  }, [load]);

  return { tasks, systemTasks, loading, load, loadSystemTasks, add, edit, remove, done };
}
