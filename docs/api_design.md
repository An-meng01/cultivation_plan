# API 接口设计

Base URL: `http://localhost:8080/api`

---

## 任务模块

### 获取所有任务
```
GET /tasks
Query: ?topic=xx&priority=0&source=custom&completed=false
Response 200:
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "title": "...",
      "description": "...",
      "topic": "...",
      "priority": 1,
      "source": "custom",
      "needReviewReminder": true,
      "completed": false,
      "deadline": "2026-07-10T00:00:00",
      "createdAt": "2026-07-06T12:00:00",
      "completedAt": null
    }
  ]
}
```

### 创建任务
```
POST /tasks
Body:
{
  "title": "...",
  "description": "...",
  "topic": "...",
  "priority": 1,
  "needReviewReminder": true,
  "deadline": "2026-07-10T00:00:00"
}
Response 201: { "code": 0, "data": { "id": 2 } }
```

### 获取单个任务
```
GET /tasks/:id
Response 200: { "code": 0, "data": { ... } }
```

### 更新任务
```
PUT /tasks/:id
Body: { "title": "...", "completed": true }
Response 200: { "code": 0, "message": "ok" }
```

### 删除任务
```
DELETE /tasks/:id
Response 200: { "code": 0, "message": "ok" }
```

### 完成任务
```
PUT /tasks/:id/complete
Response 200: { "code": 0, "message": "ok" }
```

### 获取系统推荐任务
```
GET /tasks/system
Response 200: { "code": 0, "data": [ ... ] }
```

---

## 打卡模块

### 打卡签到
```
POST /clock-in
Body: { "taskId": 1 }
Response 201: { "code": 0, "message": "checked in" }
```

### 获取打卡记录
```
GET /clock-records
Query: ?taskId=1&date=2026-07-06
Response 200:
{
  "code": 0,
  "data": [
    { "id": 1, "taskId": 1, "taskTitle": "...", "checkInTime": "..." }
  ]
}
```

---

## 分析模块

### 总体概览
```
GET /analysis/overview
Response 200:
{
  "code": 0,
  "data": {
    "totalTasks": 10,
    "completed": 6,
    "pending": 4,
    "completionRate": 60.0,
    "topicDistribution": { "编程": 5, "英语": 3, "数学": 2 },
    "topicCompletionRate": { "编程": 80.0, "英语": 33.3, "数学": 50.0 }
  }
}
```

### 每日统计
```
GET /analysis/daily
Query: ?start=2026-07-01&end=2026-07-06
Response 200:
{
  "code": 0,
  "data": [
    { "date": "2026-07-01", "added": 2, "completed": 1, "rate": 50.0 },
    ...
  ]
}
```

### 优先级分布
```
GET /analysis/priorities
Response 200: { "code": 0, "data": { "0": 2, "1": 5, "2": 3, "3": 1 } }
```
