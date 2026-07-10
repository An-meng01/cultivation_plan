#include "controllers/AdminController.h"
#include <drogon/drogon.h>
#include <json/value.h>

using namespace drogon;

static Json::Value okData(const Json::Value& data) {
    Json::Value j;
    j["code"] = 0;
    j["data"] = data;
    return j;
}
static Json::Value ok() {
    Json::Value j;
    j["code"] = 0;
    return j;
}
static Json::Value fail(int code, const std::string& msg) {
    Json::Value j;
    j["code"] = code;
    j["message"] = msg;
    return j;
}

// 向被审核用户写入一条"审核结果通知"，其下次登录时弹出
static void addReviewNotice(orm::DbClientPtr& db, int userId,
                            const std::string& kind, int refId,
                            const std::string& title, const std::string& action) {
    db->execSqlSync(
        "INSERT INTO review_notices (user_id, kind, ref_id, title, action) "
        "VALUES ($1, $2, $3, $4, $5)",
        userId, kind, refId, title, action);
}

void AdminController::listUsers(const HttpRequestPtr& req,
                                std::function<void(const HttpResponsePtr&)>&& callback) {
    auto db = app().getDbClient("default");
    // 技术：PostgreSQL 聚合查询——LEFT JOIN + COUNT + GROUP BY 统计每个用户的任务数；
    // 统一返回 { code, data } 结构，前端 extractErrorMessage 按 code 判错。
    auto result = db->execSqlSync(
        "SELECT u.id, u.username, u.role, u.avatar_status, u.email, u.phone, u.created_at, "
        "COUNT(t.id) AS task_count "
        "FROM users u LEFT JOIN tasks t ON t.user_id = u.id "
        "GROUP BY u.id, u.username, u.role, u.avatar_status, u.email, u.phone, u.created_at "
        "ORDER BY u.id");
    Json::Value arr(Json::arrayValue);
    for (const auto& r : result) {
        Json::Value item;
        item["id"] = r["id"].as<int>();
        item["username"] = r["username"].as<std::string>();
        item["role"] = r["role"].as<std::string>();
        item["avatarStatus"] = r["avatar_status"].isNull() ? "none" : r["avatar_status"].as<std::string>();
        item["email"] = r["email"].isNull() ? "" : r["email"].as<std::string>();
        item["phone"] = r["phone"].isNull() ? "" : r["phone"].as<std::string>();
        item["taskCount"] = r["task_count"].as<int>();
        item["createdAt"] = r["created_at"].as<std::string>();
        arr.append(item);
    }
    auto resp = HttpResponse::newHttpJsonResponse(okData(arr));
    callback(resp);
}

void AdminController::listAvatars(const HttpRequestPtr& req,
                                  std::function<void(const HttpResponsePtr&)>&& callback) {
    auto db = app().getDbClient("default");
    auto result = db->execSqlSync(
        "SELECT id, username, avatar_url, avatar_status FROM users "
        "WHERE avatar_status = 'pending' ORDER BY id");
    Json::Value arr(Json::arrayValue);
    for (const auto& r : result) {
        Json::Value item;
        item["id"] = r["id"].as<int>();
        item["username"] = r["username"].as<std::string>();
        item["avatarUrl"] = r["avatar_url"].isNull() ? "" : r["avatar_url"].as<std::string>();
        item["avatarStatus"] = r["avatar_status"].as<std::string>();
        arr.append(item);
    }
    auto resp = HttpResponse::newHttpJsonResponse(okData(arr));
    callback(resp);
}

void AdminController::reviewAvatar(const HttpRequestPtr& req,
                                   std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("userId") || !json->isMember("action")) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "missing userId or action"));
        callback(resp);
        return;
    }
    int userId = (*json)["userId"].as<int>();
    std::string action = (*json)["action"].asString();
    if (action != "approved" && action != "rejected") {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "invalid action"));
        callback(resp);
        return;
    }

    auto db = app().getDbClient("default");
    // 技术：参数化 UPDATE 仅把 pending 状态的头像改为 approved/rejected，
    // 用 $1/$2 占位符防止 SQL 注入（drogon orm 参数绑定）。
    db->execSqlSync(
        "UPDATE users SET avatar_status = $1 WHERE id = $2 AND avatar_status = 'pending'",
        action, userId);

    // 头像审核结果通知被审核用户（下次登录弹出）
    addReviewNotice(db, userId, "avatar", userId, "头像", action);

    auto resp = HttpResponse::newHttpJsonResponse(okData(Json::Value()));
    callback(resp);
}

void AdminController::listPendingTasks(const HttpRequestPtr& req,
                                       std::function<void(const HttpResponsePtr&)>&& callback) {
    auto db = app().getDbClient("default");
    // 待审核任务：普通用户当日新增超过 30 个后的部分，需管理员审核
    auto result = db->execSqlSync(
        "SELECT t.id, t.user_id, t.title, t.topic, t.priority, t.created_at, u.username "
        "FROM tasks t JOIN users u ON u.id = t.user_id "
        "WHERE t.review_status = 'pending' ORDER BY t.created_at DESC");
    Json::Value arr(Json::arrayValue);
    for (const auto& r : result) {
        Json::Value item;
        item["id"] = r["id"].as<int>();
        item["userId"] = r["user_id"].as<int>();
        item["username"] = r["username"].as<std::string>();
        item["title"] = r["title"].as<std::string>();
        item["topic"] = r["topic"].as<std::string>();
        item["priority"] = r["priority"].as<int>();
        item["createdAt"] = r["created_at"].as<std::string>();
        arr.append(item);
    }
    auto resp = HttpResponse::newHttpJsonResponse(okData(arr));
    callback(resp);
}

void AdminController::reviewTask(const HttpRequestPtr& req,
                                 std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("taskId") || !json->isMember("action")) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "missing taskId or action"));
        callback(resp);
        return;
    }
    int taskId = (*json)["taskId"].as<int>();
    std::string action = (*json)["action"].asString();
    if (action != "approved" && action != "rejected") {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "invalid action"));
        callback(resp);
        return;
    }

    auto db = app().getDbClient("default");
    auto res = db->execSqlSync(
        "UPDATE tasks SET review_status = $1 WHERE id = $2 AND review_status = 'pending' "
        "RETURNING user_id, title",
        action, taskId);
    if (res.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(404, "任务不存在或已审核"));
        resp->setStatusCode(k404NotFound);
        callback(resp);
        return;
    }
    int ownerId = res[0]["user_id"].as<int>();
    std::string title = res[0]["title"].as<std::string>();

    // 任务审核结果通知被审核用户（下次登录弹出）
    addReviewNotice(db, ownerId, "task", taskId, title, action);

    auto resp = HttpResponse::newHttpJsonResponse(okData(Json::Value()));
    callback(resp);
}

void AdminController::deleteUser(const HttpRequestPtr& req,
                                 std::function<void(const HttpResponsePtr&)>&& callback,
                                 int id) {
    // 当前管理员身份取自 AdminFilter 已校验的会话；这里再从 token 解析出操作人，
    // 禁止注销"其他管理员"账号（可注销普通用户及自己的账号）。
    auto auth = req->getHeader("Authorization");
    std::string token;
    if (auth.size() > 7 && auth.substr(0, 7) == "Bearer ") token = auth.substr(7);

    auto db = app().getDbClient("default");
    auto opRes = db->execSqlSync(
        "SELECT u.id, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = $1",
        token);
    if (opRes.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(401, "invalid token"));
        resp->setStatusCode(k401Unauthorized);
        callback(resp);
        return;
    }
    int operatorId = opRes[0]["id"].as<int>();
    std::string operatorRole = opRes[0]["role"].as<std::string>();

    auto targetRes = db->execSqlSync(
        "SELECT role FROM users WHERE id = $1", id);
    if (targetRes.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(404, "用户不存在"));
        resp->setStatusCode(k404NotFound);
        callback(resp);
        return;
    }
    std::string targetRole = targetRes[0]["role"].as<std::string>();

    // 不能注销其他管理员账号（自己作为管理员注销自己则允许）
    if (targetRole == "admin" && operatorId != id) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(403, "不能注销其他管理员账号"));
        resp->setStatusCode(k403Forbidden);
        callback(resp);
        return;
    }

    db->execSqlSync("DELETE FROM users WHERE id = $1", id);

    Json::Value data;
    data["self"] = (operatorId == id);
    auto resp = HttpResponse::newHttpJsonResponse(okData(data));
    callback(resp);
}
