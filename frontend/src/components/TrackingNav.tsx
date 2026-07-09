import { ReactNode, useLayoutEffect, useRef, useState, CSSProperties } from 'react';
import { theme } from 'antd';

export interface NavItem {
  key: string;
  icon?: ReactNode;
  label: string;
}

interface Props {
  items: NavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  collapsed?: boolean;
  direction?: 'vertical' | 'horizontal';
}

const PINK = '#eb2f96';

export default function TrackingNav({ items, activeKey, onSelect, collapsed = false, direction = 'vertical' }: Props) {
  const { token } = theme.useToken();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ pos: number; size: number }>({ pos: 0, size: 0 });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const isVertical = direction === 'vertical';
  const trackedKey = hoveredKey ?? activeKey;

  useLayoutEffect(() => {
    const update = () => {
      const idx = items.findIndex((i) => i.key === trackedKey);
      const el = itemRefs.current[idx];
      if (!el) return;
      if (isVertical) {
        setIndicator({ pos: el.offsetTop, size: el.offsetHeight });
      } else {
        setIndicator({ pos: el.offsetLeft, size: el.offsetWidth });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [trackedKey, items, direction]);

  const indicatorStyle: CSSProperties = collapsed
    ? isVertical
      ? { left: 0, width: 4, top: indicator.pos, height: indicator.size, borderRadius: '0 12px 12px 0' }
      : { top: 0, height: 4, left: indicator.pos, width: indicator.size, borderRadius: '12px 12px 0 0' }
    : isVertical
      ? { left: 8, right: 8, top: indicator.pos, height: indicator.size, borderRadius: 16 }
      : { top: 8, bottom: 8, left: indicator.pos, width: indicator.size, borderRadius: 16 };

  const transition = collapsed
    ? 'top .3s cubic-bezier(.4,0,.2,1), height .3s cubic-bezier(.4,0,.2,1), left .3s cubic-bezier(.4,0,.2,1), width .3s cubic-bezier(.4,0,.2,1)'
    : 'top .3s cubic-bezier(.4,0,.2,1), height .3s cubic-bezier(.4,0,.2,1), left .25s cubic-bezier(.4,0,.2,1), right .25s cubic-bezier(.4,0,.2,1)';

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: 4 }}
    >
      <span
        style={{
          position: 'absolute',
          background: collapsed ? PINK : 'rgba(235, 47, 150, 0.22)',
          zIndex: 0,
          transition,
          ...indicatorStyle,
        }}
      />
      {items.map((item, i) => {
        const active = item.key === trackedKey;
        return (
          <button
            key={item.key}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            onClick={() => onSelect(item.key)}
            onMouseEnter={() => setHoveredKey(item.key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: 8,
              textAlign: 'left',
              fontSize: 15,
              color: active ? PINK : token.colorText,
              fontWeight: active ? 600 : 400,
              transition: 'color .2s',
            }}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
