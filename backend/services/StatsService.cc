#include "services/StatsService.h"
#include <drogon/drogon.h>
#include <json/value.h>

using namespace drogon;

namespace services {

Json::Value StatsService::getOverview(int userId) {
    Json::Value result;
    auto db = app().getDbClient("default");

    auto f = db->execSqlCoro(
        "SELECT COUNT(*) AS total, "
        "SUM(CASE WHEN completed THEN 1 ELSE 0 END) AS done, "
        "topic FROM tasks WHERE user_id = $1 "
        "GROUP BY topic",
        userId
    );

    int total = 0, done = 0;
    Json::Value topicDist;
    Json::Value topicRate;

    while (!f.done()) {
        for (auto& row : f.result()) {
            int t = row["total"].as<int>();
            int d = row["done"].as<int>();
            total += t;
            done += d;
            std::string topic = row["topic"].as<std::string>();
            if (topic.empty()) topic = "未分类";
            topicDist[topic] = t;
            topicRate[topic] = t > 0 ? (d * 100.0 / t) : 0.0;
        }
        f.next();
    }

    result["totalTasks"] = total;
    result["completed"] = done;
    result["pending"] = total - done;
    result["completionRate"] = total > 0 ? (done * 100.0 / total) : 0.0;
    result["topicDistribution"] = topicDist;
    result["topicCompletionRate"] = topicRate;
    return result;
}

Json::Value StatsService::getDailyStats(const std::string& start,
                                         const std::string& end,
                                         int userId) {
    Json::Value arr(Json::arrayValue);
    auto db = app().getDbClient("default");

    auto f = db->execSqlCoro(
        "SELECT DATE(created_at) AS dt, COUNT(*) AS added, "
        "SUM(CASE WHEN completed THEN 1 ELSE 0 END) AS done "
        "FROM tasks WHERE user_id = $1 "
        "AND DATE(created_at) BETWEEN $2::date AND $3::date "
        "GROUP BY dt ORDER BY dt",
        userId, start, end
    );

    while (!f.done()) {
        for (auto& row : f.result()) {
            Json::Value item;
            std::string date = row["dt"].as<std::string>();
            int added = row["added"].as<int>();
            int done = row["done"].as<int>();
            item["date"] = date;
            item["added"] = added;
            item["completed"] = done;
            item["rate"] = added > 0 ? (done * 100.0 / added) : 0.0;
            arr.append(item);
        }
        f.next();
    }

    return arr;
}

Json::Value StatsService::getTopicDistribution(int userId) {
    Json::Value result;
    auto db = app().getDbClient("default");

    auto f = db->execSqlCoro(
        "SELECT topic, COUNT(*) AS cnt "
        "FROM tasks WHERE user_id = $1 GROUP BY topic",
        userId
    );

    while (!f.done()) {
        for (auto& row : f.result()) {
            std::string topic = row["topic"].as<std::string>();
            if (topic.empty()) topic = "未分类";
            result[topic] = row["cnt"].as<int>();
        }
        f.next();
    }

    return result;
}

Json::Value StatsService::getPriorityDistribution(int userId) {
    Json::Value result;
    auto db = app().getDbClient("default");

    auto f = db->execSqlCoro(
        "SELECT priority, COUNT(*) AS cnt "
        "FROM tasks WHERE user_id = $1 GROUP BY priority",
        userId
    );

    while (!f.done()) {
        for (auto& row : f.result()) {
            result[std::to_string(row["priority"].as<int>())] =
                row["cnt"].as<int>();
        }
        f.next();
    }

    return result;
}

}  // namespace services
