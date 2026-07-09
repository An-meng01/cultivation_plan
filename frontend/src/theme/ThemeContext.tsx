// 主题上下文：通过 Context 提供明暗主题状态与切换方法，并用 antd ConfigProvider 实现全局换肤（含中文 locale）。
import { createContext, useContext, useState, ReactNode } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 【React 概念：Context —— 跨组件共享状态】
// isDark / toggle 需要在"顶栏按钮"和"最外层的 ConfigProvider"两处共用。
// 如果一层层用 props 传太麻烦，就用 Context 建一个"全局共享盒子"，
// 任何子组件都能用 useTheme() 直接取，不用逐层传递。
type ThemeCtx = { isDark: boolean; toggle: () => void };
const Ctx = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 【React 概念：useState 初始化函数 + 读 localStorage】
  // 初始值用函数 () => 写法，只在首次渲染执行一次，从 localStorage 读上次选择，实现"记住主题"。
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // 切换时：先翻状态，再把新值写回 localStorage（下次打开还是这个主题）
  const toggle = () => {
    setIsDark((v) => {
      const next = !v;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    // 把状态放进 Context，供所有子组件读取
    <Ctx.Provider value={{ isDark, toggle }}>
      {/* 【React 概念：ConfigProvider + 暗色算法】
          algorithm 决定整套管家级配色。darkAlgorithm 让所有 antd 组件自动变暗色皮肤。
          isDark 一变，这里重新渲染，全站换肤——又是"状态驱动 UI"。 */}
      <ConfigProvider
        locale={zhCN}
        theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}
      >
        {children}
      </ConfigProvider>
    </Ctx.Provider>
  );
}
