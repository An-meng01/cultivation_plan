import { useState } from 'react';
import { Form, Input, Button, Checkbox, message, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api, { fetchNotices } from '../services/api';
import './Login.css';

interface LoginRes {
  code: number;
  data?: {
    token: string;
    userId: number;
    username: string;
    role?: string;
    avatarUrl?: string;
    avatarStatus?: string;
  };
  message?: string;
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  // isRegister=false => 登录视图（蒙版居右）；true => 注册视图（蒙版居左）
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: { username: string; password: string; isAdmin?: boolean }, mode: 'login' | 'register') => {
    setLoading(true);
    try {
      const payload = mode === 'register'
        ? { username: values.username, password: values.password, role: values.isAdmin ? 'admin' : 'user' }
        : values;
      const res = await (mode === 'login'
        ? api.post('/auth/login', payload)
        : api.post('/auth/register', payload)) as unknown as LoginRes;

      if (res.code === 0 && res.data) {
        if (mode === 'login') {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('username', res.data.username);
          localStorage.setItem('userId', String(res.data.userId));
          localStorage.setItem('role', res.data.role || 'user');
          localStorage.setItem('avatar', res.data.avatarUrl || '');
          localStorage.setItem('avatarStatus', res.data.avatarStatus || 'none');
          message.success('登录成功');

          // 被审核的普通用户：先把未读通知暂存，进入账号页后再弹出（不在登录页弹）
          try {
            const nres = await fetchNotices();
            if (nres.code === 0 && nres.data.length > 0) {
              localStorage.setItem('pendingReviewNotices', JSON.stringify(nres.data));
            }
          } catch {
            // 通知获取失败不阻塞登录
          }
          navigate(res.data?.role === 'admin' ? '/admin' : '/', { replace: true });
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('userId');
          message.success('注册成功，请登录');
          setIsRegister(false);
        }
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (err: any) {
      if (mode === 'login') {
        // 登录失败统一用中文提示（账号或密码错误），不暴露后端原始英文文案
        message.error('用户名或密码错误');
      } else {
        message.error(err?.message || '请求失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
    <div className="auth-page">
      <div className="auth-title">学习养成计划</div>
      <div className="auth-card">
        {/* 左侧白底：登录输入处（固定不动） */}
        <div className="auth-panel auth-panel--left">
          <div className="auth-panel-heading">登录</div>
          <Form onFinish={(v) => handleSubmit(v, 'login')} size="large">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" maxLength={10} style={{ fontSize: 10 }} />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" style={{ fontSize: 10 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* 右侧白底：注册输入处（固定不动） */}
        <div className="auth-panel auth-panel--right">
          <div className="auth-panel-heading">注册</div>
          <Form onFinish={(v) => handleSubmit(v, 'register')} size="large">
            <Form.Item name="username" rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名至少2个字符' },
              { max: 10, message: '用户名最多10个字符' },
            ]}>
              <Input prefix={<UserOutlined />} placeholder="用户名（最多10个字符）" maxLength={10} style={{ fontSize: 10 }} />
            </Form.Item>
            <Form.Item name="password" rules={[
              { required: true, message: '请输入密码' },
              { min: 4, message: '密码至少4个字符' },
            ]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" style={{ fontSize: 10 }} />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" style={{ fontSize: 10 }} />
            </Form.Item>
            <Form.Item name="isAdmin" valuePropName="checked">
              <Checkbox style={{ fontSize: 10 }}>注册管理员</Checkbox>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ fontSize: 13 }}>
                创建账号
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* 荧光绿蒙版：丝滑移动 + 字体丝滑切换 */}
        <div className={`auth-overlay ${isRegister ? 'auth-overlay--register' : 'auth-overlay--login'}`}>
          {/* 登录视图显示的面：你好，新朋友！ */}
          <div className={`auth-overlay-face ${!isRegister ? 'auth-overlay-face--active' : ''}`}>
            <div className="auth-overlay-big">欢迎回来</div>
            <div className="auth-overlay-small">学无止境，常学常新</div>
            <button className="auth-overlay-btn" onClick={() => setIsRegister(true)}>注册</button>
          </div>
          {/* 注册视图显示的面：欢迎回来 */}
          <div className={`auth-overlay-face ${isRegister ? 'auth-overlay-face--active' : ''}`}>
            <div className="auth-overlay-big">你好，新同学！</div>
            <div className="auth-overlay-small">书山求径，学海泛舟</div>
            <button className="auth-overlay-btn" onClick={() => setIsRegister(false)}>登录</button>
          </div>
        </div>
      </div>
    </div>
    </ConfigProvider>
  );
}
