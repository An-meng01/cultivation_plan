#ifndef CONTROLLERS_TASK_CONTROLLER_H
#define CONTROLLERS_TASK_CONTROLLER_H

#include <drogon/HttpController.h>

class TaskController : public drogon::HttpController<TaskController, false> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(TaskController::getAll,    "/api/tasks",     drogon::Get);
        ADD_METHOD_TO(TaskController::getOne,    "/api/tasks/{id}", drogon::Get);
        ADD_METHOD_TO(TaskController::create,    "/api/tasks",     drogon::Post);
        ADD_METHOD_TO(TaskController::update,    "/api/tasks/{id}", drogon::Put);
        ADD_METHOD_TO(TaskController::remove,    "/api/tasks/{id}", drogon::Delete);
        ADD_METHOD_TO(TaskController::complete,  "/api/tasks/{id}/complete", drogon::Put);
        ADD_METHOD_TO(TaskController::getSystem, "/api/tasks/system", drogon::Get);
    METHOD_LIST_END

    void getAll(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getOne(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                int id);
    void create(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void update(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                int id);
    void remove(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                int id);
    void complete(const drogon::HttpRequestPtr& req,
                  std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                  int id);
    void getSystem(const drogon::HttpRequestPtr& req,
                   std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};

#endif
