// 响应处理工具：从统一返回结构 { code, message, data } 中提取业务错误信息（code!==0 时返回错误文案）。
// 后端所有接口都返回统一结构 { code, message, data }。
// 约定：code === 0 成功，其他数字（400/409/422/500...）都是业务失败。
// 但这个结构走的是 HTTP 200，axios 不会自动抛异常，所以我们要手动判断。
import { message } from 'antd';

// 统一的错误提示：退出登录（token 已清除）或鉴权失效时不再弹出业务错误，
// 避免出现“加载仪表盘失败”这类退出过程中的干扰提示。
export function notifyError(msg: string) {
  if (!localStorage.getItem('token')) return;
  message.error(msg);
}

export function extractErrorMessage(res: unknown): string | null {
  const r = res as { code?: number; message?: unknown };
  if (typeof r?.code === 'number' && r.code !== 0) {
    // 优先用后端给的 message，没有就给个兜底文案
    return typeof r.message === 'string' && r.message ? r.message : '操作失败';
  }
  return null;
}
