// 日期工具函数：提供日期格式化与是否逾期判断的通用辅助方法。
import dayjs from 'dayjs';

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('MM-DD');
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return dayjs(dateStr).isBefore(dayjs());
}
