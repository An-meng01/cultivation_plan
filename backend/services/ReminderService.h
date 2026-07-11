#ifndef SERVICES_REMINDER_SERVICE_H
#define SERVICES_REMINDER_SERVICE_H

#include <string>
#include <thread>
#include <atomic>
#include <functional>
#include <unordered_map>
#include <unordered_set>
#include "utils/EmailSender.h"
#include "utils/SmsSender.h"

/*
 * 语言：C++17
 *
 * ─── 技术概述 ───
 * ReminderService 在独立后台线程中定期轮询数据库，查找即将到期的任务，
 * 根据用户上次登录设备选择渠道（PC→邮件，移动端→短信），
 * 通过 EmailSender / SmsSender 发送真实提醒。
 *
 * ─── 关键设计 ───
 *   - 后台线程 + sleep_for 定时轮询，不阻塞 HTTP 请求处理
 *   - 23 小时去重窗口防止重复提醒
 *   - 按设备分流（users.last_device）使提醒到达用户最可能看到的终端
 *   - 提醒记录持久化到 notifications 表，支持审计与重发
 */

namespace services {

class ReminderService {
public:
    using NotifyFn = std::function<void(int taskId, const std::string& title, const std::string& channel)>;

    ReminderService();
    ~ReminderService();

    void start(int intervalSeconds = 60);
    void stop();
    void setNotifyCallback(NotifyFn fn);

    // 注入邮件/短信发送器（由 main.cc 从 config.json 读取配置后创建）
    void setSenders(utils::EmailSender* email, utils::SmsSender* sms);

private:
    void loop(int intervalSeconds);
    void checkDueTasks();

    std::thread worker_;
    std::atomic<bool> running_{false};
    std::atomic<int> pollCount_{0};
    NotifyFn notify_;

    utils::EmailSender* emailSender_{nullptr};
    utils::SmsSender* smsSender_{nullptr};

    std::unordered_map<std::string, bool> remindedCache_;
    static constexpr int INTERVAL_EMERGENCY = 1;
    static constexpr int INTERVAL_HIGH = 2;
    static constexpr int INTERVAL_MEDIUM = 6;
    static constexpr int INTERVAL_LOW = 12;
};

}  // namespace services

#endif
