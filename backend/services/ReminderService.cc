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
    int pollCount = 0;
    while (running_) {
        checkDueTasks(pollCount);
        ++pollCount;
        // Prevent overflow and periodic full cleanup
        if (pollCount >= 1000000) {
            pollCount = 0;
            remindedCache_.clear();
        }
        std::this_thread::sleep_for(std::chrono::seconds(intervalSeconds));
    }
}

void ReminderService::checkDueTasks(int pollCount) {
    auto db = app().getDbClient("default");
    if (!db) return;

    auto result = db->execSqlSync(
        "SELECT id, title, priority, user_id, deadline FROM tasks "
        "WHERE completed = FALSE AND need_review_reminder = TRUE "
        "AND deadline <= NOW() + INTERVAL '1 hour' "
        "AND deadline > NOW() - INTERVAL '1 hour'"
    );

    for (const auto& r : result) {
        int id = r["id"].as<int>();
        std::string title = r["title"].as<std::string>();
        int priority = r["priority"].as<int>();
        int uid = r["user_id"].as<int>();
        std::string deadline = r["deadline"].as<std::string>();

        // Determine interval based on priority
        int interval;
        switch (priority) {
            case 3: interval = INTERVAL_EMERGENCY; break;
            case 2: interval = INTERVAL_HIGH;      break;
            case 1: interval = INTERVAL_MEDIUM;    break;
            default: interval = INTERVAL_LOW;      break;
        }

        // Only remind on the configured interval
        if (pollCount % interval != 0) continue;

        int batch = pollCount / interval;
        std::string key = std::to_string(id) + "_" + std::to_string(batch);
        if (remindedCache_.count(key)) continue;

        remindedCache_[key] = true;

        // 持久化提醒：同一任务同一截止时间只写入一次
        db->execSqlSync(
            "INSERT INTO reminders (user_id, task_id, title, due_at) "
            "VALUES ($1, $2, $3, $4::timestamp) "
            "ON CONFLICT (task_id, due_at) DO NOTHING",
            uid, id, title, deadline);

        if (notify_) {
            notify_(id, title);
        }
        LOG_INFO << "提醒: 任务 #" << id << " \"" << title << "\" 即将到期 (优先级=" << priority << ")";
    }
}

}  // namespace services
