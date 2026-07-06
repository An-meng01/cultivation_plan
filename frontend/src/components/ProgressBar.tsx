import { Progress, Card, Typography, Space } from 'antd';

interface TopicProgress {
  topic: string;
  completed: number;
  total: number;
}

interface Props {
  totalTasks: number;
  completedTasks: number;
  topicStats?: TopicProgress[];
}

export default function ProgressBarView({ totalTasks, completedTasks, topicStats }: Props) {
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card title="学习进度" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Typography.Text strong>
            总进度: {completedTasks} / {totalTasks}
          </Typography.Text>
          <Progress percent={pct} status={pct === 100 ? 'success' : 'active'} />
        </div>
        {topicStats?.map((s) => {
          const tp = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
          return (
            <div key={s.topic}>
              <Typography.Text type="secondary">{s.topic}</Typography.Text>
              <Progress
                percent={tp}
                size="small"
                format={() => `${s.completed}/${s.total}`}
              />
            </div>
          );
        })}
      </Space>
    </Card>
  );
}
