import { Card, Tag, Typography, Space, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Task } from '../services/api';
import { getPriorityLabel, getPriorityColor, getPriorityBorderColor } from '../utils/priorityHelper';
import { formatDate, isOverdue } from '../utils/dateHelper';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface Props {
  task: Task;
  onComplete?: (id: number) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: number) => void;
}

export default function TaskCard({ task, onComplete, onEdit, onDelete }: Props) {
  const overdue = !task.completed && isOverdue(task.deadline);
  const deadlineNear =
    !task.completed &&
    task.deadline &&
    dayjs(task.deadline).diff(dayjs(), 'hour') < 24 &&
    dayjs(task.deadline).isAfter(dayjs());

  return (
    <Card
      size="small"
      style={{
        // 左边框按"优先级"上色，让优先级用颜色一眼可辨
        // （逾期/即将到期仍由下方"已逾期/即将到期"标签表示，不冲突）
        borderLeft: `4px solid ${getPriorityBorderColor(task.priority)}`,
        opacity: task.completed ? 0.65 : 1,
      }}
      actions={[
        onComplete && !task.completed ? (
          <Tooltip title="标记完成" key="complete">
            <CheckCircleOutlined onClick={() => onComplete(task.id)} />
          </Tooltip>
        ) : null,
        onEdit ? (
          <Tooltip title="编辑" key="edit">
            <EditOutlined onClick={() => onEdit(task)} />
          </Tooltip>
        ) : null,
        onDelete ? (
          <Tooltip title="删除" key="delete">
            <DeleteOutlined onClick={() => onDelete(task.id)} />
          </Tooltip>
        ) : null,
      ].filter(Boolean)}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={2}>
        <Space wrap>
          <Text strong delete={task.completed}>
            {task.title}
          </Text>
          {task.completed && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
          {overdue && <Tag color="red">已逾期</Tag>}
          {deadlineNear && <Tag color="orange">即将到期</Tag>}
        </Space>
        {task.description && (
          <Paragraph
            type="secondary"
            // 【antd 特性：ellipsis.tooltip】
            // 当描述被省略成一行时，鼠标悬停会自动弹出一个小窗显示完整文本，
            // 而不是把描述做成可点的按钮。tooltip 设为完整文本即可。
            ellipsis={{ rows: 1, tooltip: task.description }}
            style={{ marginBottom: 0 }}
          >
            {task.description}
          </Paragraph>
        )}
        <Space size={4} wrap>
          <Tag>{task.topic || '未分类'}</Tag>
          <Tag color={getPriorityColor(task.priority)}>{getPriorityLabel(task.priority)}</Tag>
          <Tag icon={<ClockCircleOutlined />} color={overdue ? 'red' : 'default'}>
            {task.deadline ? formatDate(task.deadline) : '无截止时间'}
          </Tag>
          {task.source === 'system' && <Tag color="purple">推荐</Tag>}
        </Space>
      </Space>
    </Card>
  );
}
