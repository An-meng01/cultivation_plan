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
    t.needReviewReminder = j.get("needReviewReminder", false).asBool();
    if (j.isMember("deadline") && !j["deadline"].isNull())
        t.deadline = j["deadline"].asString();
    return t;
}

}  // namespace models
