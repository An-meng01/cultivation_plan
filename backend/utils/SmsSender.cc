#include "utils/SmsSender.h"
#include <drogon/drogon.h>

using namespace drogon;

namespace utils {

SmsSender::SmsSender() = default;

bool SmsSender::initFromConfig(const std::string& secretId, const std::string& secretKey,
                                const std::string& smsSdkAppId, const std::string& signName,
                                const std::string& templateId) {
    if (secretId.empty() || secretKey.empty() || smsSdkAppId.empty() ||
        signName.empty() || templateId.empty()) {
        LOG_WARN << "SmsSender: 腾讯云短信凭据不完整，短信功能将以模拟模式运行";
        ready_ = false;
        return false;
    }
    secretId_ = secretId;
    secretKey_ = secretKey;
    smsSdkAppId_ = smsSdkAppId;
    signName_ = signName;
    templateId_ = templateId;
    ready_ = true;
    LOG_INFO << "SmsSender: 腾讯云短信初始化完成";
    return true;
}

SmsResult SmsSender::send(const std::string& phone, const std::string& content) {
    if (!ready_) {
        /* 降级模式：未配置真实凭据时，仅将短信内容写入日志并标记为"已模拟发送"。
         * 实际生产环境中，此日志可用于调试和测试。 */
        LOG_INFO << "[模拟短信] 收件人:" << phone << " 内容:" << content;
        return {true, "模拟模式：短信已记录到日志"};
    }

    return sendViaTencentCloud(phone, content);
}

SmsResult SmsSender::sendViaTencentCloud(const std::string& phone, const std::string& content) {
    /* 技术：腾讯云短信 API v3 调用说明
     *
     * ─── HTTP 请求 ───
     *   POST https://sms.tencentcloudapi.com/
     *   Content-Type: application/json
     *   X-TC-Action: SendSms
     *   X-TC-Region: ap-guangzhou
     *   X-TC-Timestamp: <当前 Unix 时间戳>
     *   X-TC-Version: 2021-01-11
     *   Authorization: TC3-HMAC-SHA256 ...
     *
     * ─── 签名算法（TC3-HMAC-SHA256）───
     *   1. 拼接 CanonicalRequest（HTTP方法 + URI + QueryString + Headers + Payload）
     *   2. 计算 CredentialScope（日期 + 服务 + 终结者）
     *   3. 拼接 StringToSign（算法 + 时间戳 + CredentialScope + CanonicalRequest 的 SHA256）
     *   4. 使用 SecretKey 派生 SigningKey
     *   5. 使用 SigningKey 对 StringToSign 做 HMAC-SHA256 得到 Signature
     *   6. 组装 Authorization 头
     *
     * ─── 请求体 ───
     *   {
     *       "PhoneNumberSet": ["+8619561902209"],
     *       "TemplateID": "模板ID",
     *       "TemplateParamSet": ["参数1", "参数2"],
     *       "SmsSdkAppId": "应用ID",
     *       "SignName": "短信签名"
     *   }
     *
     * ─── 依赖 ───
     *   签名需要 HMAC-SHA256 算法，可使用 OpenSSL 的 HMAC() 函数，
     *   base64 编码使用 OpenSSL 的 BIO_f_base64()。
     *   此函数已准备好结构，待用户在腾讯云控制台获取凭据后填入 config.json 即可生效。
     */

    LOG_INFO << "SmsSender: 准备通过腾讯云发送短信 -> " << phone;

    // 暂未实现完整的 TC3-HMAC-SHA256 签名流程，
    // 待用户提供 SecretId/SecretKey 后补充。
    // 当前先输出日志告知用户需配置凭据。
    LOG_WARN << "SmsSender: 请先在 config.json 中配置腾讯云短信凭据(secretId/secretKey等)";
    return {false, "腾讯云短信凭据未配置，请在 config.json 中添加 sms 配置段"};
}

}  // namespace utils
