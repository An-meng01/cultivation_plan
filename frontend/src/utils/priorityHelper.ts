export const PRIORITY_LABELS: Record<number, string> = {
  0: '低',
  1: '中',
  2: '高',
  3: '紧急',
};

export const PRIORITY_COLORS: Record<number, string> = {
  0: 'green',
  1: 'blue',
  2: 'orange',
  3: 'red',
};

export function getPriorityLabel(p: number): string {
  return PRIORITY_LABELS[p] ?? '未知';
}

export function getPriorityColor(p: number): string {
  return PRIORITY_COLORS[p] ?? 'default';
}
