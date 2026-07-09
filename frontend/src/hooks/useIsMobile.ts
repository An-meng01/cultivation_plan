import { useState, useEffect } from 'react';

// 【React 概念：自定义 Hook + 副作用清理】
// 这个 Hook 对外只返回一个布尔值：当前是不是"手机宽度"。
export function useIsMobile(breakpoint = 768) {
  // 初始值用函数写法，首次渲染时读一次当前窗口宽度
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    // 监听浏览器窗口大小变化；窗口变窄/变宽就更新状态 → 组件重渲染
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);

    // 【React 概念：useEffect 的清理函数】
    // return 的函数在组件卸载或依赖变化前执行，用来"撤销"刚才的副作用，
    // 否则每次 resize 监听会越积越多（内存泄漏）。这是写副作用的标准动作。
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}
