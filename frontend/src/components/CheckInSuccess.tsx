// 成功庆祝弹层组件（可复用）：用纯 CSS 动画展示对勾与彩带，1.8 秒后自动关闭，用于打卡/创建成功反馈。
import { useEffect } from 'react';
import { theme } from 'antd';
import './CheckInSuccess.css';

interface Props {
  open: boolean;
  title?: string;       // 主标题，默认"打卡成功！"（创建任务时可传"创建成功！"）
  subTitle?: string;    // 副标题（如任务标题），可选
  tip?: string;         // 底部鼓励语，可定制
  onClose: () => void;
}

// 【React 概念 1：自包含、可复用的"单一职责"组件】
// 这个组件只负责"庆祝动画"这一件事，不关心是谁触发的（打卡 or 创建任务）。
// 它通过 open / title / subTitle / tip / onClose 这几个属性与外界通信（属性驱动），
// 谁都能拿来用，改业务逻辑不会影响它，改它也不会影响业务。
export default function CheckInSuccess({ open, title = '打卡成功！', subTitle, tip = '今天的坚持，是未来惊喜的铺垫 🌟', onClose }: Props) {
  // 【React 概念 3：useEffect 处理"副作用"——定时自动关闭】
  // 特效打开后 1.8 秒自动调用 onClose 收起，避免一直挡住用户。
  // 返回的清理函数会在依赖变化/卸载时清除定时器，防止内存泄漏（标准写法）。
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 1800);
    return () => clearTimeout(t);
  }, [open, onClose]);

  // 【React 概念 4：useToken 适配暗色主题】
  // 卡片背景/文字都取自 antd 的设计变量，亮色和暗色下自动协调，不写死颜色。
  const { token } = theme.useToken();

  // 没打开就不渲染任何东西（条件返回，保持组件"无副作用"）
  if (!open) return null;

  // 【React 概念 5：用状态/随机数据生成列表】
  // 每次打开都随机生成一批彩带（位置/颜色/大小/延迟不同），让动画不重样。
  // Array.from 这里用来"造一个长度为 44 的数组并逐项映射"，是常用的生成列表技巧。
  const colors = ['#52c41a', '#1677ff', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];
  const pieces = Array.from({ length: 44 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1 + Math.random() * 0.8,
    color: colors[i % colors.length],
    width: 6 + Math.random() * 6,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="cis-overlay" onClick={onClose}>
      {/* 点卡片内部不关闭（阻止冒泡），只有点遮罩才关闭 */}
      <div
        className="cis-card"
        style={{ background: token.colorBgContainer }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 彩带层：每个碎片用 inline style 写入随机参数，动画本身在 CSS 里定义 */}
        <div className="cis-confetti">
          {pieces.map((p) => (
            <span
              key={p.id}
              className="cis-piece"
              style={{
                left: `${p.left}%`,
                width: p.width,
                height: p.width * 0.4,
                background: p.color,
                transform: `rotate(${p.rotate}deg)`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>

        {/* 对勾：SVG 描边动画（先画圆、再画勾）全部由 CSS 的 @keyframes 驱动 */}
        <svg className="cis-check" viewBox="0 0 52 52">
          <circle className="cis-check-circle" cx="26" cy="26" r="24" />
          <path className="cis-check-path" d="M14 27 l8 8 l16 -18" />
        </svg>

        {/* 【React 概念 2：纯 CSS 动画，零依赖】
            对勾描边、卡片弹出、彩带飘落都是用 @keyframes + transition 实现的，
            不需要装任何动画库，性能好、可控性强。 */}
        <div className="cis-title">{title}</div>
        {subTitle && (
          <div className="cis-sub" style={{ color: token.colorTextSecondary }}>
            {subTitle}
          </div>
        )}
        <div className="cis-tip" style={{ color: token.colorTextTertiary }}>
          {tip}
        </div>
      </div>
    </div>
  );
}
