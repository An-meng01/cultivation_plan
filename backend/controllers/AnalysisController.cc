#include "controllers/AnalysisController.h"
#include "services/StatsService.h"
#include "utils/AuthContext.h"
#include <drogon/drogon.h>
#include <chrono>
#include <ctime>

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
    auto data = svc.getOverview(utils::getUserId(req));
    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    callback(resp);
}

void AnalysisController::daily(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    auto params = req->parameters();
    auto now = std::chrono::system_clock::now();
    auto tt = std::chrono::system_clock::to_time_t(now);
    std::tm* tm = std::localtime(&tt);
    char buf[11];
    std::strftime(buf, sizeof(buf), "%Y-01-01", tm);
    std::string yearStart(buf);
    std::strftime(buf, sizeof(buf), "%Y-12-31", tm);
    std::string yearEnd(buf);

    std::string start = params.find("start") != params.end()
                            ? params.at("start") : yearStart;
    std::string end = params.find("end") != params.end()
                          ? params.at("end") : yearEnd;

    services::StatsService svc;
    auto data = svc.getDailyStats(start, end, utils::getUserId(req));
    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    callback(resp);
}

void AnalysisController::priorities(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    services::StatsService svc;
    auto data = svc.getPriorityDistribution(utils::getUserId(req));
    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    callback(resp);
}

void AnalysisController::health(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    Json::Value data;
    data["status"] = "ok";
    auto resp = HttpResponse::newHttpJsonResponse(ok(data));
    callback(resp);
}
