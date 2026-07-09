import { useState } from 'react';
import {
  Row, Col, Button, Modal, Form, Input, Select, DatePicker, Switch, InputNumber, Space, message, Spin, Tooltip, theme,
} from 'antd';
import { PlusOutlined, ReloadOutlined, BulbOutlined, CloseOutlined } from '@ant-design/icons';
import { Task, TaskForm } from '../services/api';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import CheckInSuccess from '../components/CheckInSuccess';
import dayjs from 'dayjs';

export default function Tasks() {
  const { tasks, systemTasks, loading, load, loadSystemTasks, add, edit, remove, done } = useTasks();
  // 【React 概念：useToken 取主题变量】暗色/亮色下背景与文字色自动适配，避免"白图标压浅灰底看不见"
  const { token } = theme.useToken();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const taskType = Form.useWatch('type', form);

  // 是否展开"系统推荐"面板 + 加载中的 loading 状态（只用于控制显示与按钮反馈）
  const [showSystem, setShowSystem] = useState(false);
  const [systemLoading, setSystemLoading] = useState(false);

  // 创建任务成功后的庆祝特效内容；为 null 时不显示
  const [createSuccess, setCreateSuccess] = useState<{ title: string; subTitle?: string; tip: string } | null>(null);

  // 【React 概念：用事件处理函数显式触发"加载推荐"】
  // 之前是在挂载时偷偷自动加载，点了按钮反而看不出效果。
  // 现在改成：点按钮 → 显示 loading → 真正去拉数据 → 展开面板，点击一定有可见反馈。
  const handleLoadSystem = async () => {
    setSystemLoading(true);
    try {
      await loadSystemTasks();   // 拉取推荐任务（结果存进 hook 的 systemTasks）
      setShowSystem(true);       // 拉到后展开推荐面板
    } finally {
      setSystemLoading(false);
    }
  };

  // 【React 概念：useState 存"筛选条件"】
  // 用一个对象把用户选中的筛选条件记下来（空字符串/undefined 表示"不限"）。
  // 注意这里用的是"普通对象状态"，和日历的 useState 是同一套路：改它就重渲染。
  const [filters, setFilters] = useState<{ topic?: string; priority?: string; completed?: string }>({});

  const openCreate = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ priority: 1, source: 'custom', type: 'once' });
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
      type: task.type,
      intervalValue: task.intervalValue,
      intervalUnit: task.intervalUnit,
      deadline: task.deadline ? dayjs(task.deadline) : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    // 【React 概念：用 try/catch 承接"可能失败"的异步操作】
    // add/edit 内部失败时会 throw，这里 catch 住即可——错误提示已经在 hook 里弹过了，
    // 所以这里什么都不用做，只保证：失败时不会继续执行成功提示、也不会关掉弹窗。
    try {
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
        // 创建成功 → 弹出庆祝特效，并提示指定文案
        setCreateSuccess({
          title: '创建成功！',
          subTitle: `「${data.title}」已加入你的任务列表`,
          tip: '自己创建的任务就要好好完成哦！！',
        });
      }
      setModalOpen(false);
    } catch {
      // 失败已在 useTasks 中通过 message.error 提示，这里仅阻止成功逻辑
    }
  };

  const addSystemTask = async (t: Task) => {
    try {
      await add({
        title: t.title,
        topic: t.topic,
        priority: t.priority,
        description: t.description,
      });
      // 同样是"创建任务"，复用同一个庆祝特效
      setCreateSuccess({
        title: '创建成功！',
        subTitle: `「${t.title}」已添加`,
        tip: '自己创建的任务就要好好完成哦！！',
      });
    } catch {
      // 失败已在 useTasks 中提示
    }
  };

  // 【React 概念：从已有 state 派生数据（不需要新 state）】
  // 主题没有固定选项，所以把当前 tasks 里的 topic 去重后当作下拉选项。
  // 用普通变量算即可——它不是"状态"，只是基于 state 算出来的展示数据，每次渲染现算现用。
  const topicOptions = Array.from(
    new Set(tasks.map((t) => t.topic).filter(Boolean)),
  );

  // 【React 概念：把"状态对象"翻译成"后端要的查询参数"】
  // 只把用户真正选了的条件塞进 params（空的不传），和 api.ts 的 fetchTasks 参数对齐。
  const buildParams = (f: typeof filters): Record<string, string> => {
    const p: Record<string, string> = {};
    if (f.topic) p.topic = f.topic;
    if (f.priority) p.priority = f.priority;
    if (f.completed) p.completed = f.completed; // 后端要 'true' / 'false' 字符串
    return p;
  };

  // 用户改任意一个下拉框时调用：先更新状态，再带着新条件重新拉数据
  const handleFilterChange = (patch: Partial<typeof filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    load(buildParams(next));
  };

  // 重置所有筛选：清空状态 + 重新拉全部
  const resetFilters = () => {
    setFilters({});
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 筛选栏：三个受控 Select + 重置按钮 */}
        <Space wrap>
          {/* 【React 概念：受控组件】Select 的 value 来自 state，onChange 把用户选择写回 state。
              这样"界面显示什么"永远由 state 决定，数据和视图是单一来源的。 */}
          <Select
            placeholder="按主题筛选"
            allowClear
            style={{ width: 160 }}
            value={filters.topic}
            onChange={(v) => handleFilterChange({ topic: v || undefined })}
            options={topicOptions.map((t) => ({ label: t, value: t }))}
          />
          <Select
            placeholder="按优先级筛选"
            allowClear
            style={{ width: 140 }}
            value={filters.priority}
            onChange={(v) => handleFilterChange({ priority: v || undefined })}
            options={[
              { label: '低', value: '0' },
              { label: '中', value: '1' },
              { label: '高', value: '2' },
              { label: '紧急', value: '3' },
            ]}
          />
          <Select
            placeholder="按状态筛选"
            allowClear
            style={{ width: 140 }}
            value={filters.completed}
            onChange={(v) => handleFilterChange({ completed: v || undefined })}
            options={[
              { label: '未完成', value: 'false' },
              { label: '已完成', value: 'true' },
            ]}
          />
          <Button onClick={resetFilters}>重置筛选</Button>
        </Space>

        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建任务</Button>
          {/* 刷新时带上当前筛选条件，避免一刷新就回到"全部" */}
          <Button icon={<ReloadOutlined />} onClick={() => load(buildParams(filters))}>刷新</Button>
          <Button icon={<BulbOutlined />} loading={systemLoading} onClick={handleLoadSystem}>加载系统推荐</Button>
        </Space>
      </div>

      {showSystem && systemTasks.length > 0 && (
        // 【React 概念：用一个按钮改状态来控制显隐】
        // 点 × 就把 showSystem 置 false，面板随之消失；再点"加载系统推荐"会重新展开。
        <div style={{ marginBottom: 16, background: token.colorFillQuaternary, borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: token.colorTextSecondary }}>系统推荐任务（点击 + 添加到我的列表）</span>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setShowSystem(false)}
              aria-label="关闭系统推荐"
            />
          </div>
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
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999', marginTop: 20 }}>暂无任务，点击上方按钮创建</div>
      ) : (
        <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
          {tasks.map((t) => (
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
          <Form.Item name="type" label="任务类型">
            <Select>
              <Select.Option value="daily">每天打卡</Select.Option>
              <Select.Option value="periodic">周期任务</Select.Option>
              <Select.Option value="once">一次性</Select.Option>
            </Select>
          </Form.Item>
          {taskType === 'periodic' && (
            <Space align="start" style={{ display: 'flex' }}>
              <Form.Item name="intervalValue" label="每隔" style={{ marginBottom: 0 }}>
                <InputNumber min={1} style={{ width: 120 }} />
              </Form.Item>
              <Form.Item name="intervalUnit" label="单位" style={{ marginBottom: 0 }}>
                <Select style={{ width: 100 }}>
                  <Select.Option value="day">天</Select.Option>
                  <Select.Option value="week">周</Select.Option>
                  <Select.Option value="month">月</Select.Option>
                </Select>
              </Form.Item>
            </Space>
          )}
          {taskType === 'once' && (
            <Form.Item name="deadline" label="截止时间">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          )}
          <Form.Item name="needReviewReminder" label="复习提醒" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建任务成功的庆祝特效：createSuccess 有值才渲染，组件内部 1.8s 后自动关闭 */}
      <CheckInSuccess
        open={createSuccess !== null}
        title={createSuccess?.title}
        subTitle={createSuccess?.subTitle}
        tip={createSuccess?.tip}
        onClose={() => setCreateSuccess(null)}
      />
    </div>
  );
}
