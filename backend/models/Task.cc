#include "models/Task.h"

namespace models {

Json::Value Task::toJson() const {
    Json::Value j;
    j["id"] = id;
    j["title"] = title;
    j["description"] = description;
    j["topic"] = topic;
    j["priority"] = priority;
    j["source"] = source;
    j["type"] = type;
    j["intervalValue"] = intervalValue;
    j["intervalUnit"] = intervalUnit;
    j["lastCheckIn"] = lastCheckIn.empty() ? Json::Value() : lastCheckIn;
    j["needReviewReminder"] = needReviewReminder;
    j["completed"] = completed;
    j["deadline"] = deadline.empty() ? Json::Value() : deadline;
    j["createdAt"] = createdAt;
    j["completedAt"] = completedAt.empty() ? Json::Value() : completedAt;
    return j;
}

Task Task::fromJson(const Json::Value& j) {
    Task t;
    t.title = j.get("title", "").asString();
    t.description = j.get("description", "").asString();
    t.topic = j.get("topic", "").asString();
    t.priority = j.get("priority", 1).asInt();
    t.source = j.get("source", "custom").asString();
    std::string typeVal = j.get("type", "once").asString();
    if (typeVal == "daily" || typeVal == "periodic") t.type = typeVal;
    else t.type = "once";
    t.intervalValue = j.get("intervalValue", 1).asInt();
    t.intervalUnit = j.get("intervalUnit", "day").asString();
    if (t.intervalUnit != "week" && t.intervalUnit != "month") t.intervalUnit = "day";
    if (j.isMember("lastCheckIn") && !j["lastCheckIn"].isNull())
        t.lastCheckIn = j["lastCheckIn"].asString();
    t.needReviewReminder = j.get("needReviewReminder", false).asBool();
    if (j.isMember("deadline") && !j["deadline"].isNull())
        t.deadline = j["deadline"].asString();
    return t;
}

}  // namespace models
