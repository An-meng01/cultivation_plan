#include "controllers/TaskController.h"
#include "models/Task.h"
#include "utils/AuthContext.h"
#include <drogon/drogon.h>
#include <json/value.h>

using namespace drogon;
using namespace drogon::orm;

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

void TaskController::getAll(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    auto params = req->parameters();
    auto db = app().getDbClient("default");
    int userId = auth_utils::getUserId(req);

    std::string topic = params.find("topic") != params.end() ? params.at("topic") : "";
    std::string priority = params.find("priority") != params.end() ? params.at("priority") : "";
    std::string source = params.find("source") != params.end() ? params.at("source") : "";
    std::string completed = params.find("completed") != params.end() ? params.at("completed") : "";
    std::string type = params.find("type") != params.end() ? params.at("type") : "";

    auto result = db->execSqlSync(
        "SELECT * FROM tasks WHERE user_id = $1"
        " AND ($2 = '' OR topic = $2)"
        " AND ($3 = '' OR priority = $3::int)"
        " AND ($4 = '' OR source = $4)"
        " AND ($5 = '' OR completed::text = $5)"
        " AND ($6 = '' OR type = $6)"
        " ORDER BY created_at DESC",
        userId, topic, priority, source, completed, type);

    Json::Value arr(Json::arrayValue);
    for (const auto& row : result) {
        models::Task t;
        t.id = row["id"].as<int>();
        t.title = row["title"].as<std::string>();
        t.description = row["description"].as<std::string>();
        t.topic = row["topic"].as<std::string>();
        t.priority = row["priority"].as<int>();
        t.source = row["source"].as<std::string>();
        t.type = row["type"].as<std::string>();
        t.intervalValue = row["interval_value"].as<int>();
        t.intervalUnit = row["interval_unit"].as<std::string>();
        t.lastCheckIn = row["last_check_in"].as<std::string>();
        t.needReviewReminder = row["need_review_reminder"].as<bool>();
        t.completed = row["completed"].as<bool>();
        t.reviewStatus = row["review_status"].isNull() ? "none" : row["review_status"].as<std::string>();
        t.deadline = row["deadline"].as<std::string>();
        t.createdAt = row["created_at"].as<std::string>();
        t.completedAt = row["completed_at"].as<std::string>();
        arr.append(t.toJson());
    }

    auto resp = HttpResponse::newHttpJsonResponse(ok(arr));
    callback(resp);
}

void TaskController::getOne(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback,
    int id) {
    auto db = app().getDbClient("default");
    int userId = auth_utils::getUserId(req);
    auto result = db->execSqlSync(
        "SELECT * FROM tasks WHERE id = $1 AND user_id = $2", id, userId);

    if (result.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(404, "not found"));
        resp->setStatusCode(k404NotFound);
        callback(resp);
        return;
    }

    const auto& row = result[0];
    models::Task t;
    t.id = row["id"].as<int>();
    t.title = row["title"].as<std::string>();
    t.description = row["description"].as<std::string>();
    t.topic = row["topic"].as<std::string>();
    t.priority = row["priority"].as<int>();
    t.source = row["source"].as<std::string>();
    t.type = row["type"].as<std::string>();
    t.intervalValue = row["interval_value"].as<int>();
    t.intervalUnit = row["interval_unit"].as<std::string>();
    t.lastCheckIn = row["last_check_in"].as<std::string>();
    t.needReviewReminder = row["need_review_reminder"].as<bool>();
    t.completed = row["completed"].as<bool>();
    t.reviewStatus = row["review_status"].isNull() ? "none" : row["review_status"].as<std::string>();
    t.deadline = row["deadline"].as<std::string>();
    t.createdAt = row["created_at"].as<std::string>();
    t.completedAt = row["completed_at"].as<std::string>();

    auto resp = HttpResponse::newHttpJsonResponse(ok(t.toJson()));
    callback(resp);
}

void TaskController::create(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "invalid json"));
        callback(resp);
        return;
    }

    auto t = models::Task::fromJson(*json);
    std::string source = json->get("source", "").asString();
    if (source != "system") source = "custom";
    t.source = source;
    int userId = auth_utils::getUserId(req);
    auto db = app().getDbClient("default");

    // 普通用户当日新增任务超过 30 个时，超出部分进入待审核(pending)状态，
    // 由管理员审核通过后(approved)才正常计入；管理员不受此限制。
    std::string reviewStatus = "none";
    auto roleRes = db->execSqlSync(
        "SELECT role FROM users WHERE id = $1", userId);
    bool isAdmin = !roleRes.empty() && roleRes[0]["role"].as<std::string>() == "admin";
    if (!isAdmin) {
        auto cntRes = db->execSqlSync(
            "SELECT COUNT(*) AS c FROM tasks WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE",
            userId);
        int todayCount = cntRes[0]["c"].as<int>();
        if (todayCount >= 30) {
            reviewStatus = "pending";
        }
    }

    auto result = db->execSqlSync(
        "INSERT INTO tasks (user_id, title, description, topic, priority, "
        "source, type, interval_value, interval_unit, need_review_reminder, "
        "remind_before_days, deadline, review_status) "
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, "
        "CASE WHEN $11 = -1 THEN NULL ELSE $11 END, NULLIF($12, '')::timestamp, $13) RETURNING id",
        userId, t.title, t.description, t.topic, t.priority,
        source, t.type, t.intervalValue, t.intervalUnit, t.needReviewReminder,
        t.remindBeforeDays, t.deadline, reviewStatus);

    int newId = result[0]["id"].as<int>();
    Json::Value data;
    data["id"] = newId;
    data["reviewStatus"] = reviewStatus;

    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    resp->setStatusCode(k201Created);
    callback(resp);
}

void TaskController::update(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback,
    int id) {
    auto json = req->getJsonObject();
    if (!json) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "invalid json"));
        callback(resp);
        return;
    }

    std::string title = json->get("title", "").asString();
    std::string description = json->get("description", "").asString();
    std::string topic = json->get("topic", "").asString();
    int priority = json->get("priority", -1).asInt();
    bool completed = json->get("completed", false).asBool();
    std::string type = json->get("type", "").asString();
    std::string intervalUnit = json->get("intervalUnit", "").asString();
    int intervalValue = json->get("intervalValue", -1).asInt();
    bool needReviewReminder = json->get("needReviewReminder", false).asBool();
    int remindBeforeDays = json->get("remindBeforeDays", -1).asInt();
    std::string deadline = json->get("deadline", "").asString();
    int userId = auth_utils::getUserId(req);

    auto db = app().getDbClient("default");
    db->execSqlSync(
        "UPDATE tasks SET title = $3, description = $4, topic = $5,"
        " priority = CASE WHEN $6 = -1 THEN priority ELSE $6 END,"
        " completed = $7,"
        " type = CASE WHEN $8 = '' THEN type ELSE $8 END,"
        " interval_value = CASE WHEN $9 = -1 THEN interval_value ELSE $9 END,"
        " interval_unit = CASE WHEN $10 = '' THEN interval_unit ELSE $10 END,"
        " need_review_reminder = $11,"
        " remind_before_days = CASE WHEN $12 = -1 THEN remind_before_days ELSE $12 END,"
        " deadline = CASE WHEN $13 = '' THEN deadline ELSE NULLIF($13, '')::timestamp END"
        " WHERE id = $1 AND user_id = $2",
        id, userId, title, description, topic, priority, completed,
        type, intervalValue, intervalUnit, needReviewReminder,
        remindBeforeDays, deadline);

    Json::Value data;
    data["message"] = "ok";
    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    callback(resp);
}

void TaskController::remove(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback,
    int id) {
    auto db = app().getDbClient("default");
    int userId = auth_utils::getUserId(req);
    db->execSqlSync("DELETE FROM tasks WHERE id = $1 AND user_id = $2", id, userId);
    auto resp = HttpResponse::newHttpJsonResponse(ok());
    callback(resp);
}

void TaskController::complete(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback,
    int id) {
    auto db = app().getDbClient("default");
    int userId = auth_utils::getUserId(req);
    db->execSqlSync(
        "UPDATE tasks SET completed = TRUE, "
        "completed_at = NOW() WHERE id = $1 AND user_id = $2", id, userId);
    auto resp = HttpResponse::newHttpJsonResponse(ok());
    callback(resp);
}

void TaskController::getSystem(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    Json::Value arr(Json::arrayValue);

    struct SysTask {
        const char* title;
        const char* topic;
        int priority;
        const char* type;
        int intervalValue;
        const char* intervalUnit;
    };
    SysTask defaults[] = {
        {"每日英语单词背诵", "英语", 2, "daily", 1, "day"},
        {"编程练习", "编程", 2, "daily", 1, "day"},
        {"阅读技术文章", "编程", 1, "periodic", 2, "week"},
        {"数学题练习", "数学", 1, "daily", 1, "day"},
        {"课程复习", "专业课", 3, "once", 1, "week"},
    };

    for (auto& s : defaults) {
        Json::Value j;
        j["title"] = s.title;
        j["topic"] = s.topic;
        j["priority"] = s.priority;
        j["type"] = s.type;
        j["intervalValue"] = s.intervalValue;
        j["intervalUnit"] = s.intervalUnit;
        j["source"] = "system";
        arr.append(j);
    }

    auto resp = HttpResponse::newHttpJsonResponse(ok(arr));
    callback(resp);
}
