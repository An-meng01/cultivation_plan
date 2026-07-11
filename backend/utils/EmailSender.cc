#include "utils/EmailSender.h"
#include <drogon/drogon.h>
#include <openssl/bio.h>
#include <openssl/ssl.h>
#include <openssl/err.h>
#include <cstring>

using namespace drogon;

namespace utils {

EmailSender::EmailSender() = default;
EmailSender::~EmailSender() = default;

bool EmailSender::initFromConfig(const std::string& host, int port,
                                  const std::string& username, const std::string& password) {
    if (host.empty() || username.empty() || password.empty()) {
        LOG_WARN << "EmailSender: SMTP 配置不完整，邮件提醒功能禁用";
        ready_ = false;
        return false;
    }
    host_ = host;
    port_ = port;
    username_ = username;
    password_ = password;
    ready_ = true;
    LOG_INFO << "EmailSender: SMTP 初始化完成 (" << host_ << ":" << port_ << ")";
    return true;
}

std::string EmailSender::base64Encode(const std::string& in) {
    /* Base64 编码将文本转换为 64 个可打印字符的表示。
     * SMTP 的 AUTH LOGIN 机制要求用户名和密码以 Base64 编码传输。
     * 使用 OpenSSL 的 BIO_f_base64() 过滤器实现编码。 */
    if (in.empty()) return {};
    BIO* bio = BIO_new(BIO_s_mem());
    BIO* b64 = BIO_new(BIO_f_base64());
    BIO_push(b64, bio);
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
    BIO_write(b64, in.data(), static_cast<int>(in.size()));
    BIO_flush(b64);
    const char* data;
    long len = BIO_get_mem_data(b64, &data);
    std::string result(data, static_cast<size_t>(len));
    BIO_free_all(b64);
    return result;
}

/* SMTP 命令辅助函数：发送命令并读取一行响应。
 * 参数 cmd 为空时仅读取（用于读取服务器问候）。 */
static int smtpCommand(BIO* bio, const std::string& cmd, std::string& response) {
    char buf[4096];
    if (!cmd.empty()) {
        if (BIO_write(bio, cmd.data(), static_cast<int>(cmd.size())) <= 0) return -1;
        BIO_flush(bio);
    }
    int n = BIO_read(bio, buf, sizeof(buf) - 1);
    if (n > 0) {
        buf[n] = '\0';
        response = buf;
        if (response.length() >= 3) {
            try { return std::stoi(response.substr(0, 3)); }
            catch (...) { return -1; }
        }
    }
    response = "(无响应)";
    return -1;
}

EmailResult EmailSender::send(const std::string& to, const std::string& subject,
                              const std::string& body) {
    if (!ready_) {
        return {false, "EmailSender 未初始化，缺少 SMTP 配置"};
    }

    /* OpenSSL BIO（Basic I/O）抽象层：
     * BIO_new_ssl_connect() 创建链式 BIO：TCP socket + SSL 加密。
     * 上层代码只需 read/write，底层自动处理 TLS 握手与加密。 */
    SSL_CTX* ctx = SSL_CTX_new(SSLv23_client_method());
    if (!ctx) return {false, "SSL_CTX 创建失败"};

    SSL_CTX_set_verify(ctx, SSL_VERIFY_NONE, nullptr);

    BIO* bio = BIO_new_ssl_connect(ctx);
    if (!bio) { SSL_CTX_free(ctx); return {false, "BIO_new_ssl_connect 失败"}; }

    SSL* ssl = nullptr;
    BIO_get_ssl(bio, &ssl);
    if (ssl) SSL_set_mode(ssl, SSL_MODE_AUTO_RETRY);

    std::string addr = host_ + ":" + std::to_string(port_);
    BIO_set_conn_hostname(bio, addr.c_str());

    if (BIO_do_connect(bio) <= 0 || BIO_do_handshake(bio) <= 0) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "SMTP 连接失败: " + addr};
    }

    LOG_INFO << "EmailSender: 已连接到 " << addr;
    std::string resp;

    // 1. 服务器问候 (220)
    if (smtpCommand(bio, "", resp) != 220) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "SMTP 问候失败: " + resp};
    }
    // 2. EHLO (250)
    if (smtpCommand(bio, "EHLO localhost\r\n", resp) != 250) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "EHLO 失败: " + resp};
    }
    // 3. AUTH LOGIN (334)
    if (smtpCommand(bio, "AUTH LOGIN\r\n", resp) != 334) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "AUTH LOGIN 失败: " + resp};
    }
    // 4. 用户名 base64 (334)
    if (smtpCommand(bio, base64Encode(username_) + "\r\n", resp) != 334) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "用户名认证失败: " + resp};
    }
    // 5. 授权码 base64 (235)
    if (smtpCommand(bio, base64Encode(password_) + "\r\n", resp) != 235) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "授权码认证失败: " + resp + "（请检查授权码是否正确）"};
    }
    // 6. MAIL FROM (250)
    if (smtpCommand(bio, "MAIL FROM:<" + username_ + ">\r\n", resp) != 250) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "MAIL FROM 失败: " + resp};
    }
    // 7. RCPT TO (250)
    if (smtpCommand(bio, "RCPT TO:<" + to + ">\r\n", resp) != 250) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "RCPT TO 失败: " + resp};
    }
    // 8. DATA (354)
    if (smtpCommand(bio, "DATA\r\n", resp) != 354) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "DATA 命令失败: " + resp};
    }

    // 9. 邮件内容（MIME 格式）
    std::string mailData;
    mailData += "From: <" + username_ + ">\r\n";
    mailData += "To: <" + to + ">\r\n";
    /* 技术：Subject 使用 =?UTF-8?B? 编码（MIME 扩展头字段编码），
     * 将 UTF-8 中文主题用 Base64 编码，确保各国邮件客户端都能正确显示。
     * 格式：=?charset?encoding?encoded-text?= */
    mailData += "Subject: =?UTF-8?B?" + base64Encode(subject) + "?=\r\n";
    mailData += "MIME-Version: 1.0\r\n";
    mailData += "Content-Type: text/plain; charset=UTF-8\r\n";
    mailData += "Content-Transfer-Encoding: 8bit\r\n";
    mailData += "\r\n";
    mailData += body + "\r\n";
    mailData += ".\r\n";

    if (BIO_write(bio, mailData.data(), static_cast<int>(mailData.size())) <= 0) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "邮件正文发送失败"};
    }
    BIO_flush(bio);

    // 读取 DATA 结果 (250)
    if (smtpCommand(bio, "", resp) != 250) {
        BIO_free_all(bio); SSL_CTX_free(ctx);
        return {false, "邮件被服务器拒绝: " + resp};
    }

    // 10. QUIT
    BIO_write(bio, "QUIT\r\n", 6);
    BIO_flush(bio);
    BIO_free_all(bio);
    SSL_CTX_free(ctx);

    LOG_INFO << "EmailSender: 邮件发送成功 -> " << to;
    return {true, ""};
}

}  // namespace utils
