// 入口文件：挂载 React 应用，包裹 BrowserRouter（路由）与 ThemeProvider（主题）。
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './theme/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ThemeProvider 内部已经包含了 ConfigProvider（locale + 暗色算法），
          所以这里不再单独写 ConfigProvider，避免重复包裹 */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
