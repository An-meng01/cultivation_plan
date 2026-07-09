import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import ClockIn from './pages/ClockIn';
import Analysis from './pages/Analysis';
import Login from './pages/Login';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/tasks', icon: <UnorderedListOutlined />, label: '任务管理' },
  { key: '/clock-in', icon: <CheckCircleOutlined />, label: '打卡签到' },
  { key: '/analysis', icon: <BarChartOutlined />, label: '任务分析' },
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || '用户';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
          学习养成计划
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>学习养成计划</span>
          <div>
            <span style={{ marginRight: 12 }}>{username}</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button>
          </div>
        </Header>
        <Content style={{ margin: 24 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/clock-in" element={<ClockIn />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  const token = localStorage.getItem('token');

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/*" element={<AppLayout />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
