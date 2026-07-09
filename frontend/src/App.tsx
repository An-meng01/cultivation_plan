// 应用根组件：搭建整体布局（侧边栏/顶栏菜单、明暗主题开关、路由出口），并做桌面与移动端适配。
import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Switch, Drawer, Button, theme } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import ClockIn from './pages/ClockIn';
import Analysis from './pages/Analysis';
import TrackingNav from './components/TrackingNav';
import { useTheme } from './theme/ThemeContext';
import { useIsMobile } from './hooks/useIsMobile';

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
  const { isDark, toggle } = useTheme();
  const { token } = theme.useToken();

  // 与粉色主题相搭、且与内容区有明显色差的侧边栏背景：亮色用较深的粉，暗色用酒红深粉
  const siderBg = isDark ? '#34182b' : '#ffd9ec';

  // 【React 概念：自定义 Hook 复用】
  // 屏幕小于 768px 就认为是在手机上，返回 true。
  const isMobile = useIsMobile(768);

  // 抽屉菜单的开关状态（只在手机模式下用到）
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 桌面端侧边栏默认收缩（只显示图标），鼠标移上去时展开
  const [collapsed, setCollapsed] = useState(true);

  // 点菜单项：跳转页面；如果是手机，顺手把抽屉关掉
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setDrawerOpen(false);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {/* 桌面端：保留左侧 Sider 侧边栏（手机端不渲染，改用顶部抽屉） */}
      {!isMobile && (
        <Sider
          width={collapsed ? 72 : 220}
          style={{ background: siderBg, transition: 'width .25s, background .3s', overflow: 'hidden', boxShadow: '2px 0 8px rgba(214, 51, 132, 0.12)' }}
          onMouseEnter={() => setCollapsed(false)}
          onMouseLeave={() => setCollapsed(true)}
        >
          <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: token.colorText, fontWeight: 'bold', fontSize: 18 }}>
            {collapsed ? <MenuOutlined /> : '导航'}
          </div>
          <div style={{ padding: '0 12px' }}>
            <TrackingNav
              items={menuItems}
              activeKey={location.pathname}
              onSelect={(key) => handleMenuClick({ key })}
              collapsed={collapsed}
            />
          </div>
        </Sider>
      )}

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {/* 左边：手机显示汉堡按钮，桌面显示标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              // 【React 概念：受控显示】
              // 只在手机时渲染这个按钮；点它打开抽屉。
              <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
            )}
            <span style={{ fontSize: 18, fontWeight: 600 }}>学习养成计划</span>
          </div>

          {/* 右边：暗色主题开关（不变） */}
          <Switch
            checked={isDark}
            onChange={toggle}
            checkedChildren="🌙"
            unCheckedChildren="☀"
          />
        </Header>

        {/* 手机端的导航抽屉：从左侧滑出，里面放同一份菜单 */}
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          // 标题栏不显示关闭叉，靠点菜单或点遮罩关闭
          closable={false}
          styles={{ body: { padding: 0, background: siderBg } }}
        >
          <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', color: token.colorText, fontWeight: 'bold', fontSize: 18 }}>
            学习养成计划
          </div>
          <div style={{ padding: '0 12px' }}>
            <TrackingNav
              items={menuItems}
              activeKey={location.pathname}
              onSelect={(key) => handleMenuClick({ key })}
            />
          </div>
        </Drawer>

        {/* 内容区：用白底与粉色侧边栏形成明显区分 */}
        <Content style={{ margin: isMobile ? 12 : 24, background: token.colorBgContainer, borderRadius: 12, minHeight: 'calc(100vh - 48px - 48px)' }}>
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
