// 自定义 Hook：封装打卡记录的加载、打卡操作与今日已打卡集合，供打卡页面等复用。
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { fetchClockRecords, clockIn, ClockRecord } from '../services/api';
import { extractErrorMessage } from '../utils/response';

export function useClockRecords() {
  const [records, setRecords] = useState<ClockRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (params?: { taskId?: number; date?: string }) => {
    setLoading(true);
    try {
      const res = await fetchClockRecords(params);
      const err = extractErrorMessage(res);
      if (err) { message.error(err); return; }
      setRecords(res.data);
    } catch (e: any) {
      message.error(e?.message || '加载打卡记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    load({ date: today });
  }, [load]);

  const checkIn = useCallback(async (taskId: number) => {
    try {
      const res = await clockIn(taskId);
      const err = extractErrorMessage(res);
      if (err) throw new Error(err);   // 如 409 重复打卡 → 转成异常
      // 【注意】打卡后要重新拉"全部"记录，而不是只拉当天。
      // 因为日历热力图要展示整个月的打卡情况；若只拉 today，
      // records 会被过滤成仅当天，导致其它日期的绿点消失。
      await load();
    } catch (e: any) {
      message.error(e?.message || '打卡失败');
      throw e;                          // 继续抛出，让页面知道失败（不弹成功）
    }
  }, [load]);

  const todayRecords = records;
  const checkedInTaskIds = new Set(todayRecords.map((r) => r.taskId));

  return { records, todayRecords, checkedInTaskIds, loading, load, checkIn };
}
