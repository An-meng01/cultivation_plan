// 管理员面板：嵌入"账号"页（仅管理员可见），包含用户管理、头像审核与全局统计，风格与普通账号页一致。
// 技术：基于角色的前端条件渲染（localStorage.role === 'admin' 时才挂载本组件），
// 数据通过 antd Table/Tag/Statistic 展示，审核操作调用 admin 受保护接口(AdminFilter)。
import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Avatar, Space, Statistic, Row, Col, message, theme, Modal, Popconfirm, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import {
  fetchAdminUsers, fetchPendingAvatars, fetchPendingTasks,
  reviewAvatar, reviewTask, deleteUser,
  AdminUser, PendingAvatar, PendingTask,
} from '../services/api';
import { notifyError } from '../utils/response';

// 邮箱/电话脱敏：未点击时仅显示前三位，其余以 * 代替
function maskText(s: string): string {
  if (!s) return '';
  if (s.length <= 3) return s;
  return s.slice(0, 3) + '*'.repeat(s.length - 3);
}

export default function AdminPanel() {
  const { token } = theme.useToken();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [avatars, setAvatars] = useState<PendingAvatar[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const currentAdminId = Number(localStorage.getItem('userId') || 0);

  const load = async () => {
    setLoading(true);
    try {
      const [u, a, t] = await Promise.all([fetchAdminUsers(), fetchPendingAvatars(), fetchPendingTasks()]);
      setUsers(u.data);
      setAvatars(a.data);
      setPendingTasks(t.data);
    } catch {
      notifyError('加载管理数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleReveal = (id: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReviewAvatar = async (userId: number, action: 'approved' | 'rejected') => {
    try {
      const res = await reviewAvatar(userId, action);
      if (res.code === 0) {
        message.success(action === 'approved' ? '头像已通过' : '头像已拒绝');
        await load();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch {
      // 失败已由 notifyError 提示
    }
  };

  const handleReviewTask = async (taskId: number, action: 'approved' | 'rejected') => {
    try {
      const res = await reviewTask(taskId, action);
      if (res.code === 0) {
        message.success(action === 'approved' ? '任务已通过' : '任务已拒绝');
        await load();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch {
      // 失败已由 notifyError 提示
    }
  };

  const handleDelete = async (u: AdminUser) => {
    try {
      const res = await deleteUser(u.id);
      if (res.code === 0) {
        message.success('已注销账号');
        if (res.data?.self) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('userId');
          localStorage.removeItem('role');
          localStorage.removeItem('avatar');
          localStorage.removeItem('avatarStatus');
          window.location.href = '/login';
          return;
        }
        await load();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    }
  };

  const columns = [
    { title: '用户 ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (r: string) => <Tag color={r === 'admin' ? 'gold' : 'default'}>{r === 'admin' ? '管理员' : '普通用户'}</Tag>,
    },
    { title: '任务数', dataIndex: 'taskCount', key: 'taskCount', width: 80 },
    {
      title: '头像状态',
      dataIndex: 'avatarStatus',
      key: 'avatarStatus',
      render: (s: string) => {
        const m: Record<string, { color: string; t: string }> = {
          none: { color: 'default', t: '未设置' },
          pending: { color: 'gold', t: '审核中' },
          approved: { color: 'green', t: '已通过' },
          rejected: { color: 'red', t: '未通过' },
        };
        const v = m[s] ?? m.none;
        return <Tag color={v.color}>{v.t}</Tag>;
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string, row: AdminUser) => {
        if (!email) return <span style={{ color: token.colorTextSecondary }}>-</span>;
        const show = revealed.has(row.id);
        return (
          <span
            style={{ cursor: 'pointer', color: show ? token.colorText : token.colorPrimary, textDecoration: show ? 'none' : 'underline dotted' }}
            onClick={() => toggleReveal(row.id)}
            title={show ? '点击隐藏' : '点击查看完整邮箱'}
          >
            {show ? email : maskText(email)}
          </span>
        );
      },
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string, row: AdminUser) => {
        if (!phone) return <span style={{ color: token.colorTextSecondary }}>-</span>;
        const show = revealed.has(row.id);
        return (
          <span
            style={{ cursor: 'pointer', color: show ? token.colorText : token.colorPrimary, textDecoration: show ? 'none' : 'underline dotted' }}
            onClick={() => toggleReveal(row.id)}
            title={show ? '点击隐藏' : '点击查看完整电话'}
          >
            {show ? phone : maskText(phone)}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, row: AdminUser) => {
        const isOtherAdmin = row.role === 'admin' && row.id !== currentAdminId;
        return (
          <Popconfirm
            title={row.id === currentAdminId ? '注销自己的账号？' : '确认注销该用户？'}
            onConfirm={() => handleDelete(row)}
            okText="注销"
            cancelText="取消"
            disabled={isOtherAdmin}
          >
            <Button danger size="small" disabled={isOtherAdmin}>
              {isOtherAdmin ? '不可注销' : '注销'}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  const taskColumns = [
    { title: '任务 ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: '用户 ID', dataIndex: 'userId', key: 'userId', width: 90 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '任务标题', dataIndex: 'title', key: 'title' },
    { title: '主题', dataIndex: 'topic', key: 'topic' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, row: PendingTask) => (
        <Space>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleReviewTask(row.id, 'approved')}>通过</Button>
          <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleReviewTask(row.id, 'rejected')}>拒绝</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: token.colorText }}>管理员功能</h3>

      <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="用户总数" value={users.length} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="任务总数" value={users.reduce((s, u) => s + u.taskCount, 0)} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="待审核头像" value={avatars.length} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="待审核任务" value={pendingTasks.length} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
      </Row>

      <Card title="用户管理" style={{ marginTop: 16 }} size="small">
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={users}
          columns={columns}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title="头像审核（点击头像可放大查看）" style={{ marginTop: 16 }} size="small">
        {avatars.length === 0 ? (
          <div style={{ color: token.colorTextSecondary, padding: 12 }}>暂无待审核头像</div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {avatars.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                <Avatar
                  size={48}
                  src={a.avatarUrl || undefined}
                  style={{ cursor: 'pointer' }}
                  onClick={() => a.avatarUrl && setPreviewUrl(a.avatarUrl)}
                />
                <div style={{ flex: 1 }}>
                  <div>{a.username}</div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                    ID: {a.id}
                    <Tooltip title="点击放大">
                      <EyeOutlined style={{ marginLeft: 8, cursor: 'pointer' }} onClick={() => a.avatarUrl && setPreviewUrl(a.avatarUrl)} />
                    </Tooltip>
                  </div>
                </div>
                <Button type="primary" icon={<CheckOutlined />} onClick={() => handleReviewAvatar(a.id, 'approved')}>通过</Button>
                <Button danger icon={<CloseOutlined />} onClick={() => handleReviewAvatar(a.id, 'rejected')}>拒绝</Button>
              </div>
            ))}
          </Space>
        )}
      </Card>

      <Card title="任务审核（普通用户当日新增超过 30 个后的部分）" style={{ marginTop: 16 }} size="small">
        {pendingTasks.length === 0 ? (
          <div style={{ color: token.colorTextSecondary, padding: 12 }}>暂无待审核任务</div>
        ) : (
          <Table
            rowKey="id"
            size="small"
            dataSource={pendingTasks}
            columns={taskColumns}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      <Modal
        open={!!previewUrl}
        footer={null}
        onCancel={() => setPreviewUrl(null)}
        title="头像预览"
        width={360}
      >
        {previewUrl && <img src={previewUrl} alt="avatar" style={{ width: '100%', borderRadius: 8 }} />}
      </Modal>
    </div>
  );
}
