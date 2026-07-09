#include "controllers/ReminderController.h"
#include "utils/AuthContext.h"
#include <drogon/drogon.h>

using namespace drogon;

static Json::Value ok(const Json::Value& data = Json::Value()) {
    Json::Value j;
    j["code"] = 0;
    j["data"] = data;
    return j;
}

static Json::Value fail(int code, const std::string& msg) {
    Json::Value j;
    j["code"] = code;
    j["message"] = msg;
    return j;
}

void ReminderController::list(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    int userId = auth_utils::getUserId(req);
    auto db = app().getDbClient("default");

    auto result = db->execSqlSync(
        "SELECT id, task_id, title, due_at, acknowledged, created_at "
        "FROM reminders WHERE user_id = $1 ORDER BY due_at ASC",
        userId);

    Json::Value arr(Json::arrayValue);
    for (const auto& row : result) {
        Json::Value j;
        j["id"] = row["id"].as<int>();
        j["taskId"] = row["task_id"].isNull() ? Json::Value() : row["task_id"].as<int>();
        j["title"] = row["title"].as<std::string>();
        j["dueAt"] = row["due_at"].as<std::string>();
        j["acknowledged"] = row["acknowledged"].as<bool>();
        j["createdAt"] = row["created_at"].as<std::string>();
        arr.append(j);
    }

    auto resp = HttpResponse::newHttpJsonResponse(ok(arr));
    callback(resp);
}

void ReminderController::ack(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback,
    int id) {
    int userId = auth_utils::getUserId(req);
    auto db = app().getDbClient("default");

    db->execSqlSync(
        "UPDATE reminders SET acknowledged = TRUE "
        "WHERE id = $1 AND user_id = $2",
        id, userId);

    auto resp = HttpResponse::newHttpJsonResponse(ok());
    callback(resp);
}
