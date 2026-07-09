#ifndef CONTROLLERS_AUTH_CONTROLLER_H
#define CONTROLLERS_AUTH_CONTROLLER_H

#include <drogon/HttpController.h>

class AuthController : public drogon::HttpController<AuthController, false> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(AuthController::login,    "/api/auth/login",    drogon::Post);
        ADD_METHOD_TO(AuthController::reg,      "/api/auth/register", drogon::Post);
        ADD_METHOD_TO(AuthController::me,       "/api/auth/me",       drogon::Get, "AuthFilter");
    METHOD_LIST_END

    void login(const drogon::HttpRequestPtr& req,
               std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void reg(const drogon::HttpRequestPtr& req,
             std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void me(const drogon::HttpRequestPtr& req,
            std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};

#endif
