#include "filters/AuthFilter.h"

using namespace drogon;

void AuthFilter::doFilter(const HttpRequestPtr& req,
                           FilterCallback&& fcb,
                           FilterChainCallback&& fccb) {
    auto apiKey = req->getHeader("X-API-Key");
    if (apiKey.empty()) {
        auto resp = HttpResponse::newHttpJsonResponse(
            Json::Value("missing api key"));
        resp->setStatusCode(k401Unauthorized);
        fcb(resp);
        return;
    }
    fccb();
}
