// 管理员前端：登录角色为 admin 时进入，包含顶栏与退出/主题切换，内容区渲染管理员面板。
import { Layout, Button, Switch, theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import { useTheme } from '../theme/ThemeContext';

const { Header, Content } = Layout;

export default function Admin() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const { token } = theme.useToken();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('avatar');
    localStorage.removeItem('avatarStatus');
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#34182b',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>管理后台</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff' }}>{localStorage.getItem('username')}</span>
          <Button onClick={handleLogout}>退出登录</Button>
          <Switch checked={isDark} onChange={toggle} checkedChildren="🌙" unCheckedChildren="☀" />
        </div>
      </Header>
      <Content style={{ margin: 24, background: token.colorBgContainer, borderRadius: 12, minHeight: 'calc(100vh - 48px - 48px)', padding: 24 }}>
        <AdminPanel />
      </Content>
    </Layout>
  );
}
