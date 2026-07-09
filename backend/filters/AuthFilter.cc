#include "filters/AuthFilter.h"
#include <drogon/drogon.h>

using namespace drogon;

void AuthFilter::doFilter(const HttpRequestPtr& req,
                           FilterCallback&& fcb,
                           FilterChainCallback&& fccb) {
    std::string token;
    auto auth = req->getHeader("Authorization");
    if (auth.size() > 7 && auth.substr(0, 7) == "Bearer ") {
        token = auth.substr(7);
    }

    if (token.empty()) {
        Json::Value j;
        j["code"] = 401;
        j["message"] = "missing authorization token";
        auto resp = HttpResponse::newHttpJsonResponse(j);
        resp->setStatusCode(k401Unauthorized);
        fcb(resp);
        return;
    }

    auto db = app().getDbClient("default");
    auto result = db->execSqlSync(
        "SELECT user_id FROM sessions WHERE token = $1",
        token);

    if (result.empty()) {
        Json::Value j;
        j["code"] = 401;
        j["message"] = "invalid or expired token";
        auto resp = HttpResponse::newHttpJsonResponse(j);
        resp->setStatusCode(k401Unauthorized);
        fcb(resp);
        return;
    }

    int userId = result[0]["user_id"].as<int>();
    req->attributes()->insert("user_id", std::to_string(userId));
    fccb();
}
