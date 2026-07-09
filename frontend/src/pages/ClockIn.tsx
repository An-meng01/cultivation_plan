// 打卡签到页面：列出待打卡任务并提供打卡按钮，同时展示当月打卡日历热力图。
import { useEffect, useState } from 'react';
import { Row, Col, Button, List, Tag, message, Spin } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { fetchTasks, Task } from '../services/api';
import { getCheckInStatus } from '../utils/taskStatus';
import { useClockRecords } from '../hooks/useClockRecords';
import CalendarHeatmap from '../components/CalendarHeatmap';
import CheckInSuccess from '../components/CheckInSuccess';

export default function ClockIn() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  // 控制庆祝特效：存"刚打卡成功的任务标题"，为空则不显示
  const [successTitle, setSuccessTitle] = useState<string | null>(null);
  const { todayRecords, loading, checkIn } = useClockRecords();

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

  const handleCheckIn = async (taskId: number, taskTitle: string) => {
    try {
      await checkIn(taskId);
      // 用炫酷特效替代朴素 toast；失败时仍用 message.error 提示
      setSuccessTitle(taskTitle);
    } catch {
      message.error('打卡失败');
    }
  };

  const pendingTasks = tasks.filter((t) => getCheckInStatus(t, todayRecords).needsCheckIn);

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Spin spinning={tasksLoading || loading}>
            <List
              style={{ paddingLeft: 8 }}
              header={<strong>待打卡任务</strong>}
              dataSource={pendingTasks}
              locale={{ emptyText: '没有需要打卡的任务，太棒了！' }}
              renderItem={(task) => {
                const status = getCheckInStatus(task, todayRecords);
                const checked = status.checkedIn;
                return (
                  <List.Item
                    actions={[
                      <Button
                        type={checked ? 'default' : 'primary'}
                        icon={<CheckCircleOutlined />}
                        disabled={checked}
                        onClick={() => handleCheckIn(task.id, task.title)}
                      >
                        {checked ? (task.type === 'once' ? '已完成' : '已打卡') : '打卡'}
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          {task.title}
                          {checked && <Tag color="green" style={{ marginLeft: 8 }}>{task.type === 'once' ? '已完成' : '已打卡'}</Tag>}
                          {status.overdue && <Tag color="red" style={{ marginLeft: 8 }}>已逾期</Tag>}
                        </span>
                      }
                      description={
                        <span>
                          {`主题: ${task.topic || '未分类'}`}
                          {status.nextDue && ` · 下次: ${status.nextDue}`}
                          {` · ${status.typeLabel}`}
                        </span>
                      }
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
      {/* 打卡成功庆祝特效：successTitle 有值才渲染，组件内部 1.8s 后自动关闭 */}
    <CheckInSuccess
      open={successTitle !== null}
      subTitle={successTitle ?? undefined}
      onClose={() => setSuccessTitle(null)}
    />
    </>
  );
}
