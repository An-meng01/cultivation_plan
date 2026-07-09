import { useState, useEffect, useCallback } from 'react';
import { fetchClockRecords, clockIn, ClockRecord } from '../services/api';
import dayjs from 'dayjs';

export function useClockRecords() {
  const [records, setRecords] = useState<ClockRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (params?: { taskId?: number; date?: string }) => {
    setLoading(true);
    try {
      const res = await fetchClockRecords(params);
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    load({ date: today });
  }, [load]);

  const checkIn = useCallback(async (taskId: number) => {
    await clockIn(taskId);
    const today = dayjs().format('YYYY-MM-DD');
    await load({ date: today });
  }, [load]);

  const todayRecords = records;
  const checkedInTaskIds = new Set(todayRecords.map((r) => r.taskId));

  return { records, todayRecords, checkedInTaskIds, loading, load, checkIn };
}
