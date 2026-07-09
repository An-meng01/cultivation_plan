// 响应处理工具：从统一返回结构 { code, message, data } 中提取业务错误信息（code!==0 时返回错误文案）。
// 后端所有接口都返回统一结构 { code, message, data }。
// 约定：code === 0 成功，其他数字（400/409/422/500...）都是业务失败。
// 但这个结构走的是 HTTP 200，axios 不会自动抛异常，所以我们要手动判断。
export function extractErrorMessage(res: unknown): string | null {
  const r = res as { code?: number; message?: unknown };
  if (typeof r?.code === 'number' && r.code !== 0) {
    // 优先用后端给的 message，没有就给个兜底文案
    return typeof r.message === 'string' && r.message ? r.message : '操作失败';
  }
  return null;
}
