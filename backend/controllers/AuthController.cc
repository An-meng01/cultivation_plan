#include "controllers/AuthController.h"
#include <drogon/drogon.h>
#include <json/value.h>
#include <random>
#include <sstream>
#include <iomanip>

using namespace drogon;

static Json::Value ok() {
    Json::Value j;
    j["code"] = 0;
    return j;
}

static Json::Value okData(const Json::Value& data) {
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

static std::string randomToken() {
    std::random_device rd;
    std::mt19937_64 gen(rd());
    std::uniform_int_distribution<uint64_t> dist;
    std::stringstream ss;
    ss << std::hex << std::setfill('0');
    for (int i = 0; i < 4; i++) {
        ss << std::setw(16) << dist(gen);
    }
    return ss.str();
}

void AuthController::login(const HttpRequestPtr& req,
                           std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("username") || !json->isMember("password")) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "missing username or password"));
        callback(resp);
        return;
    }

    std::string username = (*json)["username"].asString();
    std::string password = (*json)["password"].asString();

    auto db = app().getDbClient("default");
    auto result = db->execSqlSync(
        "SELECT id FROM users WHERE username = $1 AND password = $2",
        username, password);

    if (result.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(401, "invalid username or password"));
        callback(resp);
        return;
    }

    int userId = result[0]["id"].as<int>();
    std::string token = randomToken();

    db->execSqlSync(
        "INSERT INTO sessions (token, user_id) VALUES ($1, $2)",
        token, userId);

    auto avatar = db->execSqlSync(
        "SELECT avatar_url, avatar_status FROM users WHERE id = $1", userId);
    std::string avatarUrl = avatar.empty() || avatar[0]["avatar_url"].isNull()
        ? "" : avatar[0]["avatar_url"].as<std::string>();
    std::string avatarStatus = avatar.empty() || avatar[0]["avatar_status"].isNull()
        ? "none" : avatar[0]["avatar_status"].as<std::string>();

    Json::Value data;
    data["token"] = token;
    data["userId"] = userId;
    data["username"] = username;
    data["avatarUrl"] = avatarUrl;
    data["avatarStatus"] = avatarStatus;

    auto resp = HttpResponse::newHttpJsonResponse(okData(data));
    callback(resp);
}

void AuthController::reg(const HttpRequestPtr& req,
                          std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("username") || !json->isMember("password")) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "missing username or password"));
        callback(resp);
        return;
    }

    std::string username = (*json)["username"].asString();
    std::string password = (*json)["password"].asString();

    if (username.length() < 2 || username.length() > 10) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "用户名需为2-10个字符"));
        callback(resp);
        return;
    }
    if (password.length() < 4) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "密码至少4个字符"));
        callback(resp);
        return;
    }

    auto db = app().getDbClient("default");

    auto existing = db->execSqlSync(
        "SELECT id FROM users WHERE username = $1",
        username);
    if (!existing.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(409, "用户名已存在"));
        callback(resp);
        return;
    }

    auto result = db->execSqlSync(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
        username, password);

    int userId = result[0]["id"].as<int>();

    Json::Value data;
    data["userId"] = userId;
    data["username"] = username;
    data["avatarUrl"] = "";
    data["avatarStatus"] = "none";

    auto resp = HttpResponse::newHttpJsonResponse(okData(data));
    resp->setStatusCode(k201Created);
    callback(resp);
}

void AuthController::me(const HttpRequestPtr& req,
                        std::function<void(const HttpResponsePtr&)>&& callback) {
    auto attrs = req->attributes();
    int userId = 1;
    if (attrs->find("user_id")) {
        try {
            userId = std::stoi(attrs->get<std::string>("user_id"));
        } catch (...) {}
    }

    auto db = app().getDbClient("default");
    auto result = db->execSqlSync(
        "SELECT username, avatar_url, avatar_status FROM users WHERE id = $1",
        userId);

    std::string avatarUrl = (result.empty() || result[0]["avatar_url"].isNull())
        ? "" : result[0]["avatar_url"].as<std::string>();
    std::string avatarStatus = (result.empty() || result[0]["avatar_status"].isNull())
        ? "none" : result[0]["avatar_status"].as<std::string>();

    Json::Value data;
    data["userId"] = userId;
    data["username"] = result.empty() ? "unknown" : result[0]["username"].as<std::string>();
    data["avatarUrl"] = avatarUrl;
    data["avatarStatus"] = avatarStatus;

    auto resp = HttpResponse::newHttpJsonResponse(okData(data));
    callback(resp);
}

void AuthController::uploadAvatar(const HttpRequestPtr& req,
                                  std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto attrs = req->attributes();
    int userId = 1;
    if (attrs->find("user_id")) {
        try {
            userId = std::stoi(attrs->get<std::string>("user_id"));
        } catch (...) {}
    }

    auto json = req->getJsonObject();
    if (!json || !json->isMember("avatar")) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "缺少头像数据"));
        callback(resp);
        return;
    }

    std::string avatar = (*json)["avatar"].asString();
    // 仅接受 base64 的 data URI；限制长度防止滥用（约 2MB 图片）
    if (avatar.find("data:image/") != 0 || avatar.size() > 3 * 1024 * 1024) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "头像格式或大小不合法"));
        callback(resp);
        return;
    }

    auto db = app().getDbClient("default");
    // 上传后进入"待审核"状态，需管理员审核通过(approved)后才对外展示
    db->execSqlSync(
        "UPDATE users SET avatar_url = $1, avatar_status = 'pending' WHERE id = $2",
        avatar, userId);

    Json::Value data;
    data["avatarUrl"] = avatar;
    data["avatarStatus"] = "pending";

    auto resp = HttpResponse::newHttpJsonResponse(okData(data));
    callback(resp);
}
