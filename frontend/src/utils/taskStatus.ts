import dayjs from 'dayjs';
import { Task, ClockRecord, IntervalUnit } from '../services/api';

export function addInterval(base: dayjs.Dayjs, value: number, unit: IntervalUnit) {
  return base.add(value, unit);
}

export function getIntervalUnitLabel(u?: IntervalUnit): string {
  if (u === 'week') return '周';
  if (u === 'month') return '月';
  return '天';
}

export function getTypeLabel(task: Task): string {
  if (task.type === 'daily') return '每天打卡';
  if (task.type === 'periodic' && task.intervalValue && task.intervalUnit) {
    return `每${task.intervalValue}${getIntervalUnitLabel(task.intervalUnit)}`;
  }
  return '一次性';
}

export function getNextDue(task: Task): dayjs.Dayjs | null {
  if (task.type === 'periodic' && task.intervalValue && task.intervalUnit) {
    const base = task.lastCheckIn ? dayjs(task.lastCheckIn) : dayjs(task.createdAt);
    return addInterval(base, task.intervalValue, task.intervalUnit);
  }
  if (task.type === 'once') {
    return task.deadline ? dayjs(task.deadline) : null;
  }
  return null;
}

// 判断某任务在当前周期/今天是否已经打过卡
function isCheckedInCurrentCycle(task: Task, records: ClockRecord[]): boolean {
  const recs = records.filter((r) => r.taskId === task.id);
  if (task.type === 'daily') {
    const today = dayjs().format('YYYY-MM-DD');
    return recs.some((r) => dayjs(r.checkInTime).format('YYYY-MM-DD') === today);
  }
  if (task.type === 'periodic') {
    const start = task.lastCheckIn ? dayjs(task.lastCheckIn) : dayjs(task.createdAt);
    return recs.some((r) => dayjs(r.checkInTime).isSame(start) || dayjs(r.checkInTime).isAfter(start));
  }
  return task.completed;
}

export interface CheckInStatus {
  needsCheckIn: boolean;
  checkedIn: boolean;
  overdue: boolean;
  nextDue: string | null;
  typeLabel: string;
}

export function getCheckInStatus(task: Task, records: ClockRecord[]): CheckInStatus {
  if (task.completed) {
    return { needsCheckIn: false, checkedIn: true, overdue: false, nextDue: null, typeLabel: getTypeLabel(task) };
  }
  const checked = isCheckedInCurrentCycle(task, records);
  const nextDue = getNextDue(task);
  const today = dayjs();
  let needsCheckIn = false;
  let overdue = false;

  if (task.type === 'once') {
    needsCheckIn = !task.completed;
    overdue = !!task.deadline && dayjs(task.deadline).isBefore(today);
  } else if (task.type === 'daily') {
    needsCheckIn = !checked;
  } else {
    const due = nextDue ? !nextDue.isAfter(today) : true;
    needsCheckIn = !checked && due;
    overdue = !!nextDue && nextDue.isBefore(today);
  }

  return {
    needsCheckIn,
    checkedIn: checked,
    overdue,
    nextDue: nextDue ? nextDue.format('YYYY-MM-DD') : null,
    typeLabel: getTypeLabel(task),
  };
}
