#ifndef CONTROLLERS_CLOCK_CONTROLLER_H
#define CONTROLLERS_CLOCK_CONTROLLER_H

#include <drogon/HttpController.h>

class ClockController : public drogon::HttpController<ClockController, false> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(ClockController::clockIn,     "/api/clock-in",      drogon::Post, "AuthFilter");
        ADD_METHOD_TO(ClockController::getRecords,  "/api/clock-records", drogon::Get, "AuthFilter");
    METHOD_LIST_END

    void clockIn(const drogon::HttpRequestPtr& req,
                 std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getRecords(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};

#endif
