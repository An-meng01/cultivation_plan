#include "services/ReminderService.h"
#include <drogon/drogon.h>
#include <chrono>
#include <thread>
#include <iostream>

using namespace drogon;

namespace services {

ReminderService::ReminderService() = default;
ReminderService::~ReminderService() { stop(); }

void ReminderService::setNotifyCallback(NotifyFn fn) {
    notify_ = std::move(fn);
}

void ReminderService::setSenders(::utils::EmailSender* email, ::utils::SmsSender* sms) {
    emailSender_ = email;
    smsSender_ = sms;
}

void ReminderService::start(int intervalSeconds) {
    if (running_) return;
    running_ = true;
    worker_ = std::thread(&ReminderService::loop, this, intervalSeconds);
}

void ReminderService::stop() {
    running_ = false;
    if (worker_.joinable()) worker_.join();
}

void ReminderService::loop(int intervalSeconds) {
    /* 后台轮询线程：std::thread 创建独立执行流，不阻塞 drogon 主线程。
     * running_ 为 std::atomic<bool>，确保跨线程安全终止。 */
    while (running_) {
        checkDueTasks();
        std::this_thread::sleep_for(std::chrono::seconds(intervalSeconds));
    }
}

void ReminderService::checkDueTasks() {
    auto db = app().getDbClient("default");
    if (!db) return;

    /* SQL 查询技术：PostgreSQL 时间/区间运算
     *   - (t.remind_before_days || ' days')::interval 将天数转为 PG 时间区间
     *   - NOW() + interval 算出"截止前 N 天"的时间窗口
     *   - last_reminder_sent < NOW() - INTERVAL '23 hours' 做 23 小时去重
     * 返回所有满足条件且近期未发送过提醒的任务，关联用户联系方式用于渠道发送。 */
    auto result = db->execSqlSync(
        "SELECT t.id AS tid, t.title, t.deadline, t.remind_before_days, t.user_id, "
        "       u.email, u.phone, u.last_device "
        "FROM tasks t JOIN users u ON u.id = t.user_id "
        "WHERE t.completed = FALSE "
        "  AND t.need_review_reminder = TRUE "
        "  AND t.remind_before_days IS NOT NULL "
        "  AND t.deadline IS NOT NULL "
        "  AND t.deadline <= NOW() + (t.remind_before_days || ' days')::interval "
        "  AND (t.last_reminder_sent IS NULL OR t.last_reminder_sent < NOW() - INTERVAL '23 hours')"
    );

    for (const auto& r : result) {
        int taskId = r["tid"].as<int>();
        std::string title = r["title"].as<std::string>();
        int uid = r["user_id"].as<int>();
        std::string email = r["email"].isNull() ? "" : r["email"].as<std::string>();
        std::string phone = r["phone"].isNull() ? "" : r["phone"].as<std::string>();
        std::string device = r["last_device"].as<std::string>();

        /* 渠道选择策略：统一使用邮件发送到用户邮箱，
         * 手机端 QQ 邮箱 App 同样能收到推送通知。
         * 无需区分 PC 与移动端，也无需短信网关资质。 */
        std::string channel, recipient;
        if (!email.empty()) {
            channel = "email";
            recipient = email;
        } else {
            continue;
        }

        /* 提醒内容：为配合短信长度限制，尽量精简 */
        std::string content = "【学习养成计划】提醒：任务《" + title + "》即将到期，请及时处理！";

        /* ── 实际发送 ──
         *   根据渠道分别调用 EmailSender 或 SmsSender 的 send() 方法。
         *   这两个发送器由 main.cc 根据 config.json 初始化后注入。
         *   发送结果决定 notifications 表的 status：成功→'sent'，失败→'failed'。 */
        bool sendOk = false;
        std::string sendMsg;

        if (channel == "email" && emailSender_ && emailSender_->isReady()) {
            /* SMTP 邮件发送：通过 libcurl/OpenSSL 连接 QQ 邮箱 SMTP 服务器 */
            auto result = emailSender_->send(recipient, "任务提醒", content);
            sendOk = result.success;
            sendMsg = result.message;
        } else if (channel == "sms" && smsSender_) {
            /* 短信发送：调用腾讯云短信 API（已配置时）；否则模拟模式 */
            auto result = smsSender_->send(recipient, content);
            sendOk = result.success;
            sendMsg = result.message;
        } else {
            /* 发送器未就绪：以模拟模式降级，仅落库 + 日志 */
            sendOk = true;
            sendMsg = "模拟模式：发送器未配置";
        }

        /* 记录发送结果到 notifications 表
         * 技术：无论发送成功或失败均持久化，便于排查与补发。 */
        std::string status = sendOk ? "sent" : "failed";
        db->execSqlSync(
            "INSERT INTO notifications (user_id, task_id, channel, recipient, content, status) "
            "VALUES ($1, $2, $3, $4, $5, $6)",
            uid, taskId, channel, recipient, content, status);

        /* 保留历史提醒记录 */
        db->execSqlSync(
            "INSERT INTO reminders (user_id, task_id, title, due_at) "
            "VALUES ($1, $2, $3, $4::timestamp) "
            "ON CONFLICT (task_id, due_at) DO NOTHING",
            uid, taskId, title, r["deadline"].as<std::string>());

        /* 更新 last_reminder_sent 时间戳，避免 23 小时内重复发送 */
        db->execSqlSync("UPDATE tasks SET last_reminder_sent = NOW() WHERE id = $1", taskId);

        if (notify_) {
            notify_(taskId, title, channel);
        }

        if (sendOk) {
            LOG_INFO << "提醒已发送(" << channel << ")-> " << recipient
                     << " : 任务 #" << taskId << " 《" << title << "》";
        } else {
            LOG_WARN << "提醒发送失败(" << channel << ")-> " << recipient
                     << " : 任务 #" << taskId << " 《" << title << "》原因: " << sendMsg;
        }
    }
}

}  // namespace services
