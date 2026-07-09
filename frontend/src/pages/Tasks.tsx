import { useEffect, useState, useMemo } from 'react';
import {
  Row, Col, Button, Modal, Form, Input, Select, DatePicker, Switch, Space, message, Spin, Tooltip,
} from 'antd';
import { PlusOutlined, ReloadOutlined, BulbOutlined, FilterOutlined } from '@ant-design/icons';
import { Task, TaskForm } from '../services/api';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import dayjs from 'dayjs';

export default function Tasks() {
  const { tasks, systemTasks, loading, load, loadSystemTasks, add, edit, remove, done } = useTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<number | undefined>(undefined);
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterCompleted, setFilterCompleted] = useState<string>('');

  const topics = useMemo(() => {
    const s = new Set(tasks.map((t) => t.topic).filter(Boolean));
    return Array.from(s);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterTopic && t.topic !== filterTopic) return false;
      if (filterPriority !== undefined && t.priority !== filterPriority) return false;
      if (filterSource && t.source !== filterSource) return false;
      if (filterCompleted === 'true' && !t.completed) return false;
      if (filterCompleted === 'false' && t.completed) return false;
      return true;
    });
  }, [tasks, filterTopic, filterPriority, filterSource, filterCompleted]);

  const applyFilters = () => {
    const params: Record<string, string> = {};
    if (filterTopic) params.topic = filterTopic;
    if (filterPriority !== undefined) params.priority = String(filterPriority);
    if (filterSource) params.source = filterSource;
    if (filterCompleted) params.completed = filterCompleted;
    load(params);
  };

  useEffect(() => { loadSystemTasks(); }, [loadSystemTasks]);

  const openCreate = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ priority: 1, source: 'custom' });
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      topic: task.topic,
      priority: task.priority,
      needReviewReminder: task.needReviewReminder,
      deadline: task.deadline ? dayjs(task.deadline) : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data: TaskForm = {
      ...values,
      deadline: values.deadline ? values.deadline.toISOString() : undefined,
    };
    if (editingTask) {
      await edit(editingTask.id, data);
      message.success('任务已更新');
    } else {
      await add(data);
      message.success('任务已创建');
    }
    setModalOpen(false);
  };

  const addSystemTask = async (t: Task) => {
    await add({
      title: t.title,
      topic: t.topic,
      priority: t.priority,
      description: t.description,
      source: 'system',
    });
    message.success(`已添加推荐任务: ${t.title}`);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建任务</Button>
        <Button icon={<ReloadOutlined />} onClick={() => { setFilterTopic(''); setFilterPriority(undefined); setFilterSource(''); setFilterCompleted(''); load(); }}>刷新</Button>
        <Button icon={<BulbOutlined />} onClick={loadSystemTasks}>加载系统推荐</Button>
      </Space>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="主题筛选"
          style={{ width: 130 }}
          value={filterTopic || undefined}
          onChange={(v) => setFilterTopic(v || '')}
        >
          {topics.map((t) => (
            <Select.Option key={t} value={t}>{t}</Select.Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="优先级筛选"
          style={{ width: 130 }}
          value={filterPriority}
          onChange={(v) => setFilterPriority(v)}
        >
          <Select.Option value={0}>低</Select.Option>
          <Select.Option value={1}>中</Select.Option>
          <Select.Option value={2}>高</Select.Option>
          <Select.Option value={3}>紧急</Select.Option>
        </Select>
        <Select
          allowClear
          placeholder="来源筛选"
          style={{ width: 130 }}
          value={filterSource || undefined}
          onChange={(v) => setFilterSource(v || '')}
        >
          <Select.Option value="custom">自定义</Select.Option>
          <Select.Option value="system">系统推荐</Select.Option>
        </Select>
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 130 }}
          value={filterCompleted || undefined}
          onChange={(v) => setFilterCompleted(v || '')}
        >
          <Select.Option value="false">未完成</Select.Option>
          <Select.Option value="true">已完成</Select.Option>
        </Select>
        <Button icon={<FilterOutlined />} onClick={applyFilters}>筛选</Button>
      </Space>

      {systemTasks.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[8, 8]}>
            {systemTasks.map((t) => (
              <Col key={t.id}>
                <Tooltip title={`主题: ${t.topic}`}>
                  <Button size="small" type="dashed" onClick={() => addSystemTask(t)}>
                    + {t.title}
                  </Button>
                </Tooltip>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {loading ? (
        <Spin style={{ display: 'block', marginTop: 60 }} />
      ) : filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>暂无匹配任务，点击上方按钮创建或调整筛选条件</div>
      ) : (
        <Row gutter={[12, 12]}>
          {filteredTasks.map((t) => (
            <Col key={t.id} xs={24} sm={12} lg={8} xl={6}>
              <TaskCard task={t} onComplete={done} onEdit={openEdit} onDelete={remove} />
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="topic" label="主题">
            <Input placeholder="如：编程、英语、数学" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select>
              <Select.Option value={0}>低</Select.Option>
              <Select.Option value={1}>中</Select.Option>
              <Select.Option value={2}>高</Select.Option>
              <Select.Option value={3}>紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="deadline" label="截止时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="needReviewReminder" label="复习提醒" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
