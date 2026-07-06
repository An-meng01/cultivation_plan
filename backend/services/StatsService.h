#ifndef SERVICES_STATS_SERVICE_H
#define SERVICES_STATS_SERVICE_H

#include <json/value.h>
#include <string>

namespace services {

class StatsService {
public:
    Json::Value getOverview(int userId = 1);
    Json::Value getDailyStats(const std::string& start,
                              const std::string& end,
                              int userId = 1);
    Json::Value getTopicDistribution(int userId = 1);
    Json::Value getPriorityDistribution(int userId = 1);
};

}  // namespace services

#endif
