// 我的 > 成就：展示学习成果统计（完成任务数、累计打卡次数、完成率等）。
import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, theme } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, PercentageOutlined } from '@ant-design/icons';
import { fetchAnalysisOverview, fetchClockRecords, AnalysisOverview, ClockRecord } from '../services/api';
import { notifyError } from '../utils/response';

export default function Achievements() {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalysisOverview | null>(null);
  const [records, setRecords] = useState<ClockRecord[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [ov, rec] = await Promise.all([fetchAnalysisOverview(), fetchClockRecords()]);
        setOverview(ov.data);
        setRecords(rec.data);
      } catch {
        notifyError('加载成就数据失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 120 }} />;

  const totalCheckIns = records.length;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: token.colorText }}>成就</h2>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card><Statistic title="已完成任务" value={overview?.completed ?? 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="累计打卡" value={totalCheckIns} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="总完成率" value={overview?.completionRate ?? 0} suffix="%" precision={2} prefix={<PercentageOutlined />} /></Card>
        </Col>
      </Row>
    </div>
  );
}
