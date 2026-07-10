// 我的 > 设置：提供基础偏好设置（暗色主题、默认提前提醒天数等）。
import { Card, Switch, InputNumber, Form, Typography, theme } from 'antd';
import { useTheme } from '../theme/ThemeContext';

export default function Settings() {
  const { token } = theme.useToken();
  const { isDark, toggle } = useTheme();
  const { Text } = Typography;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: token.colorText }}>设置</h2>
      <Card style={{ marginTop: 16 }}>
        <Form layout="vertical">
          <Form.Item label="暗色主题">
            <Switch checked={isDark} onChange={toggle} />
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">开启后整体切换为暗色外观</Text>
            </div>
          </Form.Item>
          <Form.Item label="默认提前提醒天数" tooltip="新建任务默认提醒提前天数（可在创建时修改）">
            <InputNumber min={1} max={365} defaultValue={1} addonAfter="天" style={{ width: 160 }} />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
