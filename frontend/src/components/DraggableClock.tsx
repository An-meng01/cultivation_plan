import { useState, useEffect, useRef, useCallback } from 'react';

interface Pos { x: number; y: number }
interface Rot { x: number; y: number }

interface Props {
  storageKey: string;
  defaultPos: Pos;
  children: React.ReactNode;
  fontSize?: number;
  color?: string;
  letterSpacing?: number;
}

/* 语言：TypeScript + React（TSX 组件，Vite 构建）
 *
 * 可拖拽 + 可缩放 + 可 3D 旋转的浮动文字组件。
 *
 * ─── 交互方式 ───
 *   左键拖拽         → 移动位置
 *   Ctrl + 左键拖拽   → 绕 X / Y 轴 3D 旋转
 *   滚轮              → 放大 / 缩小字号
 *
 * ─── 3D 旋转技术要点 ───
 *   使用 CSS `perspective()` + `rotateX()` / `rotateY()` 实现三维透视效果。
 *   `perspective(600px)` 定义视距（观察者到元素平面的距离），值越小透视变形越强。
 *   `rotateX(deg)` 绕水平轴旋转（上下倾斜），`rotateY(deg)` 绕垂直轴旋转（左右偏转）。
 *   拖拽时通过鼠标移动增量（dx/dy）累加到角度上，手感系数 0.5 让旋转更细腻。
 *
 * ─── 持久化 ───
 *   位置、旋转角度、字号统一序列化为 JSON 存入 localStorage，
 *   以 storageKey 区分不同实例（时 / 月 / 日），刷新后自动恢复。
 */

export default function DraggableClock({ storageKey, defaultPos, children, fontSize: defaultFontSize = 26, color = '#fff', letterSpacing: defaultLetterSpacing = 2 }: Props) {
  // ── 从 localStorage 恢复状态，无历史则用默认值 ──
  const [pos, setPos] = useState<Pos>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        return { x: data.x ?? data.pos?.x ?? defaultPos.x, y: data.y ?? data.pos?.y ?? defaultPos.y };
      }
    } catch { /* ignore */ }
    return defaultPos;
  });

  const [rot, setRot] = useState<Rot>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.rot) return data.rot;
      }
    } catch { /* ignore */ }
    return { x: 0, y: 0 };
  });

  const [size, setSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.size) return data.size;
      }
    } catch { /* ignore */ }
    return defaultFontSize;
  });

  // ── ref 保持闭包中的最新值，避免 addEventListener 重复绑定 ──
  const dragging = useRef(false);
  const rotating = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const rotStart = useRef({ x: 0, y: 0 });
  const posRef = useRef(pos);
  const rotRef = useRef(rot);
  const sizeRef = useRef(size);
  posRef.current = pos;
  rotRef.current = rot;
  sizeRef.current = size;

  // 持久化全部状态
  const save = useCallback(() => {
    localStorage.setItem(storageKey, JSON.stringify({
      x: posRef.current.x,
      y: posRef.current.y,
      rot: rotRef.current,
      size: sizeRef.current,
    }));
  }, [storageKey]);

  // ── 左键开始拖拽 / Ctrl+左键开始旋转 ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      rotating.current = true;
      dragging.current = true;
      rotStart.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    dragging.current = true;
    rotating.current = false;
    dragOffset.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
  }, []);

  // ── 拖拽中：移动位置 或 旋转角度 ──
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    if (rotating.current) {
      const dx = e.clientX - rotStart.current.x;
      const dy = e.clientY - rotStart.current.y;
      const r = { x: rotRef.current.x + dy * 0.5, y: rotRef.current.y + dx * 0.5 };
      setRot(r);
      rotRef.current = r;
      return;
    }
    const p = { x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y };
    setPos(p);
    posRef.current = p;
  }, []);

  // ── 拖拽结束 → 保存 ──
  const onMouseUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    rotating.current = false;
    save();
  }, [save]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ── 滚轮调整字号 ──
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setSize((s) => {
      const next = Math.max(10, Math.min(120, s - Math.sign(e.deltaY) * 2));
      sizeRef.current = next;
      save();
      return next;
    });
  }, [save]);

  // ── 根据文字颜色自动适配阴影（黑色文字用白影，白色文字用黑影） ──
  const isDark = color !== '#fff';
  const textShadow = isDark
    ? '0 2px 8px rgba(255,255,255,0.45), 0 0 4px rgba(255,255,255,0.3)'
    : '0 2px 8px rgba(0,0,0,0.4)';

  return (
    <div
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        cursor: 'grab',
        zIndex: 10000,
        userSelect: 'none',
        color,
        fontFamily: 'monospace',
        textShadow,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: defaultLetterSpacing,
        lineHeight: 1.2,
        /* 3D 透视变换：perspective 定义视距，rotateX/Y 实现三维旋转 */
        transform: `perspective(600px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
      }}
    >
      {children}
    </div>
  );
}
