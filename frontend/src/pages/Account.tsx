// 我的 > 账号：展示当前账号信息，可设置电子邮箱与电话号码（展示时脱敏，保护隐私）。
import { useEffect, useState } from 'react';
import { Card, Avatar, Tag, Button, Modal, Form, Input, Descriptions, Spin, message, theme } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { fetchProfile, updateProfile, UserProfile } from '../services/api';
import { notifyError } from '../utils/response';
import AdminPanel from '../components/AdminPanel';

// 脱敏：保留前 3 个字符，其余用 * 代替，保护用户隐私
// 技术：纯前端字符串处理（String.slice + String.repeat），原始值仅存于数据库，
// 列表展示始终脱敏，避免敏感信息在界面/接口响应中暴露。
function mask(value: string, placeholder = '未设置'): string {
  if (!value) return placeholder;
  if (value.length <= 3) return value;
  return value.slice(0, 3) + '*'.repeat(Math.min(value.length - 3, 6));
}

export default function Account() {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      const res = await fetchProfile();
      setProfile(res.data);
    } catch {
      notifyError('加载账号信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = () => {
    form.setFieldsValue({
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const res = await updateProfile({
        email: values.email?.trim() || '',
        phone: values.phone?.trim() || '',
      });
      if (res.code === 0) {
        message.success('资料已保存');
        setModalOpen(false);
        await load();
      } else {
        message.error(res.message || '保存失败');
      }
    } catch {
      // 失败已在 notifyError 中处理或校验未通过
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 120 }} />;

  const statusMap: Record<string, { color: string; text: string }> = {
    none: { color: 'default', text: '未设置' },
    pending: { color: 'gold', text: '审核中' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '未通过' },
  };
  const status = statusMap[profile?.avatarStatus || 'none'] ?? statusMap.none;
  const isAdmin = (localStorage.getItem('role') || 'user') === 'admin';

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: token.colorText }}>账号</h2>
      <Card style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Avatar
            size={64}
            src={profile?.avatarUrl || undefined}
            icon={<UserOutlined />}
            style={{ backgroundColor: profile?.avatarUrl ? 'transparent' : '#ff85c0' }}
          />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{profile?.username}</div>
            <Tag color={status.color} style={{ marginTop: 4 }}>头像{status.text}</Tag>
          </div>
          <Button style={{ marginLeft: 'auto' }} onClick={openEdit}>设置资料</Button>
        </div>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="用户名">{profile?.username}</Descriptions.Item>
          <Descriptions.Item label="电子邮箱">{mask(profile?.email ?? '')}</Descriptions.Item>
          <Descriptions.Item label="电话号码">{mask(profile?.phone ?? '')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal title="设置资料" open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="电子邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="例如：name@example.com" />
          </Form.Item>
          <Form.Item name="phone" label="电话号码" rules={[{ pattern: /^\d{6,20}$/, message: '请输入 6-20 位数字' }]}>
            <Input placeholder="例如：13800000000" />
          </Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
          保存后，邮箱与电话将仅展示前 3 位，其余以 * 脱敏，保护您的隐私。
        </div>
      </Modal>

      {isAdmin && <AdminPanel />}
    </div>
  );
}
