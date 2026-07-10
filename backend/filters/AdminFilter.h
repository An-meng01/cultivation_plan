#ifndef FILTERS_ADMIN_FILTER_H
#define FILTERS_ADMIN_FILTER_H

#include <drogon/HttpFilter.h>

class AdminFilter : public drogon::HttpFilter<AdminFilter> {
public:
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback&& fcb,
                  drogon::FilterChainCallback&& fccb) override;
};

#endif
