import { useEffect, useState } from 'react';
import { Row, Col, Statistic, Card, Spin, message } from 'antd';
import {
  CheckCircleOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { fetchAnalysisOverview, fetchDailyStats, AnalysisOverview, DailyStat } from '../services/api';
import ProgressBarView from '../components/ProgressBar';
import { DailyTrendChart, TopicPieChart } from '../components/StatisticsChart';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [overview, setOverview] = useState<AnalysisOverview | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, ds] = await Promise.all([
          fetchAnalysisOverview(),
          fetchDailyStats(
            dayjs().startOf('month').format('YYYY-MM-DD'),
            dayjs().format('YYYY-MM-DD'),
          ),
        ]);
        setOverview(ov.data);
        setDailyStats(ds.data);
      } catch {
        message.error('加载仪表盘数据失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !overview) return <Spin size="large" style={{ display: 'block', marginTop: 120 }} />;

  const topicPieData = Object.entries(overview.topicDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const topicStats = Object.entries(overview.topicDistribution).map(([topic, total]) => ({
    topic,
    total,
    completed: Math.round(total * (overview.topicCompletionRate[topic] ?? 0) / 100),
  }));

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="总任务" value={overview.totalTasks} prefix={<UnorderedListOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="已完成" value={overview.completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="待完成" value={overview.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="完成率" value={overview.completionRate} suffix="%" prefix={<PercentageOutlined />} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <ProgressBarView
            totalTasks={overview.totalTasks}
            completedTasks={overview.completed}
            topicStats={topicStats}
          />
        </Col>
        <Col xs={24} md={16}>
          <DailyTrendChart data={dailyStats} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <TopicPieChart data={topicPieData} />
        </Col>
      </Row>
    </div>
  );
}
