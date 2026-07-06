#include <drogon/drogon.h>
#include <iostream>
#include "services/ReminderService.h"

int main() {
    auto& app = drogon::app();

    app.registerBeginningJob([&app]() {
        auto db = app.getDbClient("default");
        if (!db) {
            LOG_ERROR << "数据库连接失败";
            return;
        }
        LOG_INFO << "数据库连接成功，开始初始化...";
    });

    app.registerBeginningJob([]() {
        static services::ReminderService reminder;
        reminder.setNotifyCallback([](int taskId, const std::string& title) {
            LOG_INFO << "⏰ 提醒: 任务 #" << taskId << " \"" << title
                     << "\" 即将到期，请及时处理！";
        });
        reminder.start(120);
        LOG_INFO << "提醒服务已启动 (每 120 秒检查一次)";
    });

    app.setLogLevel(trantor::Logger::kInfo);
    app.loadConfigFile("config.json");
    app.run();
    return 0;
}
