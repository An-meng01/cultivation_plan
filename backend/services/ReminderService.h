#ifndef SERVICES_REMINDER_SERVICE_H
#define SERVICES_REMINDER_SERVICE_H

#include <string>
#include <thread>
#include <atomic>
#include <functional>

namespace services {

class ReminderService {
public:
    using NotifyFn = std::function<void(int taskId, const std::string& title)>;

    ReminderService();
    ~ReminderService();

    void start(int intervalSeconds = 60);
    void stop();
    void setNotifyCallback(NotifyFn fn);

private:
    void loop(int intervalSeconds);
    void checkDueTasks();

    std::thread worker_;
    std::atomic<bool> running_{false};
    NotifyFn notify_;
};

}  // namespace services

#endif
