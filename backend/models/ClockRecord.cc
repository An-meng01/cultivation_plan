#include "models/ClockRecord.h"

namespace models {

Json::Value ClockRecord::toJson() const {
    Json::Value j;
    j["id"] = id;
    j["taskId"] = taskId;
    j["taskTitle"] = taskTitle;
    j["checkInTime"] = checkInTime;
    return j;
}

ClockRecord ClockRecord::fromJson(const Json::Value& j) {
    ClockRecord r;
    r.taskId = j.get("taskId", 0).asInt();
    return r;
}

}  // namespace models
