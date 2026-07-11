#include <drogon/drogon.h>
#include <iostream>

#include "services/ReminderService.h"
#include "controllers/TaskController.h"
#include "controllers/ClockController.h"
#include "controllers/AnalysisController.h"
#include "controllers/ReminderController.h"
#include "controllers/AuthController.h"
#include "controllers/AdminController.h"
#include "utils/EmailSender.h"
#include "utils/SmsSender.h"

/*
 * 语言：C++17
 *
 * ─── 入口逻辑 ───
 *   1. 注册所有 HTTP 控制器（显式注册的 HttpController<false>）
 *   2. 从 config.json 读取 email/sms 配置并初始化发送器
 *   3. 后台提醒服务（ReminderService）绑定发送器并启动
 *   4. 启动 Drogon HTTP 服务器
 *
 * ─── 提醒发送链路 ───
 *   config.json (email/sms 凭据)
 *       ↓
 *   main.cc 读取 → 创建 EmailSender + SmsSender → 注入 ReminderService
 *       ↓
 *   ReminderService 后台轮询 → 到期任务 → 按设备选渠道 → send()
 *       ↓
 *   EmailSender::send()  → SMTP + SSL → QQ 邮箱
 *   SmsSender::send()    → HTTP API → 腾讯云短信（待配置）
 */

int main() {
    auto& app = drogon::app();

    /* 显式注册控制器（HttpController<..., false> 不会自动挂载路由） */
    app.registerController(std::make_shared<TaskController>());
    app.registerController(std::make_shared<ClockController>());
    app.registerController(std::make_shared<AnalysisController>());
    app.registerController(std::make_shared<ReminderController>());
    app.registerController(std::make_shared<AuthController>());
    app.registerController(std::make_shared<AdminController>());

    app.registerBeginningAdvice([&app]() {
        auto db = app.getDbClient("default");
        if (!db) {
            LOG_ERROR << "数据库连接失败";
            return;
        }
        LOG_INFO << "数据库连接成功，开始初始化...";
    });

    app.registerBeginningAdvice([&app]() {
        /* 技术：Drogon 的 registerBeginningAdvice 在 app.run() 启动前，
         * 且 loadConfigFile() 之后执行，此时可通过 app.getCustomConfig()
         * 读取 config.json 中的自定义字段。
         *
         * 此处初始化邮件/短信发送器，从 config.json 读取 SMTP 与腾讯云短信凭据。 */

        /* ── EmailSender 初始化 ──
         * 从 config.json 的 "email" 字段读取 SMTP 参数。
         * QQ 邮箱 SMTP：smtp.qq.com:465（SSL 直连），使用授权码认证。
         * 若未配置或字段为空，EmailSender 会标记为未就绪，提醒服务以模拟模式降级。 */
        auto emailConfig = app.getCustomConfig()["email"];
        static utils::EmailSender emailSender;
        emailSender.initFromConfig(
            emailConfig["host"].asString(),
            emailConfig["port"].asInt(),
            emailConfig["username"].asString(),
            emailConfig["password"].asString()
        );

        /* ── SmsSender 初始化 ──
         * 从 config.json 的 "sms" 字段读取腾讯云短信凭据。
         * 凭据获取方式（详见 SmsSender.h 注释）：
         *   1. 在腾讯云控制台开通短信服务
         *   2. 申请短信签名与模板
         *   3. 创建 API 密钥
         * 各字段均为空时，SmsSender 以模拟模式运行（仅记录日志）。 */
        auto smsConfig = app.getCustomConfig()["sms"];
        static utils::SmsSender smsSender;
        smsSender.initFromConfig(
            smsConfig["secret_id"].asString(),
            smsConfig["secret_key"].asString(),
            smsConfig["sms_sdk_app_id"].asString(),
            smsConfig["sign_name"].asString(),
            smsConfig["template_id"].asString()
        );

        /* ── 提醒服务启动 ──
         * 创建 ReminderService 实例，注入发送器，启动后台轮询线程。
         * 轮询间隔 120 秒，每次检查到期任务并调用发送器。 */
        static services::ReminderService reminder;
        reminder.setSenders(&emailSender, &smsSender);
        reminder.setNotifyCallback([](int taskId, const std::string& title, const std::string& channel) {
            LOG_INFO << "提醒(" << channel << "): 任务 #" << taskId << " \""
                     << title << "\" 即将到期，请及时处理！";
        });
        reminder.start(120);
        LOG_INFO << "提醒服务已启动 (每 120 秒检查一次)";

        if (emailSender.isReady()) {
            LOG_INFO << "邮件发送器已就绪 (SMTP: " << emailConfig["host"].asString() << ")";
        } else {
            LOG_WARN << "邮件发送器未配置，邮件提醒功能禁用";
        }

        if (smsSender.isReady()) {
            LOG_INFO << "短信发送器已就绪 (腾讯云短信)";
        } else {
            LOG_WARN << "短信发送器未配置，短信提醒功能将以模拟模式运行，"
                     << "请按 SmsSender.h 注释指引在腾讯云控制台获取凭据并填入 config.json";
        }
    });

    app.setLogLevel(trantor::Logger::kInfo);
    app.loadConfigFile("config.json");
    app.run();
    return 0;
}
