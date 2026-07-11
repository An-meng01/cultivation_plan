// 应用根组件：搭建整体布局（侧边栏/顶栏菜单、明暗主题开关、路由出口），并做桌面与移动端适配。
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Switch, Drawer, Button, theme, Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  MenuOutlined,
  FieldTimeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import ClockIn from './pages/ClockIn';
import Analysis from './pages/Analysis';
import Pomodoro from './pages/Pomodoro';
import Account from './pages/Account';
import Settings from './pages/Settings';
import Achievements from './pages/Achievements';
import Admin from './pages/Admin';
import Login from './pages/Login';
import TrackingNav from './components/TrackingNav';
import UserProfile from './components/UserProfile';
import ClockDisplay from './components/ClockDisplay';
import { useTheme } from './theme/ThemeContext';
import { useIsMobile } from './hooks/useIsMobile';
import { markNoticesSeen, ReviewNotice } from './services/api';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/tasks', icon: <UnorderedListOutlined />, label: '任务管理' },
  { key: '/clock-in', icon: <CheckCircleOutlined />, label: '打卡签到' },
  { key: '/pomodoro', icon: <FieldTimeOutlined />, label: '番茄钟' },
  { key: '/analysis', icon: <BarChartOutlined />, label: '任务分析' },
  {
    key: 'me',
    icon: <UserOutlined />,
    label: '我的',
    children: [
      { key: '/account', label: '账号' },
      { key: '/settings', label: '设置' },
      { key: '/achievements', label: '成就' },
    ],
  },
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useTheme();
  const { token } = theme.useToken();

  // 退出登录：清除本地身份并跳回登录页
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('avatar');
    localStorage.removeItem('avatarStatus');
    navigate('/login', { replace: true });
  };

  // 与粉色主题相搭、且与内容区有明显色差的侧边栏背景：亮色用较深的粉，暗色用酒红深粉
  const siderBg = isDark ? '#34182b' : '#ffd9ec';
  const glassBg = isDark ? 'rgba(30,30,45,0.82)' : 'rgba(255,255,255,0.85)';
  const titleColor = isDark ? 'rgba(255,255,255,0.9)' : '#000';
  const titleShadow = isDark ? '0 1px 6px rgba(0,0,0,0.4)' : '0 1px 6px rgba(255,255,255,0.4)';
  const headerBorder = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)';

  // 审核结果通知：登录时已暂存到 localStorage，进入账号页（数据加载完成）后再弹出，
  // 点击任意处关闭并标记为已读。
  const [reviewNotices, setReviewNotices] = useState<ReviewNotice[] | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem('pendingReviewNotices');
    if (raw) {
      try {
        const list = JSON.parse(raw) as ReviewNotice[];
        if (Array.isArray(list) && list.length > 0) setReviewNotices(list);
      } catch {
        localStorage.removeItem('pendingReviewNotices');
      }
    }
  }, []);

  const closeReviewNotices = async () => {
    setReviewNotices(null);
    localStorage.removeItem('pendingReviewNotices');
    try {
      await markNoticesSeen();
    } catch {
      // 忽略标记失败
    }
  };

  // 【React 概念：自定义 Hook 复用】
  // 屏幕小于 768px 就认为是在手机上，返回 true。
  const isMobile = useIsMobile(768);

  // 抽屉菜单的开关状态（只在手机模式下用到）
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 桌面端侧边栏默认收缩（只显示图标），鼠标移上去时缓慢拉伸展开
  const [collapsed, setCollapsed] = useState(true);

  // 点菜单项：跳转页面；如果是手机，顺手把抽屉关掉
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setDrawerOpen(false);
  };

  return (
    <Layout className="layout-root" style={{ minHeight: '100vh' }}>
      {/* 桌面端：保留左侧 Sider 侧边栏（手机端不渲染，改用顶部抽屉） */}
      {!isMobile && (
        <Sider
          width={collapsed ? 72 : 220}
          style={{
            background: siderBg,
            transition: 'width 1s ease-in-out, max-width 1s ease-in-out, min-width 1s ease-in-out, background .3s',
            overflow: 'hidden',
            boxShadow: '2px 0 8px rgba(214, 51, 132, 0.12)',
          }}
          onMouseEnter={() => setCollapsed(false)}
          onMouseLeave={() => setCollapsed(true)}
        >
          <div style={{ height: 48, margin: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10, color: token.colorText, fontWeight: 'bold', fontSize: 18, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <MenuOutlined />
            <span>菜单</span>
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
            background: glassBg,
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: headerBorder,
          }}
        >
          {/* 左边：手机显示汉堡按钮，桌面显示标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              // 【React 概念：受控显示】
              // 只在手机时渲染这个按钮；点它打开抽屉。
              <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
            )}
            <span style={{ fontSize: 18, fontWeight: 600, color: titleColor, textShadow: titleShadow }}>学习养成计划</span>
          </div>

          {/* 右边：头像+用户名 + 退出登录 + 暗色主题开关 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {localStorage.getItem('username') && <UserProfile />}
            <Button onClick={handleLogout}>退出登录</Button>
            <Switch
              checked={isDark}
              onChange={toggle}
              checkedChildren="🌙"
              unCheckedChildren="☀"
            />
          </div>
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

        {/* 内容区：与侧边栏形成明显区分 */}
        <Content style={{ margin: isMobile ? 12 : 24, background: glassBg, borderRadius: 12, minHeight: 'calc(100vh - 48px - 48px)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/clock-in" element={<ClockIn />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/account" element={<Account />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>

      <Modal
        open={!!reviewNotices}
        footer={null}
        closable={false}
        maskClosable
        onCancel={closeReviewNotices}
        title="审核结果通知"
        width={420}
      >
        <div onClick={closeReviewNotices} style={{ cursor: 'pointer' }}>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>以下为管理员对您提交的审核结果（点击任意处关闭）：</p>
          {reviewNotices?.map((n) => (
            <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontWeight: 600 }}>
                {n.kind === 'avatar' ? '头像' : `任务《${n.title}》`}
              </span>
              <span style={{ marginLeft: 8, color: n.action === 'approved' ? '#52c41a' : '#ff4d4f' }}>
                {n.action === 'approved' ? '已通过' : '未通过'}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </Layout>
  );
}

function App() {
  // 消费路由状态：登录/退出后 navigate 改变 URL 时，App 随之重渲染，
  // 从而重新读取 localStorage 里的 token，避免停留在登录页不刷新
  useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    return (
      <>
        <ClockDisplay />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  // 管理员走独立前端
  if (localStorage.getItem('role') === 'admin') {
    return (
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
        <Route path="/login" element={<Navigate to="/admin" replace />} />
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
