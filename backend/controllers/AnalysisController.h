#ifndef CONTROLLERS_ANALYSIS_CONTROLLER_H
#define CONTROLLERS_ANALYSIS_CONTROLLER_H

#include <drogon/HttpController.h>

class AnalysisController : public drogon::HttpController<AnalysisController, false> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(AnalysisController::overview,    "/api/analysis/overview",    drogon::Get, "AuthFilter");
        ADD_METHOD_TO(AnalysisController::daily,       "/api/analysis/daily",       drogon::Get, "AuthFilter");
        ADD_METHOD_TO(AnalysisController::priorities,  "/api/analysis/priorities",  drogon::Get, "AuthFilter");
        ADD_METHOD_TO(AnalysisController::health,      "/api/health",               drogon::Get, "AuthFilter");
    METHOD_LIST_END

    void overview(const drogon::HttpRequestPtr& req,
                  std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void daily(const drogon::HttpRequestPtr& req,
               std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void priorities(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void health(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};

#endif
