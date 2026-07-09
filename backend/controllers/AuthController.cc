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

    Json::Value data;
    data["token"] = token;
    data["userId"] = userId;
    data["username"] = username;

    auto resp = HttpResponse::newHttpJsonResponse(okData(data));
    callback(resp);
}

void AuthController::reg(const HttpRequestPtr& req,
                         std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("username") || !json->isMember("password")) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "missing username or password"));
        callback(resp);
        return;
    }

    std::string username = (*json)["username"].asString();
    std::string password = (*json)["password"].asString();

    if (username.length() < 2 || password.length() < 4) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(400, "username min 2 chars, password min 4 chars"));
        callback(resp);
        return;
    }

    auto db = app().getDbClient("default");

    auto existing = db->execSqlSync(
        "SELECT id FROM users WHERE username = $1",
        username);
    if (!existing.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(fail(409, "username already exists"));
        callback(resp);
        return;
    }

    auto result = db->execSqlSync(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
        username, password);

    int userId = result[0]["id"].as<int>();
    std::string token = randomToken();

    db->execSqlSync(
        "INSERT INTO sessions (token, user_id) VALUES ($1, $2)",
        token, userId);

    Json::Value data;
    data["token"] = token;
    data["userId"] = userId;
    data["username"] = username;

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
        "SELECT username FROM users WHERE id = $1",
        userId);

    Json::Value data;
    data["userId"] = userId;
    data["username"] = result.empty() ? "unknown" : result[0]["username"].as<std::string>();

    auto resp = HttpResponse::newHttpJsonResponse(okData(data));
    callback(resp);
}
