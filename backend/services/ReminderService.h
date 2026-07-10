#ifndef SERVICES_REMINDER_SERVICE_H
#define SERVICES_REMINDER_SERVICE_H

#include <string>
#include <thread>
#include <atomic>
#include <functional>
#include <unordered_map>
#include <unordered_set>

namespace services {

class ReminderService {
public:
    using NotifyFn = std::function<void(int taskId, const std::string& title, const std::string& channel)>;

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
    std::atomic<int> pollCount_{0};
    NotifyFn notify_;
    // Dedup cache: key = "taskId_batch", value = whether already reminded
    std::unordered_map<std::string, bool> remindedCache_;
    // Priority -> interval mapping (rounds between reminders)
    // 3=紧急:1, 2=高:2, 1=中:6, 0=低:12
    static constexpr int INTERVAL_EMERGENCY = 1;
    static constexpr int INTERVAL_HIGH = 2;
    static constexpr int INTERVAL_MEDIUM = 6;
    static constexpr int INTERVAL_LOW = 12;
};

}  // namespace services

#endif
