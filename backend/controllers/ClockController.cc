#include "controllers/ClockController.h"
#include "models/ClockRecord.h"
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

void ClockController::clockIn(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("taskId")) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "missing taskId"));
        callback(resp);
        return;
    }

    int taskId = (*json)["taskId"].asInt();
    auto db = app().getDbClient("default");

    auto f = db->execSqlCoro(
        "SELECT title FROM tasks WHERE id = $1", taskId);

    if (f.result().empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(404, "task not found"));
        callback(resp);
        return;
    }

    std::string title = f.result()[0]["title"].as<std::string>();
    db->execSqlCoro(
        "INSERT INTO clock_records (user_id, task_id, task_title) "
        "VALUES ($1, $2, $3)",
        1, taskId, title);

    db->execSqlCoro(
        "UPDATE tasks SET completed = TRUE, completed_at = NOW() "
        "WHERE id = $1 AND completed = FALSE", taskId);

    Json::Value data;
    data["message"] = "checked in";
    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    resp->setStatusCode(k201Created);
    callback(resp);
}

void ClockController::getRecords(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    auto params = req->parameters();
    auto db = app().getDbClient("default");

    std::string sql =
        "SELECT id, task_id, task_title, check_in_time "
        "FROM clock_records WHERE user_id = $1";
    auto it = params.find("taskId");
    if (it != params.end()) {
        sql += " AND task_id = " + it->second;
    }
    it = params.find("date");
    if (it != params.end()) {
        sql += " AND DATE(check_in_time) = '" + it->second + "'";
    }
    sql += " ORDER BY check_in_time DESC";

    auto f = db->execSqlCoro(sql, 1);

    Json::Value arr(Json::arrayValue);
    while (!f.done()) {
        for (auto& row : f.result()) {
            Json::Value j;
            j["id"] = row["id"].as<int>();
            j["taskId"] = row["task_id"].as<int>();
            j["taskTitle"] = row["task_title"].as<std::string>();
            j["checkInTime"] = row["check_in_time"].as<std::string>();
            arr.append(j);
        }
        f.next();
    }

    auto resp = HttpResponse::newHttpJsonResponse(ok(arr));
    callback(resp);
}
