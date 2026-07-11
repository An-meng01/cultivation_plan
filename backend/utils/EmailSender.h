#ifndef UTILS_EMAIL_SENDER_H
#define UTILS_EMAIL_SENDER_H

#include <string>
#include <functional>

/*
 * 语言：C++17
 *
 * ─── 技术概述 ───
 * EmailSender 使用 SMTP 协议 + SSL/TLS 加密通过 QQ 邮箱发送提醒邮件。
 *
 * ─── SMTP 协议原理 ───
 *   SMTP（Simple Mail Transfer Protocol）是互联网邮件发送的标准协议，基于 TCP 文本交互。
 *   客户端→服务器发送 ASCII 命令，服务器返回状态码（如 250 表示成功）。
 *   核心流程：
 *     1. TCP 连接（本实现使用 smtp.qq.com:465，SSL 加密）
 *     2. EHLO <hostname>   → 服务器返回支持的扩展（如 AUTH LOGIN）
 *     3. AUTH LOGIN        → 开始 base64 认证
 *     4. base64(用户名)     → QQ 邮箱地址
 *     5. base64(授权码)     → QQ 邮箱 SMTP 授权码（非登录密码）
 *     6. MAIL FROM:<addr>  → 发件人地址
 *     7. RCPT TO:<addr>    → 收件人地址
 *     8. DATA              → 邮件正文（含 From/To/Subject 等 MIME 头）
 *     9. 以 . 单独一行结束
 *    10. QUIT
 *
 * ─── SSL/TLS 加密 ───
 *   使用 OpenSSL 的 BIO（Basic I/O）抽象层建立 SSL 加密连接。
 *   BIO_new_ssl_connect() 创建 SSL 连接 BIO，自动处理证书验证与加密握手。
 *   选择 465 端口（SSL 直连）而非 587（STARTTLS 升级），减少一次协议往返。
 *
 * ─── 配置方式 ───
 *   所有参数（服务器、端口、账号、授权码）从 config.json 的 "email" 字段读取，
 *   通过 EmailSender::initFromConfig() 初始化。若无配置则跳过发送并打日志。
 *
 * ─── QQ 邮箱授权码获取 ───
 *   QQ 邮箱 → 设置 → 账户 → POP3/IMAP/SMTP 服务 → 生成授权码。
 *   授权码是 16 位字母组合，代替登录密码用于 SMTP 认证。
 *
 * ─── 安全性注意 ───
 *   授权码属于敏感凭据，不应硬编码在源码中，应通过环境变量或配置文件管理。
 *   生产环境建议将 config.json 排除版本控制，使用独立的密钥管理服务。
 */

namespace utils {

// SMTP 发送返回结果
struct EmailResult {
    bool success;
    std::string message;  // 成功时为空，失败时包含原因
};

class EmailSender {
public:
    EmailSender();
    ~EmailSender();

    // 从 JSON 配置初始化 SMTP 参数
    // 格式: { "host": "smtp.qq.com", "port": 465, "username": "xxx@qq.com", "password": "授权码" }
    bool initFromConfig(const std::string& host, int port,
                        const std::string& username, const std::string& password);

    // 发送单封邮件
    // 参数: 收件人地址、邮件主题、邮件正文（纯文本）
    EmailResult send(const std::string& to, const std::string& subject,
                     const std::string& body);

    // 是否已初始化（有凭据）
    bool isReady() const { return ready_; }

private:
    // Base64 编码（SMTP AUTH LOGIN 需要）
    static std::string base64Encode(const std::string& in);

    bool ready_{false};
    std::string host_;
    int port_{465};
    std::string username_;
    std::string password_;
};

}  // namespace utils

#endif
