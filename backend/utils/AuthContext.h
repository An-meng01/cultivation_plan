#ifndef UTILS_AUTH_CONTEXT_H
#define UTILS_AUTH_CONTEXT_H

#include <drogon/HttpRequest.h>
#include <string>

namespace utils {

// 解析当前请求的用户身份，优先级：
//   1) AuthFilter 已写入请求属性的 "user_id"（最权威）
//   2) 请求头 X-User-Id 或查询参数 userId（前端登录后传入）
//   3) 兜底默认 1，保持向后兼容
inline int getUserId(const drogon::HttpRequestPtr& req) {
    const std::string& attr = req->getAttribute("user_id");
    if (!attr.empty()) {
        try {
            int id = std::stoi(attr);
            if (id > 0) return id;
        } catch (...) {}
    }

    std::string v = req->getHeader("X-User-Id");
    if (v.empty()) {
        const auto& params = req->parameters();
        auto it = params.find("userId");
        if (it != params.end()) v = it->second;
    }
    if (!v.empty()) {
        try {
            int id = std::stoi(v);
            if (id > 0) return id;
        } catch (...) {}
    }

    return 1;
}

}  // namespace utils

#endif
