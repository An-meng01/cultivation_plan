#include "services/StatsService.h"
#include <drogon/drogon.h>
#include <json/value.h>
#include <cmath>

using namespace drogon;

namespace services {

Json::Value StatsService::getOverview(int userId) {
    Json::Value result;
    auto db = app().getDbClient("default");

    auto rows = db->execSqlSync(
        "SELECT COUNT(*) AS total, "
        "SUM(CASE WHEN completed THEN 1 ELSE 0 END) AS done, "
        "topic FROM tasks WHERE user_id = $1 "
        "AND COALESCE(review_status, 'none') != 'pending' "
        "GROUP BY topic",
        userId
    );

    int total = 0, done = 0;
    Json::Value topicDist(Json::arrayValue);
    Json::Value topicRate(Json::arrayValue);

    for (const auto& row : rows) {
        int t = row["total"].as<int>();
        int d = row["done"].as<int>();
        total += t;
        done += d;
        std::string topic = row["topic"].as<std::string>();
        if (topic.empty()) topic = "未分类";

        Json::Value itemDist;
        itemDist["topic"] = topic;
        itemDist["count"] = t;
        topicDist.append(itemDist);

        Json::Value itemRate;
        itemRate["topic"] = topic;
        itemRate["completed"] = d;
        itemRate["rate"] = t > 0 ? std::round(d * 10000.0 / t) / 100.0 : 0.0;
        topicRate.append(itemRate);
    }

    result["totalTasks"] = total;
    result["completed"] = done;
    result["pending"] = total - done;
    result["completionRate"] = total > 0 ? (done * 100.0 / total) : 0.0;
    result["topicDist"] = topicDist;
    result["topicRate"] = topicRate;
    return result;
}

Json::Value StatsService::getDailyStats(const std::string& start,
                                         const std::string& end,
                                         int userId) {
    Json::Value arr(Json::arrayValue);
    auto db = app().getDbClient("default");

    // Generate all dates in range with added/completed counts via LEFT JOINs
    auto result = db->execSqlSync(
        "WITH dates AS ("
        "  SELECT d::date AS dt FROM generate_series($2::date, $3::date, '1 day') AS d"
        "), added AS ("
        "  SELECT DATE(created_at) AS dt, COUNT(*) AS cnt"
        "  FROM tasks WHERE user_id = $1"
        "  AND COALESCE(review_status, 'none') != 'pending'"
        "  AND DATE(created_at) BETWEEN $2::date AND $3::date"
        "  GROUP BY dt"
        "), completed AS ("
        "  SELECT DATE(completed_at) AS dt, COUNT(*) AS cnt"
        "  FROM tasks WHERE user_id = $1"
        "  AND COALESCE(review_status, 'none') != 'pending'"
        "  AND completed_at IS NOT NULL"
        "  AND DATE(completed_at) BETWEEN $2::date AND $3::date"
        "  GROUP BY dt"
        ")"
        "SELECT dates.dt,"
        "  COALESCE(added.cnt, 0) AS added,"
        "  COALESCE(completed.cnt, 0) AS done"
        " FROM dates"
        " LEFT JOIN added ON dates.dt = added.dt"
        " LEFT JOIN completed ON dates.dt = completed.dt"
        " ORDER BY dates.dt",
        userId, start, end
    );

    // Get baseline total before start date
    int cumulativeTotal = 0;
    {
        auto before = db->execSqlSync(
            "SELECT COUNT(*) AS cnt FROM tasks"
            " WHERE user_id = $1 AND COALESCE(review_status, 'none') != 'pending'"
            " AND created_at < $2::date",
            userId, start);
        cumulativeTotal = before[0]["cnt"].as<int>();
    }

    for (const auto& row : result) {
        std::string date = row["dt"].as<std::string>();
        int added = row["added"].as<int>();
        int doneCnt = row["done"].as<int>();
        cumulativeTotal += added;

        Json::Value item;
        item["date"] = date;
        item["added"] = added;
        item["completed"] = doneCnt;
        item["rate"] = cumulativeTotal > 0
            ? std::round(doneCnt * 10000.0 / cumulativeTotal) / 100.0
            : 0.0;
        arr.append(item);
    }

    return arr;
}

Json::Value StatsService::getTopicDistribution(int userId) {
    Json::Value arr(Json::arrayValue);
    auto db = app().getDbClient("default");

    auto result = db->execSqlSync(
        "SELECT topic, COUNT(*) AS cnt "
        "FROM tasks WHERE user_id = $1 "
        "AND COALESCE(review_status, 'none') != 'pending' GROUP BY topic",
        userId
    );

    for (const auto& row : result) {
        Json::Value item;
        std::string topic = row["topic"].as<std::string>();
        if (topic.empty()) topic = "未分类";
        item["topic"] = topic;
        item["count"] = row["cnt"].as<int>();
        arr.append(item);
    }

    return arr;
}

Json::Value StatsService::getPriorityDistribution(int userId) {
    Json::Value arr(Json::arrayValue);
    auto db = app().getDbClient("default");

    auto result = db->execSqlSync(
        "SELECT priority, COUNT(*) AS cnt "
        "FROM tasks WHERE user_id = $1 "
        "AND COALESCE(review_status, 'none') != 'pending' GROUP BY priority",
        userId
    );

    for (const auto& row : result) {
        Json::Value item;
        item["priority"] = row["priority"].as<int>();
        item["count"] = row["cnt"].as<int>();
        arr.append(item);
    }

    return arr;
}

}  // namespace services
