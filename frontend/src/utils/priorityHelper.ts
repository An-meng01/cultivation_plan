// 优先级工具：定义优先级（低/中/高/紧急）对应的中文标签、标签色与边框色，并提供获取函数。
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

// 左边框用的十六进制色，与上面 antd 标签色保持一致（CSS 不能直接用 'blue' 这类名字）
export const PRIORITY_BORDER_COLORS: Record<number, string> = {
  0: '#52c41a', // 低 - 绿
  1: '#1677ff', // 中 - 蓝
  2: '#fa8c16', // 高 - 橙
  3: '#ff4d4f', // 紧急 - 红
};

export function getPriorityLabel(p: number): string {
  return PRIORITY_LABELS[p] ?? '未知';
}

export function getPriorityColor(p: number): string {
  return PRIORITY_COLORS[p] ?? 'default';
}

export function getPriorityBorderColor(p: number): string {
  return PRIORITY_BORDER_COLORS[p] ?? '#52c41a';
}
