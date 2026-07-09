// 统计图表组件集：基于 recharts 提供每日趋势折线图、每日完成情况柱状图与主题分布饼图。
import { Card } from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DailyStat } from '../services/api';

const COLORS = ['#52c41a', '#1890ff', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

interface LineProps {
  data: DailyStat[];
  title?: string;
}

export function DailyTrendChart({ data, title = '每日趋势' }: LineProps) {
  return (
    <Card title={title} size="small">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="added" stroke="#1890ff" name="新增" strokeWidth={2} />
          <Line type="monotone" dataKey="completed" stroke="#52c41a" name="完成" strokeWidth={2} />
          <Line type="monotone" dataKey="rate" stroke="#faad14" name="完成率 %" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface BarProps {
  data: DailyStat[];
  title?: string;
}

export function DailyBarChart({ data, title = '每日完成情况' }: BarProps) {
  return (
    <Card title={title} size="small">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="added" fill="#1890ff" name="新增" />
          <Bar dataKey="completed" fill="#52c41a" name="完成" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface PieProps {
  data: { name: string; value: number }[];
  title?: string;
}

export function TopicPieChart({ data, title = '主题分布' }: PieProps) {
  return (
    <Card title={title} size="small">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
