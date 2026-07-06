#include "controllers/TaskController.h"
#include "models/Task.h"
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

    std::string sql = "SELECT * FROM tasks WHERE user_id = $1";
    std::vector<const char*> keys = {"topic", "priority", "source", "completed"};
    for (size_t i = 0; i < keys.size(); ++i) {
        auto it = params.find(keys[i]);
        if (it != params.end()) {
            sql += " AND " + std::string(keys[i]) + " = $" + std::to_string(i + 2);
        }
    }
    sql += " ORDER BY created_at DESC";

    auto f = db->execSqlCoro(sql, [](const Row& r) {
        models::Task t;
        t.id = r["id"].as<int>();
        t.title = r["title"].as<std::string>();
        t.description = r["description"].as<std::string>();
        t.topic = r["topic"].as<std::string>();
        t.priority = r["priority"].as<int>();
        t.source = r["source"].as<std::string>();
        t.needReviewReminder = r["need_review_reminder"].as<bool>();
        t.completed = r["completed"].as<bool>();
        t.deadline = r["deadline"].as<std::string>();
        t.createdAt = r["created_at"].as<std::string>();
        t.completedAt = r["completed_at"].as<std::string>();
        return t.toJson();
    }, 1);

    Json::Value arr(Json::arrayValue);
    while (!f.done()) {
        for (auto& row : f.result()) {
            arr.append(row);
        }
        f.next();
    }

    auto resp = HttpResponse::newHttpJsonResponse(ok(arr));
    callback(resp);
}

void TaskController::getOne(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback,
    int id) {
    auto db = app().getDbClient("default");
    auto f = db->execSqlCoro(
        "SELECT * FROM tasks WHERE id = $1", id);

    if (f.result().empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(404, "not found"));
        resp->setStatusCode(k404NotFound);
        callback(resp);
        return;
    }

    auto& row = f.result()[0];
    models::Task t;
    t.id = row["id"].as<int>();
    t.title = row["title"].as<std::string>();
    t.description = row["description"].as<std::string>();
    t.topic = row["topic"].as<std::string>();
    t.priority = row["priority"].as<int>();
    t.source = row["source"].as<std::string>();
    t.needReviewReminder = row["need_review_reminder"].as<bool>();
    t.completed = row["completed"].as<bool>();
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
    auto db = app().getDbClient("default");

    auto f = db->execSqlCoro(
        "INSERT INTO tasks (user_id, title, description, topic, priority, "
        "source, need_review_reminder, deadline) "
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamp) RETURNING id",
        t.userId, t.title, t.description, t.topic, t.priority,
        "custom", t.needReviewReminder,
        t.deadline.empty() ? nullptr : t.deadline);

    int newId = f.result()[0]["id"].as<int>();
    Json::Value data;
    data["id"] = newId;

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

    std::string sets;
    std::vector<const char*> fields = {"title", "description", "topic",
                                        "completed"};
    for (auto& f : fields) {
        if (json->isMember(f)) {
            if (!sets.empty()) sets += ", ";
            sets += std::string(f) + " = $" + std::to_string(sets.size() / 4 + 2);
        }
    }
    if (json->isMember("priority")) {
        if (!sets.empty()) sets += ", ";
        sets += "priority = $" + std::to_string(sets.size() / 4 + 2);
    }

    auto db = app().getDbClient("default");
    auto f = db->execSqlCoro(
        "UPDATE tasks SET " + sets + " WHERE id = $1", id);

    auto resp = HttpResponse::newHttpJsonResponse(ok());
    callback(resp);
}

void TaskController::remove(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback,
    int id) {
    auto db = app().getDbClient("default");
    db->execSqlCoro("DELETE FROM tasks WHERE id = $1", id);
    auto resp = HttpResponse::newHttpJsonResponse(ok());
    callback(resp);
}

void TaskController::complete(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback,
    int id) {
    auto db = app().getDbClient("default");
    db->execSqlCoro(
        "UPDATE tasks SET completed = TRUE, "
        "completed_at = NOW() WHERE id = $1", id);
    auto resp = HttpResponse::newHttpJsonResponse(ok());
    callback(resp);
}

void TaskController::getSystem(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    Json::Value arr(Json::arrayValue);

    struct SysTask { const char* title; const char* topic; int priority; };
    SysTask defaults[] = {
        {"每日英语单词背诵", "英语", 2},
        {"编程练习", "编程", 2},
        {"阅读技术文章", "编程", 1},
        {"数学题练习", "数学", 1},
        {"课程复习", "专业课", 3},
    };

    for (auto& s : defaults) {
        Json::Value j;
        j["title"] = s.title;
        j["topic"] = s.topic;
        j["priority"] = s.priority;
        j["source"] = "system";
        arr.append(j);
    }

    auto resp = HttpResponse::newHttpJsonResponse(ok(arr));
    callback(resp);
}
