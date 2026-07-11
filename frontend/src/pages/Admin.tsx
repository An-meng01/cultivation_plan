// 管理员前端：登录角色为 admin 时进入，包含顶栏与退出/主题切换，内容区渲染管理员面板。
import { Layout, Button, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import { useTheme } from '../theme/ThemeContext';

const { Header, Content } = Layout;

export default function Admin() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('avatar');
    localStorage.removeItem('avatarStatus');
    navigate('/login', { replace: true });
  };

  const headerBg = isDark ? 'rgba(30,30,40,0.85)' : '#34182b';
  const contentBg = isDark ? 'rgba(20,20,30,0.82)' : 'rgba(255,255,255,0.87)';
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : '#fff';

  return (
    <Layout className="layout-root admin-layout" style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: headerBg,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: textColor }}>管理后台</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: textColor }}>{localStorage.getItem('username')}</span>
          <Button onClick={handleLogout}>退出登录</Button>
          <Switch checked={isDark} onChange={toggle} checkedChildren="🌙" unCheckedChildren="☀" />
        </div>
      </Header>
      <Content style={{ margin: 24, background: contentBg, borderRadius: 12, minHeight: 'calc(100vh - 48px - 48px)', padding: 24 }}>
        <AdminPanel />
      </Content>
    </Layout>
  );
}
