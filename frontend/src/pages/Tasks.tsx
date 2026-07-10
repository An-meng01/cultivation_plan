import { useState } from 'react';
import {
  Row, Col, Button, Modal, Form, Input, Select, DatePicker, Switch, InputNumber, Space, message, Spin, Tooltip, theme, Collapse, Card,
} from 'antd';
import { PlusOutlined, ReloadOutlined, BulbOutlined, CloseOutlined, CaretRightOutlined } from '@ant-design/icons';
import { Task, TaskForm, TaskType, fetchTodayTaskCount } from '../services/api';
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
  // 【React 概念：Form.useWatch】实时监听表单中 type 字段，用于条件渲染"周期/一次性"专属表单项
  const taskType = Form.useWatch('type', form) as TaskType | undefined;
  // 监听"设置提醒"开关，开启时才显示"提前多少天提醒"输入框
  const needRemind = Form.useWatch('needReviewReminder', form) as boolean | undefined;

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
  const [filters, setFilters] = useState<{ topic?: string; priority?: string; completed?: string; type?: string }>({});

  const openCreate = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ priority: 1, source: 'custom', type: 'once' });
    setModalOpen(true);
  };

  // 当日新增任务超过 30 个时，再次创建需管理员审核：创建前先询问用户是否确定
  const confirmIfOverDailyLimit = async (): Promise<boolean> => {
    try {
      const res = await fetchTodayTaskCount();
      const todayCount = res.code === 0 ? res.data.count : 0;
      if (todayCount >= 30) {
        return await new Promise<boolean>((resolve) => {
          Modal.confirm({
            title: '该任务需管理员审核',
            content: '您今日新增任务已超过 30 个，该任务创建后需经管理员审核才能正常使用，是否确定创建？',
            okText: '确定创建',
            cancelText: '取消',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
      }
    } catch {
      // 查询失败不阻断创建
    }
    return true;
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      topic: task.topic,
      priority: task.priority,
      needReviewReminder: task.needReviewReminder,
      remindBeforeDays: task.remindBeforeDays ?? null,
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
        // 用本地时间字符串（不带 Z / 时区偏移）提交，避免 toISOString 转 UTC 导致小时偏移 8 小时
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        needReviewReminder: !!values.needReviewReminder,
        remindBeforeDays: values.needReviewReminder ? (values.remindBeforeDays ?? 1) : null,
      };
      if (editingTask) {
        await edit(editingTask.id, data);
        message.success('任务已更新');
      } else {
        const ok = await confirmIfOverDailyLimit();
        if (!ok) return; // 用户取消创建
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
      const ok = await confirmIfOverDailyLimit();
      if (!ok) return; // 用户取消创建
      await add({
        title: t.title,
        topic: t.topic,
        priority: t.priority,
        description: t.description,
        type: t.type,
        intervalValue: t.intervalValue,
        intervalUnit: t.intervalUnit,
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
    if (f.type) p.type = f.type;
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

  // 【React 概念：从 state 派生展示结构（无需新 state）】
  // 先按"未完成 / 已完成"分两大块，每块内再按"每天打卡 / 周期打卡 / 一次性"分三阶段，
  // 每阶段内按优先级"紧急 > 高 > 中 > 低"从前往后排列。
  // 技术：用 antd Collapse 实现"文件夹式"可折叠分组（双层嵌套，defaultActiveKey 控制默认展开）。
  // 自定义展开箭头并用主题色着色，避免暗色模式下箭头看不清（req 6）。
  const expandIcon = (panelProps: any) => (
    <CaretRightOutlined
      rotate={panelProps.expanded ? 90 : 0}
      style={{ color: token.colorText, fontSize: 14 }}
    />
  );

  // 待审核任务（reviewStatus === 'pending'）：不能操作、不计统计，单独成栏放在"已完成"之后
  const reviewingTasks = tasks.filter((t) => (t.reviewStatus ?? 'none') === 'pending');

  const STAGES: { key: TaskType; title: string }[] = [
    { key: 'daily', title: '每天打卡' },
    { key: 'periodic', title: '周期打卡' },
    { key: 'once', title: '一次性' },
  ];
  const BUCKETS: { key: string; title: string; pred: (t: Task) => boolean }[] = [
    { key: 'incomplete', title: '未完成', pred: (t) => !t.completed },
    { key: 'complete', title: '已完成', pred: (t) => t.completed },
  ];
  const grouped = BUCKETS.map((bucket) => ({
    ...bucket,
    stages: STAGES.map((stage) => ({
      ...stage,
      items: tasks
        .filter((t) => bucket.pred(t) && (t.reviewStatus ?? 'none') !== 'pending' && (t.type ?? 'once') === stage.key)
        .sort((a, b) => b.priority - a.priority),
    })).filter((s) => s.items.length > 0),
  })).filter((b) => b.stages.length > 0);

  // 模块配色：大模块(未完成/已完成)两种状态色；小模块(每天/周期/一次性)统一一种区分色
  const BUCKET_STYLE: Record<string, { bg: string; border: string; color: string }> = {
    incomplete: { bg: '#fff0f6', border: '#ffadd2', color: '#c41d7f' },
    complete: { bg: '#f6ffed', border: '#b7eb8f', color: '#389e0d' },
  };
  const STAGE_STYLE: Record<string, { bg: string; border: string; color: string }> = {
    daily: { bg: '#e6f4ff', border: '#91caff', color: '#0958d9' },
    periodic: { bg: '#fff7e6', border: '#ffd591', color: '#d46b08' },
    once: { bg: '#f9f0ff', border: '#d3adf7', color: '#722ed1' },
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
          <Select
            placeholder="按类型筛选"
            allowClear
            style={{ width: 140 }}
            value={filters.type}
            onChange={(v) => handleFilterChange({ type: v || undefined })}
            options={[
              { label: '每天打卡', value: 'daily' },
              { label: '周期打卡', value: 'periodic' },
              { label: '一次性', value: 'once' },
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
      ) : grouped.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999', marginTop: 20 }}>暂无任务，点击上方按钮创建</div>
      ) : (
        <Collapse
          defaultActiveKey={grouped.map((b) => b.key)}
          expandIcon={expandIcon}
          items={grouped.map((bucket) => {
            const bucketCount = bucket.stages.reduce((sum, s) => sum + s.items.length, 0);
            const bStyle = BUCKET_STYLE[bucket.key];
            return {
              key: bucket.key,
              style: { background: bStyle.bg, border: `1px solid ${bStyle.border}`, borderRadius: 8, marginBottom: 12 },
              label: (
                <span style={{ fontWeight: 700, fontSize: 16, color: bStyle.color }}>
                  {bucket.title}（{bucketCount}）
                </span>
              ),
                       children: (
                         <Collapse
                           defaultActiveKey={bucket.stages.map((s) => s.key)}
                           expandIcon={expandIcon}
                           items={bucket.stages.map((stage) => {
                    const sStyle = STAGE_STYLE[stage.key];
                    return {
                      key: stage.key,
                      style: { background: sStyle.bg, border: `1px solid ${sStyle.border}`, borderRadius: 6, marginBottom: 8 },
                      label: (
                        <span style={{ fontWeight: 600, fontSize: 14, color: sStyle.color }}>
                          {stage.title}（{stage.items.length}）
                        </span>
                      ),
                      children: (
                        <Row gutter={[12, 12]}>
                          {stage.items.map((t) => (
                            <Col key={t.id} xs={24} sm={12} lg={8} xl={6}>
                              <TaskCard task={t} onComplete={done} onEdit={openEdit} onDelete={remove} />
                            </Col>
                          ))}
                        </Row>
                      ),
                    };
                  })}
                />
              ),
            };
          })}
        />
      )}

      {reviewingTasks.length > 0 && (
        <Card
          title="待审核"
          style={{ marginTop: 16, border: `1px solid ${STAGE_STYLE.daily.border}`, borderRadius: 8 }}
          styles={{ header: { color: STAGE_STYLE.daily.color, fontWeight: 700 } }}
        >
          <div style={{ fontSize: 13, color: token.colorTextSecondary, marginBottom: 12 }}>
            以下任务需管理员审核通过后才能正常使用（打卡/编辑/删除均不可用，且不参与统计）。
          </div>
          <Row gutter={[12, 12]}>
            {reviewingTasks.map((t) => (
              <Col key={t.id} xs={24} sm={12} lg={8} xl={6}>
                <TaskCard task={t} pending />
              </Col>
            ))}
          </Row>
        </Card>
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
              <DatePicker showTime style={{ width: '100%' }} placement="topLeft" />
            </Form.Item>
          )}
          <Form.Item name="needReviewReminder" label="设置提醒" valuePropName="checked">
            <Switch />
          </Form.Item>
          {needRemind && (
            <Form.Item name="remindBeforeDays" label="提前提醒（天）" initialValue={1} rules={[{ required: true, message: '请输入提前提醒天数' }]}>
              <InputNumber min={1} max={365} style={{ width: 160 }} addonAfter="天" />
            </Form.Item>
          )}
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
