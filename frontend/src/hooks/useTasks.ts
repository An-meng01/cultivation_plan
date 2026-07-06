import { useState, useEffect, useCallback } from 'react';
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

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [systemTasks, setSystemTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const res = await fetchTasks(params);
      setTasks(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadSystemTasks = useCallback(async () => {
    const res = await fetchSystemTasks();
    setSystemTasks(res.data);
  }, []);

  const add = useCallback(async (data: TaskForm) => {
    await createTask(data);
    await load();
  }, [load]);

  const edit = useCallback(async (id: number, data: Partial<TaskForm & { completed: boolean }>) => {
    await updateTask(id, data);
    await load();
  }, [load]);

  const remove = useCallback(async (id: number) => {
    await deleteTask(id);
    await load();
  }, [load]);

  const done = useCallback(async (id: number) => {
    await completeTask(id);
    await load();
  }, [load]);

  return { tasks, systemTasks, loading, load, loadSystemTasks, add, edit, remove, done };
}
