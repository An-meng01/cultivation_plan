#include "filters/AuthFilter.h"
#include "utils/AuthContext.h"
#include <drogon/drogon.h>

using namespace drogon;

void AuthFilter::doFilter(const HttpRequestPtr& req,
                           FilterCallback&& fcb,
                           FilterChainCallback&& fccb) {
    // Auth is optional: only enforce if api_key is configured in config.json
    auto& app = drogon::app();
    auto config = app.getCustomConfig();
    std::string expectedKey;
    if (config.isMember("api_key")) {
        expectedKey = config["api_key"].asString();
    }
    if (!expectedKey.empty()) {
        auto apiKey = req->getHeader("X-API-Key");
        if (apiKey != expectedKey) {
            Json::Value j;
            j["code"] = 401;
            j["message"] = "unauthorized";
            auto resp = HttpResponse::newHttpJsonResponse(j);
            resp->setStatusCode(k401Unauthorized);
            fcb(resp);
            return;
        }
    }

    // 解析并固化用户身份，供下游控制器统一读取，消除硬编码 user_id=1
    int uid = auth_utils::getUserId(req);
    req->attributes()->insert("user_id", std::to_string(uid));

    fccb();
}
