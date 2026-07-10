#ifndef CONTROLLERS_ADMIN_CONTROLLER_H
#define CONTROLLERS_ADMIN_CONTROLLER_H

#include <drogon/HttpController.h>

class AdminController : public drogon::HttpController<AdminController, false> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(AdminController::listUsers,   "/api/admin/users",        drogon::Get, "AdminFilter");
        ADD_METHOD_TO(AdminController::listAvatars, "/api/admin/avatars",      drogon::Get, "AdminFilter");
        ADD_METHOD_TO(AdminController::reviewAvatar, "/api/admin/avatars/review", drogon::Post, "AdminFilter");
        ADD_METHOD_TO(AdminController::listPendingTasks, "/api/admin/tasks/pending", drogon::Get, "AdminFilter");
        ADD_METHOD_TO(AdminController::reviewTask, "/api/admin/tasks/review", drogon::Post, "AdminFilter");
        ADD_METHOD_TO(AdminController::deleteUser, "/api/admin/users/{id}", drogon::Delete, "AdminFilter");
    METHOD_LIST_END

    void listUsers(const drogon::HttpRequestPtr& req,
                   std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void listAvatars(const drogon::HttpRequestPtr& req,
                     std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void reviewAvatar(const drogon::HttpRequestPtr& req,
                      std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void listPendingTasks(const drogon::HttpRequestPtr& req,
                          std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void reviewTask(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void deleteUser(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                    int id);
};

#endif
