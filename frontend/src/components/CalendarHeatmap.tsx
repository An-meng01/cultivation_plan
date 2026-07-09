// 用到的 React 钩子要从 'react' 引入；Ant Design 的 Button/Space 用来做切换按钮
import { Card, Typography, Button, Space, theme } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';

interface Props {
  records: { checkInTime: string }[];
  year?: number;
  month?: number;
}

export default function CalendarHeatmap({ records, year, month }: Props) {
  // 【React 概念：useState —— 组件自己的"记忆"】
  // useState(初始值) 返回一个数组 [当前值, 修改函数]。
  // 调用修改函数（setViewDate）后，React 会让这个组件"重新渲染"，
  // 界面上所有用到 viewDate 的地方都会自动更新（这就是"状态驱动 UI"）。
  // 初始值用函数写法 () => ...，只在【第一次渲染】时执行一次。
  // 这里存一个 dayjs 对象代表"正在查看的月份"（统一取每月 1 号），
  // 是为了后面做"上个月/下个月"时，直接 .subtract(1,'month') / .add(1,'month') 很方便。
  const [viewDate, setViewDate] = useState(() =>
    year && month ? dayjs(`${year}-${month}-01`) : dayjs().date(1),
  );

  // 取当前主题的设计变量：暗色下 colorFillSecondary 是深灰、colorText 是浅色，
  // 用它代替写死的 '#f5f5f5' / '#000'，空格在明暗两种主题下都好看。
  const { token } = theme.useToken();

  // 从状态里拿出"年/月"。注意 m 要 +1，因为 dayjs 的 month() 是 0~11
  const y = viewDate.year();
  const m = viewDate.month() + 1;
  const daysInMonth = viewDate.daysInMonth();      // 这个月有多少天（28/29/30/31）
  const firstWeekday = viewDate.date(1).day();     // 1 号是星期几（0=周日）

  // 【React 概念：useMemo —— 缓存"算出来的值"】
  // 打卡日期集合需要遍历 records 来算。如果不缓存，每次渲染都重算一遍，浪费。
  // useMemo(计算函数, 依赖数组)：只有当依赖 [records, y, m] 变化时才重新计算，
  // 否则直接复用上一次的结果。
  const checkinDays = useMemo(() => {
    const s = new Set<number>();
    for (const r of records) {
      const d = dayjs(r.checkInTime);
      // 只收集"和当前查看月份相同"的打卡日
      if (d.year() === y && d.month() + 1 === m) {
        s.add(d.date());
      }
    }
    return s;
  }, [records, y, m]);

  // 把一个月的每一天变成 {day, checked} 数组，checked=true 表示那天打过卡
  const cells: { day: number; checked: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, checked: checkinDays.has(d) });
  }

  // 【React 概念：事件处理函数 + 修改状态】
  // 箭头函数 goPrev/goNext 在按钮被点击（onClick）时执行，
  // 它们调用 setViewDate 修改状态 —— React 随即重新渲染，上面的 y/m/格子全部按新月份重算。
  // 注意：要基于"当前状态"产生新状态，直接用 viewDate.subtract 即可（dayjs 返回新对象，不修改原值）。
  const goPrev = () => setViewDate(viewDate.subtract(1, 'month'));
  const goNext = () => setViewDate(viewDate.add(1, 'month'));

  return (
    <Card
      // 【React 概念：JSX 中写 JS 表达式要用 {} 包裹】
      // Card 的 title 可以放任意 React 节点（不止字符串）。这里放一个 Space 横排：左箭头 + 文字 + 右箭头。
      // onClick={goPrev} 就是把"点击"这个事件，绑定到我们上面定义的 goPrev 函数。
      title={
        <Space>
          <Button size="small" icon={<LeftOutlined />} onClick={goPrev} />
          <span>{y} 年 {m} 月 打卡日历</span>
          <Button size="small" icon={<RightOutlined />} onClick={goNext} />
        </Space>
      }
      size="small"
    >
      <div style={{ textAlign: 'center' }}>
        {/* 星期表头 + 日期格子，和之前一样，只是现在按 viewDate 算出来的 y/m 渲染 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, maxWidth: 320, margin: '0 auto' }}>
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
            <div key={w} style={{ fontWeight: 600, fontSize: 12, padding: 4 }}>{w}</div>
          ))}
          {/* 1 号前面的空格占位，让日期从第几列开始对齐星期 */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {cells.map((c) => (
            <div
              key={c.day}
              style={{
                padding: 6,
                borderRadius: 4,
                fontSize: 13,
                backgroundColor: c.checked ? '#52c41a' : token.colorFillSecondary,
                color: c.checked ? '#fff' : token.colorText,
                fontWeight: c.checked ? 700 : 400,
              }}
            >
              {c.day}
            </div>
          ))}
        </div>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          绿色标记表示已打卡
        </Typography.Text>
      </div>
    </Card>
  );
}
