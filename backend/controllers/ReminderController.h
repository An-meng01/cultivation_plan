#ifndef CONTROLLERS_REMINDER_CONTROLLER_H
#define CONTROLLERS_REMINDER_CONTROLLER_H

#include <drogon/HttpController.h>

class ReminderController : public drogon::HttpController<ReminderController, false> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(ReminderController::list, "/api/reminders", drogon::Get, "AuthFilter");
        ADD_METHOD_TO(ReminderController::ack, "/api/reminders/{id}/ack", drogon::Post, "AuthFilter");
    METHOD_LIST_END

    void list(const drogon::HttpRequestPtr& req,
              std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void ack(const drogon::HttpRequestPtr& req,
             std::function<void(const drogon::HttpResponsePtr&)>&& callback,
             int id);
};

#endif
