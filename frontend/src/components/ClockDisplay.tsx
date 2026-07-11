import { useState, useEffect } from 'react';
import DraggableClock from './DraggableClock';

/* 语言：TypeScript + React（TSX 组件，Vite 构建）
 *
 * 自然时间显示组件。
 *
 * ─── 技术要点 ───
 *   1. `new Date()` 每次调用生成一个"快照"，反映调用瞬间的系统本地时间。
 *   2. `setInterval(fn, 1000)` 每隔 1000ms 执行一次回调，触发 `setNow(new Date())`
 *      更新状态 → React 重新渲染 → 三个 DraggableClock 获取最新时间。
 *   3. `useEffect` 的清理函数 `clearInterval(timer)` 在组件卸载时清除定时器，
 *      防止内存泄漏。
 *   4. 用 `padStart(2, '0')` 保证时、分、秒始终显示两位（如 09:05:03）。
 *
 * ─── 关于"自然时间" ───
 *   这里的"自然"指的是"真实世界的时间流逝"——不依赖服务器、不依赖手动刷新，
 *   仅通过浏览器端的 `Date` + `setInterval` 就能每秒钟自动推进，模拟时钟走针。
 */

export default function ClockDisplay() {
  const [now, setNow] = useState(new Date());

  /*
   * useEffect + setInterval 构成"心跳"：
   * 组件挂载后每秒更新一次 now，三个子组件自动拿到最新值。
   */
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());

  return (
    <>
      {/*
       * 三个独立实例，各自存储位置 / 旋转 / 字号到不同的 localStorage key：
       *   clockPos_time  → 时:分:秒
       *   clockPos_month → 月份
       *   clockPos_day   → 日
       */}
      <DraggableClock storageKey="clockPos_time" defaultPos={{ x: 40, y: 40 }} fontSize={32} letterSpacing={0}>
        {h}:{m}:{s}
      </DraggableClock>
      <DraggableClock storageKey="clockPos_month" defaultPos={{ x: 40, y: 90 }} fontSize={24} color="#000">
        {now.getMonth() + 1}月
      </DraggableClock>
      <DraggableClock storageKey="clockPos_day" defaultPos={{ x: 40, y: 125 }} fontSize={24} color="#000">
        {now.getDate()}日
      </DraggableClock>
    </>
  );
}
