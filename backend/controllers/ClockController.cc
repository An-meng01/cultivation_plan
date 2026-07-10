#include "controllers/ClockController.h"
#include "models/ClockRecord.h"
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
    int userId = auth_utils::getUserId(req);
    auto db = app().getDbClient("default");

    auto result = db->execSqlSync(
        "SELECT id, title, type, interval_value, interval_unit, "
        "last_check_in, completed, created_at "
        "FROM tasks WHERE id = $1 AND user_id = $2", taskId, userId);

    if (result.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(404, "task not found"));
        callback(resp);
        return;
    }

    std::string title = result[0]["title"].as<std::string>();
    std::string type = result[0]["type"].as<std::string>();
    int intervalValue = result[0]["interval_value"].as<int>();
    std::string intervalUnit = result[0]["interval_unit"].as<std::string>();
    bool completed = result[0]["completed"].as<bool>();
    std::string lastCheckIn = result[0]["last_check_in"].as<std::string>();
    std::string createdAt = result[0]["created_at"].as<std::string>();

    // 按任务类型做重复打卡判定
    if (type == "once") {
        // 一次性任务：已完成则不可再打卡
        if (completed) {
            auto resp = HttpResponse::newHttpJsonResponse(fail(409, "already completed"));
            resp->setStatusCode(k409Conflict);
            callback(resp);
            return;
        }
    } else if (type == "daily") {
        // 每天打卡：当天已打过则视为重复
        auto dup = db->execSqlSync(
            "SELECT 1 FROM clock_records "
            "WHERE task_id = $1 AND user_id = $2 AND DATE(check_in_time) = CURRENT_DATE",
            taskId, userId);
        if (!dup.empty()) {
            auto resp = HttpResponse::newHttpJsonResponse(fail(409, "already checked in today"));
            resp->setStatusCode(k409Conflict);
            callback(resp);
            return;
        }
    } else {
        // 周期任务：本周期（上次打卡至今）已打过则视为重复
        std::string cycleStart = lastCheckIn.empty() ? createdAt : lastCheckIn;
        auto dup = db->execSqlSync(
            "SELECT 1 FROM clock_records "
            "WHERE task_id = $1 AND user_id = $2 "
            "AND check_in_time >= $3::timestamp "
            "AND check_in_time < $3::timestamp + ($4 || ' ' || $5)::interval",
            taskId, userId, cycleStart, std::to_string(intervalValue), intervalUnit);
        if (!dup.empty()) {
            auto resp = HttpResponse::newHttpJsonResponse(fail(409, "already checked in this period"));
            resp->setStatusCode(k409Conflict);
            callback(resp);
            return;
        }
    }

    db->execSqlSync(
        "INSERT INTO clock_records (user_id, task_id, task_title) "
        "VALUES ($1, $2, $3)",
        userId, taskId, title);

    // 记录最近打卡时间（所有类型都更新，供周期任务判断下一周期）
    db->execSqlSync(
        "UPDATE tasks SET last_check_in = NOW() WHERE id = $1", taskId);

    // 仅“一次性”任务在打卡后标记完成；每天/周期任务保持待打卡，可循环打卡
    if (type == "once") {
        db->execSqlSync(
            "UPDATE tasks SET completed = TRUE, completed_at = NOW() "
            "WHERE id = $1 AND completed = FALSE", taskId);
    }

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

    std::string taskId = params.find("taskId") != params.end() ? params.at("taskId") : "";
    std::string date = params.find("date") != params.end() ? params.at("date") : "";
    int userId = auth_utils::getUserId(req);

    auto result = db->execSqlSync(
        "SELECT id, task_id, task_title, check_in_time "
        "FROM clock_records WHERE user_id = $1"
        " AND ($2 = '' OR task_id = $2::int)"
        " AND ($3 = '' OR DATE(check_in_time) = $3::date)"
        " ORDER BY check_in_time DESC",
        userId, taskId, date);

    Json::Value arr(Json::arrayValue);
    for (const auto& row : result) {
        Json::Value j;
        j["id"] = row["id"].as<int>();
        j["taskId"] = row["task_id"].isNull() ? Json::Value() : row["task_id"].as<int>();
        j["taskTitle"] = row["task_title"].as<std::string>();
        j["checkInTime"] = row["check_in_time"].as<std::string>();
        arr.append(j);
    }

    auto resp = HttpResponse::newHttpJsonResponse(ok(arr));
    callback(resp);
}
