#ifndef MODELS_CLOCK_RECORD_H
#define MODELS_CLOCK_RECORD_H

#include <string>
#include <json/value.h>

namespace models {

struct ClockRecord {
    int id = 0;
    int userId = 1;
    int taskId = 0;
    std::string taskTitle;
    std::string checkInTime;

    Json::Value toJson() const;
    static ClockRecord fromJson(const Json::Value& j);
};

}  // namespace models

#endif
