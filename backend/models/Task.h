#ifndef MODELS_TASK_H
#define MODELS_TASK_H

#include <string>
#include <json/value.h>

namespace models {

struct Task {
    int id = 0;
    int userId = 1;
    std::string title;
    std::string description;
    std::string topic;
    int priority = 1;
    std::string source = "custom";
    std::string type = "once";
    int intervalValue = 1;
    std::string intervalUnit = "day";
    std::string lastCheckIn;
    bool needReviewReminder = false;
    bool completed = false;
    std::string deadline;
    std::string createdAt;
    std::string completedAt;

    Json::Value toJson() const;
    static Task fromJson(const Json::Value& j);
};

}  // namespace models

#endif
