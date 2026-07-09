import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Statistic, Spin, message } from 'antd';
import { fetchAnalysisOverview, fetchDailyStats, AnalysisOverview, DailyStat } from '../services/api';
import { DailyTrendChart, DailyBarChart, TopicPieChart } from '../components/StatisticsChart';
import dayjs from 'dayjs';

export default function Analysis() {
  const [overview, setOverview] = useState<AnalysisOverview | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, ds] = await Promise.all([
          fetchAnalysisOverview(),
          fetchDailyStats(
            dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
            dayjs().format('YYYY-MM-DD'),
          ),
        ]);
        setOverview(ov.data);
        setDailyStats(ds.data);
      } catch {
        message.error('加载分析数据失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !overview) return <Spin size="large" style={{ display: 'block', marginTop: 120 }} />;

  const topicPieData = overview.topicDist.map((item) => ({
    name: item.topic,
    value: item.count,
  }));

  const topicColumns = [
    { title: '主题', dataIndex: 'topic', key: 'topic' },
    { title: '任务数', dataIndex: 'count', key: 'count' },
    { title: '完成率', dataIndex: 'rate', key: 'rate', render: (v: number) => `${v.toFixed(1)}%` },
  ];

  const topicTableData = overview.topicDist.map((dist) => {
    const rateItem = overview.topicRate.find((r) => r.topic === dist.topic);
    return { key: dist.topic, topic: dist.topic, count: dist.count, rate: rateItem?.rate ?? 0 };
  });

  const dailyColumns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '新增', dataIndex: 'added', key: 'added' },
    { title: '完成', dataIndex: 'completed', key: 'completed' },
    {
      title: '完成率',
      dataIndex: 'rate',
      key: 'rate',
      render: (v: number) => `${v.toFixed(1)}%`,
      sorter: (a: DailyStat, b: DailyStat) => a.rate - b.rate,
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="总任务" value={overview.totalTasks} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="已完成" value={overview.completed} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="待完成" value={overview.pending} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="完成率" value={overview.completionRate} suffix="%" precision={1} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <DailyTrendChart data={dailyStats} />
        </Col>
        <Col xs={24} lg={12}>
          <DailyBarChart data={dailyStats} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <TopicPieChart data={topicPieData} />
        </Col>
        <Col xs={24} lg={14}>
          <Card title="主题完成率" size="small">
            <Table dataSource={topicTableData} columns={topicColumns} pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="近 30 天每日明细" size="small">
            <Table dataSource={dailyStats} columns={dailyColumns} pagination={false} size="small" rowKey="date" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
