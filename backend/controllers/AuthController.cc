#include "controllers/AuthController.h"
#include <drogon/drogon.h>
#include <json/value.h>
#include <random>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cctype>

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
        "SELECT id, role FROM users WHERE username = $1 AND password = $2",
        username, password);

    if (result.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(401, "用户名或密码错误"));
        callback(resp);
        return;
    }

    int userId = result[0]["id"].as<int>();
    std::string role = result[0]["role"].as<std::string>();

    // 根据 User-Agent 判定登录设备：移动端走短信提醒，PC 端走邮件提醒
    // 技术：drogon HttpRequest::getHeader 读取请求头；用标准库 <algorithm>/<cctype>
    //       做大小写无关的字符串匹配（tolower + find）。结果写入 users.last_device。
    std::string ua = req->getHeader("user-agent");
    std::string device = "pc";
    std::string uaLower = ua;
    std::transform(uaLower.begin(), uaLower.end(), uaLower.begin(), ::tolower);
    if (uaLower.find("mobile") != std::string::npos ||
        uaLower.find("android") != std::string::npos ||
        uaLower.find("iphone") != std::string::npos ||
        uaLower.find("ipad") != std::string::npos) {
        device = "mobile";
    }
    db->execSqlSync("UPDATE users SET last_device = $1 WHERE id = $2", device, userId);

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
    data["role"] = role;
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

    std::string role = "user";
    if (json->isMember("role")) {
        std::string r = (*json)["role"].asString();
        if (r == "admin") role = "admin";
    }

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
        "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id",
        username, password, role);

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
        "SELECT username, avatar_url, avatar_status, email, phone, role, last_device FROM users WHERE id = $1",
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
    data["email"] = (result.empty() || result[0]["email"].isNull()) ? "" : result[0]["email"].as<std::string>();
    data["phone"] = (result.empty() || result[0]["phone"].isNull()) ? "" : result[0]["phone"].as<std::string>();
    data["role"] = result.empty() ? "user" : result[0]["role"].as<std::string>();
    data["lastDevice"] = result.empty() ? "pc" : result[0]["last_device"].as<std::string>();

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
    // 上传后进入"待审核"状态：暂存到 avatar_pending_url，保留原头像不变；
    // 审核通过才替换对外头像，拒绝则回退到原头像（见 reviewAvatar）。
    db->execSqlSync(
        "UPDATE users SET avatar_pending_url = $1, avatar_status = 'pending' WHERE id = $2",
        avatar, userId);

    Json::Value data;
    data["avatarUrl"] = avatar;
    data["avatarStatus"] = "pending";

    auto resp = HttpResponse::newHttpJsonResponse(okData(data));
    callback(resp);
}

void AuthController::updateProfile(const HttpRequestPtr& req,
                                   std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto attrs = req->attributes();
    int userId = 1;
    if (attrs->find("user_id")) {
        try {
            userId = std::stoi(attrs->get<std::string>("user_id"));
        } catch (...) {}
    }

    auto json = req->getJsonObject();
    if (!json) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "invalid json"));
        callback(resp);
        return;
    }

    std::string email = json->get("email", "").asString();
    std::string phone = json->get("phone", "").asString();

    auto db = app().getDbClient("default");
    db->execSqlSync(
        "UPDATE users SET email = NULLIF($1, ''), phone = NULLIF($2, '') WHERE id = $3",
        email, phone, userId);

    auto resp = HttpResponse::newHttpJsonResponse(ok());
    callback(resp);
}

void AuthController::changePassword(const HttpRequestPtr& req,
                                    std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto attrs = req->attributes();
    int userId = 1;
    if (attrs->find("user_id")) {
        try {
            userId = std::stoi(attrs->get<std::string>("user_id"));
        } catch (...) {}
    }

    auto json = req->getJsonObject();
    if (!json) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "invalid json"));
        callback(resp);
        return;
    }

    std::string oldPassword = json->get("oldPassword", "").asString();
    std::string newPassword = json->get("newPassword", "").asString();

    if (newPassword.length() < 4) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "新密码至少4个字符"));
        callback(resp);
        return;
    }

    auto db = app().getDbClient("default");
    // 校验原密码，防止越权修改
    auto check = db->execSqlSync(
        "SELECT id FROM users WHERE id = $1 AND password = $2",
        userId, oldPassword);
    if (check.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "原密码错误"));
        callback(resp);
        return;
    }

    db->execSqlSync(
        "UPDATE users SET password = $1 WHERE id = $2",
        newPassword, userId);

    auto resp = HttpResponse::newHttpJsonResponse(ok());
    callback(resp);
}

void AuthController::notices(const HttpRequestPtr& req,
                             std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto attrs = req->attributes();
    int userId = 1;
    if (attrs->find("user_id")) {
        try {
            userId = std::stoi(attrs->get<std::string>("user_id"));
        } catch (...) {}
    }

    auto db = app().getDbClient("default");
    // 返回当前用户未读的审核结果通知（头像/任务审核）
    auto result = db->execSqlSync(
        "SELECT id, kind, ref_id, title, action, created_at FROM review_notices "
        "WHERE user_id = $1 AND seen = FALSE ORDER BY created_at ASC",
        userId);
    Json::Value arr(Json::arrayValue);
    for (const auto& r : result) {
        Json::Value item;
        item["id"] = r["id"].as<int>();
        item["kind"] = r["kind"].as<std::string>();
        item["refId"] = r["ref_id"].isNull() ? 0 : r["ref_id"].as<int>();
        item["title"] = r["title"].as<std::string>();
        item["action"] = r["action"].as<std::string>();
        item["createdAt"] = r["created_at"].as<std::string>();
        arr.append(item);
    }
    auto resp = HttpResponse::newHttpJsonResponse(okData(arr));
    callback(resp);
}

void AuthController::markNoticesSeen(const HttpRequestPtr& req,
                                     std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto attrs = req->attributes();
    int userId = 1;
    if (attrs->find("user_id")) {
        try {
            userId = std::stoi(attrs->get<std::string>("user_id"));
        } catch (...) {}
    }

    auto db = app().getDbClient("default");
    db->execSqlSync(
        "UPDATE review_notices SET seen = TRUE WHERE user_id = $1 AND seen = FALSE",
        userId);

    auto resp = HttpResponse::newHttpJsonResponse(ok());
    callback(resp);
}
