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
    while (running_) {
        checkDueTasks();
        std::this_thread::sleep_for(std::chrono::seconds(intervalSeconds));
    }
}

void ReminderService::checkDueTasks() {
    auto db = app().getDbClient("default");
    if (!db) return;

    auto f = db->execSqlCoro(
        "SELECT id, title FROM tasks "
        "WHERE completed = FALSE AND need_review_reminder = TRUE "
        "AND deadline <= NOW() + INTERVAL '1 hour' "
        "AND deadline > NOW() - INTERVAL '1 hour'"
    );

    while (!f.done()) {
        auto row = f.result();
        if (!row.empty()) {
            for (const auto& r : row) {
                int id = r["id"].as<int>();
                std::string title = r["title"].as<std::string>();
                if (notify_) {
                    notify_(id, title);
                }
                LOG_INFO << "提醒: 任务 #" << id << " \"" << title << "\" 即将到期";
            }
        }
        f.next();
    }
}

}  // namespace services
