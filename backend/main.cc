#include <drogon/drogon.h>
#include <iostream>
#include "services/ReminderService.h"
#include "controllers/TaskController.h"
#include "controllers/ClockController.h"
#include "controllers/AnalysisController.h"
#include "controllers/ReminderController.h"
#include "controllers/AuthController.h"
#include "controllers/AdminController.h"

int main() {
    auto& app = drogon::app();

    // 显式注册控制器（HttpController<..., false> 不会自动挂载路由）
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

    app.registerBeginningAdvice([]() {
        // 技术：在应用启动钩子里启动后台提醒服务（独立于 HTTP 请求的后台线程），
        // 每 120 秒轮询一次到期任务并按设备分渠道(邮件/短信)生成提醒。
        static services::ReminderService reminder;
        reminder.setNotifyCallback([](int taskId, const std::string& title, const std::string& channel) {
            LOG_INFO << "⏰ 提醒(" << channel << "): 任务 #" << taskId << " \"" << title
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
