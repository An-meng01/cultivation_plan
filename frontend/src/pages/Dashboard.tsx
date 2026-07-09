// 仪表盘首页：展示任务总览统计、学习进度条、每日趋势图与主题分布饼图。
import { useEffect, useState } from 'react';
import { Row, Col, Statistic, Card, Spin, message, theme } from 'antd';
import {
  CheckCircleOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { fetchAnalysisOverview, fetchDailyStats, AnalysisOverview, DailyStat } from '../services/api';
import ProgressBarView from '../components/ProgressBar';
import { DailyTrendChart, TopicPieChart } from '../components/StatisticsChart';
import Mascot from '../components/Mascot';
import dayjs from 'dayjs';

export default function Dashboard() {
  const { token } = theme.useToken();
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
      <Row gutter={[16, 16]} style={{ marginBottom: 16, alignItems: 'center' }}>
        <Col flex="none">
          <Mascot size={108} />
        </Col>
        <Col flex="auto">
          <div style={{ fontSize: 20, fontWeight: 700, color: token.colorText }}>嗨，今天也要元气满满 🌱</div>
          <div style={{ color: token.colorTextSecondary, marginTop: 4 }}>
            共 {overview.totalTasks} 个任务，已完成 {overview.completed} 个，完成率 {overview.completionRate}%
          </div>
        </Col>
      </Row>

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
