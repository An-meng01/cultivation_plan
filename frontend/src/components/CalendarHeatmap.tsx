import { Card, Typography } from 'antd';
import { useMemo } from 'react';
import dayjs from 'dayjs';

interface Props {
  records: { checkInTime: string }[];
  year?: number;
  month?: number;
}

export default function CalendarHeatmap({ records, year, month }: Props) {
  const y = year ?? dayjs().year();
  const m = month ?? dayjs().month() + 1;
  const daysInMonth = dayjs(`${y}-${m}-01`).daysInMonth();
  const firstWeekday = dayjs(`${y}-${m}-01`).day();

  const checkinDays = useMemo(() => {
    const s = new Set<number>();
    for (const r of records) {
      const d = dayjs(r.checkInTime);
      if (d.year() === y && d.month() + 1 === m) {
        s.add(d.date());
      }
    }
    return s;
  }, [records, y, m]);

  const cells: { day: number; checked: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, checked: checkinDays.has(d) });
  }

  return (
    <Card title={`${y} 年 ${m} 月 打卡日历`} size="small">
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, maxWidth: 320, margin: '0 auto' }}>
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
            <div key={w} style={{ fontWeight: 600, fontSize: 12, padding: 4 }}>{w}</div>
          ))}
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
                backgroundColor: c.checked ? '#52c41a' : '#f5f5f5',
                color: c.checked ? '#fff' : '#000',
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
