import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Switch, Drawer, Button, theme } from 'antd';
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
import { useTheme } from './theme/ThemeContext';
import { useIsMobile } from './hooks/useIsMobile';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/tasks', icon: <UnorderedListOutlined />, label: '任务管理' },
  { key: '/clock-in', icon: <CheckCircleOutlined />, label: '打卡签到' },
  { key: '/analysis', icon: <BarChartOutlined />, label: '任务分析' },
];

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useTheme();
  const { token } = theme.useToken();

  // 【React 概念：自定义 Hook 复用】
  // 屏幕小于 768px 就认为是在手机上，返回 true。
  const isMobile = useIsMobile(768);

  // 抽屉菜单的开关状态（只在手机模式下用到）
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 点菜单项：跳转页面；如果是手机，顺手把抽屉关掉
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setDrawerOpen(false);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {/* 桌面端：保留左侧 Sider 侧边栏（手机端不渲染，改用顶部抽屉） */}
      {!isMobile && (
        <Sider collapsible>
          <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
            学习养成计划
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
          />
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
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', color: token.colorText, fontWeight: 'bold', fontSize: 18 }}>
            学习养成计划
          </div>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Drawer>

        {/* 内容区：手机上把外边距收窄，避免太挤 */}
        <Content style={{ margin: isMobile ? 12 : 24 }}>
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

export default App;
