#include "controllers/AnalysisController.h"
#include "services/StatsService.h"
#include <drogon/drogon.h>

using namespace drogon;

static Json::Value ok(const Json::Value& data) {
    Json::Value j;
    j["code"] = 0;
    j["data"] = data;
    return j;
}

void AnalysisController::overview(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    services::StatsService svc;
    auto data = svc.getOverview();
    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    callback(resp);
}

void AnalysisController::daily(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    auto params = req->parameters();
    std::string start = params.find("start") != params.end()
                            ? params.at("start") : "2026-01-01";
    std::string end = params.find("end") != params.end()
                          ? params.at("end") : "2026-12-31";

    services::StatsService svc;
    auto data = svc.getDailyStats(start, end);
    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    callback(resp);
}

void AnalysisController::priorities(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    services::StatsService svc;
    auto data = svc.getPriorityDistribution();
    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    callback(resp);
}
