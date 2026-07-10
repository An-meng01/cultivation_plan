import { ReactNode, useLayoutEffect, useRef, useState, CSSProperties } from 'react';
import { theme } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';

export interface NavItem {
  key: string;
  icon?: ReactNode;
  label: string;
  children?: NavItem[];
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
  // 有子项的父级是否展开（默认展开包含当前路由的那一项）
  const [openKeys, setOpenKeys] = useState<Set<string>>(
    () => new Set(items.filter((i) => i.children?.some((c) => c.key === activeKey)).map((i) => i.key)),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ pos: number; size: number }>({ pos: 0, size: 0 });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const isVertical = direction === 'vertical';
  const trackedKey = hoveredKey ?? activeKey;

  // 收集所有叶节点（用于指示条定位与点击）
  useLayoutEffect(() => {
    const update = () => {
      const el = itemRefs.current[trackedKey];
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
  }, [trackedKey, items, direction, openKeys]);

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

  const renderLeaf = (item: NavItem, isChild = false) => {
    const active = item.key === trackedKey;
    return (
      <button
        key={item.key}
        ref={(el) => {
          itemRefs.current[item.key] = el;
        }}
        onClick={() => onSelect(item.key)}
        onMouseEnter={() => setHoveredKey(item.key)}
        onMouseLeave={() => setHoveredKey(null)}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 10,
          width: '100%',
          padding: isChild ? '8px 12px 8px 36px' : '10px 12px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: 8,
          textAlign: 'left',
          fontSize: isChild ? 14 : 15,
          color: active ? PINK : token.colorText,
          fontWeight: active ? 600 : 400,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          transition: 'color .2s',
        }}
      >
        {!isChild && item.icon}
        <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.label}</span>
      </button>
    );
  };

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
      {items.map((item) => {
        if (!item.children) return renderLeaf(item);
        const isOpen = openKeys.has(item.key);
        const childActive = item.children.some((c) => c.key === activeKey);
        return (
          <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              ref={(el) => {
                itemRefs.current[item.key] = el;
              }}
              onClick={() => toggle(item.key)}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: 8,
                textAlign: 'left',
                fontSize: 15,
                color: childActive ? PINK : token.colorText,
                fontWeight: childActive ? 600 : 400,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'color .2s',
              }}
            >
              {item.icon}
              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.label}</span>
              <span style={{ marginLeft: 'auto' }}>
                {isOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
              </span>
            </button>
            {isOpen && item.children.map((c) => renderLeaf(c, true))}
          </div>
        );
      })}
    </div>
  );
}
