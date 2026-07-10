#include "filters/AdminFilter.h"
#include <drogon/drogon.h>

using namespace drogon;

void AdminFilter::doFilter(const HttpRequestPtr& req,
                           FilterCallback&& fcb,
                           FilterChainCallback&& fccb) {
    // 技术：drogon HttpFilter（基于请求/响应拦截器模式）做基于角色的访问控制(RBAC)。
    // 先从 Authorization: Bearer <token> 取 token，再联表 sessions+users 校验角色，
    // 仅 role='admin' 放行（fccb），否则返回 401/403。
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
        "SELECT u.role FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token = $1",
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

    if (result[0]["role"].as<std::string>() != "admin") {
        Json::Value j;
        j["code"] = 403;
        j["message"] = "需要管理员权限";
        auto resp = HttpResponse::newHttpJsonResponse(j);
        resp->setStatusCode(k403Forbidden);
        fcb(resp);
        return;
    }

    fccb();
}
