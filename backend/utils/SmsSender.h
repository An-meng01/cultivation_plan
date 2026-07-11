#ifndef UTILS_SMS_SENDER_H
#define UTILS_SMS_SENDER_H

#include <string>

/*
 * 语言：C++17
 *
 * ─── 技术概述 ───
 * SmsSender 负责通过第三方短信网关发送提醒短信。
 * 当前支持腾讯云短信（Tencent Cloud SMS）API v3。
 *
 * ─── 腾讯云短信接入流程 ───
 *   1. 登录 console.cloud.tencent.com → 搜索"短信"
 *   2. 开通短信服务 → 申请短信签名（短信开头【】内的名称）
 *   3. 创建短信模板（审核通过后获得模板 ID）
 *   4. 在 API 密钥管理 → 新建密钥，获取 SecretId 和 SecretKey
 *   5. 将以上信息填入 config.json 的 "sms" 字段
 *
 * ─── API 调用方式 ───
 *   腾讯云短信 API v3 基于 HTTP POST + JSON，使用 HMAC-SHA256 签名认证。
 *   本实现使用 Drogon::HttpClient 发送请求，签名过程参考腾讯云官方文档：
 *   https://cloud.tencent.com/document/product/382/55959
 *
 * ─── 注意事项 ───
 *   - 短信签名需在腾讯云控制台申请并审核通过
 *   - 短信模板也需审核通过
 *   - 国内短信需要备案模板内容
 *   - 未配置凭据时，SmsSender 以降级模拟模式运行（仅打日志）
 */

namespace utils {

struct SmsResult {
    bool success;
    std::string message;
};

class SmsSender {
public:
    SmsSender();
    ~SmsSender() = default;

    // 从配置初始化：secretId, secretKey, smsSdkAppId, signName, templateId
    // 任一为空则视为未配置，send() 将以模拟模式运行
    bool initFromConfig(const std::string& secretId, const std::string& secretKey,
                        const std::string& smsSdkAppId, const std::string& signName,
                        const std::string& templateId);

    // 发送短信
    // 参数: 手机号（如 "19561902209"）、模板参数（如 {"张三", "3月15日"}）
    // 返回: SmsResult
    SmsResult send(const std::string& phone, const std::string& content);

    bool isReady() const { return ready_; }

private:
    // 使用 Drogon HttpClient 调用腾讯云 API
    SmsResult sendViaTencentCloud(const std::string& phone, const std::string& content);

    bool ready_{false};
    std::string secretId_;
    std::string secretKey_;
    std::string smsSdkAppId_;  // 短信应用 ID（在短信控制台创建应用获得）
    std::string signName_;     // 短信签名（需审核通过）
    std::string templateId_;   // 短信模板 ID（需审核通过）
};

}  // namespace utils

#endif
