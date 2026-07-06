import { useEffect, useState } from 'react';
import { Row, Col, Button, List, Tag, message, Spin } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { fetchTasks, Task } from '../services/api';
import { useClockRecords } from '../hooks/useClockRecords';
import CalendarHeatmap from '../components/CalendarHeatmap';

export default function ClockIn() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const { todayRecords, checkedInTaskIds, loading, checkIn } = useClockRecords();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchTasks();
        setTasks(res.data);
      } finally {
        setTasksLoading(false);
      }
    })();
  }, []);

  const handleCheckIn = async (taskId: number) => {
    try {
      await checkIn(taskId);
      message.success('打卡成功！');
    } catch {
      message.error('打卡失败');
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={14}>
        <Spin spinning={tasksLoading || loading}>
          <List
            header={<strong>今日待打卡任务</strong>}
            dataSource={pendingTasks}
            locale={{ emptyText: '所有任务已完成，太棒了！' }}
            renderItem={(task) => {
              const checked = checkedInTaskIds.has(task.id);
              return (
                <List.Item
                  actions={[
                    <Button
                      type={checked ? 'default' : 'primary'}
                      icon={<CheckCircleOutlined />}
                      disabled={checked}
                      onClick={() => handleCheckIn(task.id)}
                    >
                      {checked ? '已打卡' : '打卡'}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        {task.title}
                        {checked && <Tag color="green" style={{ marginLeft: 8 }}>今日已打卡</Tag>}
                      </span>
                    }
                    description={`主题: ${task.topic || '未分类'}`}
                  />
                </List.Item>
              );
            }}
          />
        </Spin>
      </Col>
      <Col xs={24} md={10}>
        <CalendarHeatmap records={todayRecords} />
      </Col>
    </Row>
  );
}
