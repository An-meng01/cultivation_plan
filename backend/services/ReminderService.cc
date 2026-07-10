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
    // 技术：独立后台线程（std::thread）+ std::this_thread::sleep_for 实现定时轮询，
    // 不阻塞主线程的 HTTP 请求处理。running_ 为 atomic<bool>，stop() 时安全退出。
    while (running_) {
        checkDueTasks();
        std::this_thread::sleep_for(std::chrono::seconds(intervalSeconds));
    }
}

void ReminderService::checkDueTasks() {
    auto db = app().getDbClient("default");
    if (!db) return;

    // 技术：PostgreSQL 时间/区间运算
    //  - (remind_before_days || ' days')::interval 把天数拼成间隔
    //  - NOW() + interval 算出"截止前 N 天"的时间窗
    //  - last_reminder_sent < NOW() - '23 hours' 做去重，避免重复提醒
    // 取出所有开启提醒、且进入"提前 N 天"窗口、且近期未提醒过的任务，
    // 关联用户邮箱/电话/设备用于选择提醒渠道。
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

        // 渠道选择（按设备分渠道）：移动端走短信，PC 端走邮件；无对应联系方式则跳过
        // 技术：依据 users.last_device 字段分流，对应联系方式取自 email / phone 列。
        std::string channel, recipient;
        if (device == "mobile" && !phone.empty()) {
            channel = "sms";
            recipient = phone;
        } else if (!email.empty()) {
            channel = "email";
            recipient = email;
        } else {
            continue;
        }

        std::string content = "【学习养成计划】提醒：任务《" + title + "》即将到期，请及时处理！";

        // 技术：提醒发送记录持久化到 notifications 表（channel/recipient/content/status）。
        // 真实环境应在此调用邮件(SMTP)/短信(网关)服务并据返回更新 status；
        // 当前无网关凭据，以"落库 + 日志"模拟发送（见下方 LOG_INFO）。
        db->execSqlSync(
            "INSERT INTO notifications (user_id, task_id, channel, recipient, content, status) "
            "VALUES ($1, $2, $3, $4, $5, 'sent')",
            uid, taskId, channel, recipient, content);

        // 保留历史提醒记录（与已有 reminders 表兼容）
        db->execSqlSync(
            "INSERT INTO reminders (user_id, task_id, title, due_at) "
            "VALUES ($1, $2, $3, $4::timestamp) "
            "ON CONFLICT (task_id, due_at) DO NOTHING",
            uid, taskId, title, r["deadline"].as<std::string>());

        db->execSqlSync("UPDATE tasks SET last_reminder_sent = NOW() WHERE id = $1", taskId);

        if (notify_) {
            notify_(taskId, title, channel);
        }
        LOG_INFO << "提醒已发送(" << channel << ")-> " << recipient
                 << " : 任务 #" << taskId << " 《" << title << "》";
    }
}

}  // namespace services
