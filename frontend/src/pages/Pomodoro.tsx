// 番茄钟自习页：以可视化圆环时钟实现番茄工作法高效自习。
// 默认 25 分钟专注 + 5 分钟短休，每完成 4 个专注自动进入 15 分钟长休。
// 技术：原生 SVG <circle> + stroke-dasharray/stroke-dashoffset 绘制进度环；
// 用 setInterval + useRef 实现每秒倒计时，依赖 [running, mode, completedFocus] 控制生命周期。
import { useEffect, useRef, useState } from 'react';
import { Button, Space, message, theme } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

type Mode = 'focus' | 'short' | 'long';

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const MODE_META: Record<Mode, { label: string; color: string }> = {
  focus: { label: '专注自习', color: '#eb2f96' },
  short: { label: '短休息', color: '#52c41a' },
  long: { label: '长休息', color: '#1677ff' },
};

const RADIUS = 130;
const STROKE = 16;
const CIRC = 2 * Math.PI * RADIUS;

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Pomodoro() {
  const { token } = theme.useToken();
  const [mode, setMode] = useState<Mode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = DURATIONS[mode];
  const fraction = total > 0 ? secondsLeft / total : 0;

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // 时间到：根据当前模式切换下一阶段
          setRunning(false);
          if (mode === 'focus') {
            const next = completedFocus + 1;
            setCompletedFocus(next);
            const nextMode: Mode = next % 4 === 0 ? 'long' : 'short';
            setMode(nextMode);
            setSecondsLeft(DURATIONS[nextMode]);
            message.success(
              nextMode === 'long' ? '专注完成！进入长休息 🍅' : '专注完成！休息一下 ☕',
            );
          } else {
            setMode('focus');
            setSecondsLeft(DURATIONS.focus);
            message.info('休息结束，开始新的专注 💪');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, mode, completedFocus]);

  const switchMode = (m: Mode) => {
    setRunning(false);
    setMode(m);
    setSecondsLeft(DURATIONS[m]);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  };

  const color = MODE_META[mode].color;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: token.colorText }}>番茄钟自习</h2>
      <p style={{ color: token.colorTextSecondary, marginTop: 4 }}>
        以可视化时钟高效自习 · 已完成 {completedFocus} 个番茄 🍅
      </p>

      {/* 模式切换 */}
      <Space style={{ marginTop: 16 }} wrap>
        <Button type={mode === 'focus' ? 'primary' : 'default'} onClick={() => switchMode('focus')}>
          专注 25min
        </Button>
        <Button type={mode === 'short' ? 'primary' : 'default'} onClick={() => switchMode('short')}>
          短休 5min
        </Button>
        <Button type={mode === 'long' ? 'primary' : 'default'} onClick={() => switchMode('long')}>
          长休 15min
        </Button>
      </Space>

      {/* 可视化圆环时钟 */}
      <div style={{ position: 'relative', width: 300, height: 300, margin: '32px auto' }}>
        <svg width={300} height={300} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={150}
            cy={150}
            r={RADIUS}
            fill="none"
            stroke={token.colorFillSecondary}
            strokeWidth={STROKE}
          />
          <circle
            cx={150}
            cy={150}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - fraction)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 14, color: token.colorTextSecondary }}>{MODE_META[mode].label}</div>
          <div style={{ fontSize: 48, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(secondsLeft)}
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <Space size="large">
        <Button
          type="primary"
          size="large"
          icon={running ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? '暂停' : '开始'}
        </Button>
        <Button size="large" icon={<ReloadOutlined />} onClick={reset}>
          重置
        </Button>
      </Space>
    </div>
  );
}
