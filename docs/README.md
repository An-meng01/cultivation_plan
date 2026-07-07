# 学习养成计划 (Study Planner)

一个帮助用户添加、管理学习任务，提供提醒功能、复习提醒、任务分析和可视化图表展示的 Web 应用。

---

## 功能列表

### 已实现
- [x] 自定义学习任务创建（标题 / 描述 / 主题 / 优先级 / 截止时间）
- [x] 系统推荐任务一键添加（默认 5 种常见学习任务）
- [x] 任务 CRUD（创建 / 查看 / 编辑 / 删除）
- [x] 完成任务标记（手动完成 + 打卡自动完成）
- [x] 打卡签到模块（每日打卡，自动生成打卡记录）
- [x] 打卡日历热力图（直观展示本月打卡情况）
- [x] 任务提醒（后端定时轮询到期任务，日志输出）
- [x] 进度条展示（总体进度 + 各主题进度）
- [x] 任务分析面板（完成率 / 主题分布 / 优先级分布）
- [x] 每日统计图表（折线图 + 柱状图 + 饼图）
- [x] 按主题 / 优先级 / 来源筛选任务
- [x] 数据持久化（PostgreSQL）
- [x] Docker Compose 一键部署

### 规划中
- [ ] 用户注册与登录（JWT 鉴权）
- [ ] 邮件 / 桌面推送提醒
- [ ] 番茄钟计时器
- [ ] 学习目标与里程碑
- [ ] 数据导出（CSV / PDF）
- [ ] 移动端适配优化
- [ ] 多语言支持

---

## 技术栈

| 层级       | 技术                                                              |
| ---------- | ----------------------------------------------------------------- |
| 前端框架   | React 18 + TypeScript                                             |
| UI 组件库  | Ant Design 5                                                      |
| 图表库     | Recharts 2                                                        |
| 构建工具   | Vite 5                                                            |
| HTTP 客户端| Axios                                                             |
| 日期处理   | Dayjs                                                             |
| 后端框架   | Drogon (C++17)                                                    |
| 数据库     | PostgreSQL 15                                                     |
| 容器编排   | Docker Compose 3.8                                                |
| 反向代理   | Nginx (生产环境)                                                  |

---

## 项目文件架构

```
<project-root>/
├── docker-compose.yml              # 容器编排：PostgreSQL + 后端 + 前端
├── .gitignore
│
├── frontend/                       # React 前端项目
│   ├── Dockerfile                  # 多阶段构建 (Node build → Nginx serve)
│   ├── nginx.conf                  # 生产环境反向代理配置
│   ├── package.json                # 依赖：antd, recharts, axios, dayjs 等
│   ├── tsconfig.json               # TypeScript 配置
│   ├── vite.config.ts              # Vite 构建配置 + 开发代理
│   ├── index.html                  # HTML 入口
│   └── src/
│       ├── main.tsx                # React 入口，配置 Ant Design 中文 + 路由
│       ├── App.tsx                 # 布局（侧边栏 + 内容区），路由定义
│       ├── vite-env.d.ts           # Vite 类型声明
│       ├── components/             # 通用组件
│       │   ├── TaskCard.tsx        # 任务卡片（优先级色标、状态标签、逾期高亮）
│       │   ├── ProgressBar.tsx     # 进度条（总进度 + 按主题分拆）
│       │   ├── CalendarHeatmap.tsx # 打卡日历网格图
│       │   └── StatisticsChart.tsx # 统计图表（折线 / 柱状 / 饼图）
│       ├── pages/                  # 页面
│       │   ├── Dashboard.tsx       # 仪表盘：统计数字 + 进度条 + 趋势图 + 主题饼图
│       │   ├── Tasks.tsx           # 任务列表：卡片展示、新建/编辑弹窗、系统推荐
│       │   ├── ClockIn.tsx         # 打卡页面：待打卡列表 + 日历热力图
│       │   └── Analysis.tsx        # 分析页面：统计数字 + 趋势/柱状/饼图 + 明细表
│       ├── services/
│       │   └── api.ts              # Axios 实例 + 全部 API 接口 + TypeScript 类型
│       ├── hooks/
│       │   ├── useTasks.ts         # 任务 CURD Hook
│       │   └── useClockRecords.ts  # 打卡记录 Hook
│       └── utils/
│           ├── priorityHelper.ts   # 优先级标签/颜色映射
│           └── dateHelper.ts       # 日期格式化 / 逾期判断
│
├── backend/                        # C++ Drogon 后端项目
│   ├── CMakeLists.txt              # CMake 构建 (C++17, Drogon + PostgreSQL)
│   ├── config.json                 # 应用配置（监听端口、DB 连接、线程数）
│   ├── Dockerfile                  # 编译 Drogon 源码 → 构建项目 → 精简部署
│   ├── main.cc                     # 入口：初始化数据库、启动提醒服务、加载配置
│   ├── controllers/                # 控制器（处理 HTTP 请求）
│   │   ├── TaskController.h/.cc    # GET/POST/PUT/DELETE /api/tasks、complete、system
│   │   ├── ClockController.h/.cc   # POST /api/clock-in, GET /api/clock-records
│   │   └── AnalysisController.h/.cc# GET /api/analysis/overview, daily, priorities
│   ├── models/                     # 数据模型 + JSON 序列化
│   │   ├── Task.h/.cc              # 任务模型（与数据库字段对应）
│   │   └── ClockRecord.h/.cc       # 打卡记录模型
│   ├── services/                   # 业务逻辑层
│   │   ├── ReminderService.h/.cc   # 定时轮询到期任务，触发提醒回调
│   │   └── StatsService.h/.cc      # 统计分析（SQL 聚合：完成率/主题分布/每日统计）
│   └── filters/
│       └── AuthFilter.h/.cc        # 可选：API Key 鉴权中间件
│
└── docs/
    ├── README.md                   # ← 本文件
    ├── api_design.md               # RESTful API 接口详细定义
    ├── database_schema.sql          # PostgreSQL 建表语句（含索引 + 默认数据）
    └── requirements_spec.md         # 需求规格说明书
```

---

## 环境要求

- **Docker** 24+
- **Docker Compose** 2.20+
- **Node.js** 20+（仅本地开发需要，Docker 部署不需要）
- **npm** 10+（仅本地开发需要）

---

## 安装与运行步骤

### 方式一：Docker Compose 部署（推荐）

```bash
# 1. 克隆项目
git clone <repo-url> study-planner
cd study-planner

# 2. 一键构建并启动全部服务
docker-compose up --build

# 3. 访问
#    前端: http://localhost
#    后端: http://localhost:8080/api
```

### 方式二：本地开发（前端 + 后端分开启动）

#### 前端

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 （API 自动代理到 localhost:8080）
```

#### 后端

需要本地安装 Drogon 和 PostgreSQL，参见 [Drogon 官方文档](https://github.com/drogonframework/drogon)。

```bash
cd backend
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)
./study_planner
# → http://localhost:8080
```

---

## 使用说明

| 页面       | 路由           | 功能说明                                                               |
| ---------- | -------------- | ---------------------------------------------------------------------- |
| 仪表盘     | `/`            | 总任务数 / 完成数 / 完成率 + 进度条 + 每日趋势折线图 + 主题饼图        |
| 任务管理   | `/tasks`       | 创建/编辑/删除任务、标记完成、一键添加系统推荐任务                      |
| 打卡签到   | `/clock-in`    | 查看待打卡任务列表并进行打卡、查看本月打卡日历                          |
| 任务分析   | `/analysis`    | 统计数字 + 趋势/柱状/饼图 + 主题完成率表格 + 30 天每日明细表            |

**任务优先级：**
- `0` 低（绿色） / `1` 中（蓝色） / `2` 高（橙色） / `3` 紧急（红色）

**打卡操作：** 在打卡页面对未完成的任务点击「打卡」，系统会自动完成该任务并生成打卡记录。日历中用绿色标记已打卡日期。

---

## API 文档

### 通用响应格式

```json
{ "code": 0, "data": { ... } }
// 或
{ "code": 404, "message": "not found" }
```

### 任务模块

| 端点                    | 方法   | 说明           | 请求体                                                                  | 返回                              |
| ----------------------- | ------ | -------------- | ----------------------------------------------------------------------- | --------------------------------- |
| `/api/tasks`            | GET    | 获取任务列表   | Query: `?topic=&priority=&source=&completed=`                           | `{ code:0, data:[Task] }`         |
| `/api/tasks`            | POST   | 创建任务       | `{ title, description?, topic?, priority?, needReviewReminder?, deadline? }` | `{ code:0, data:{ id } }`      |
| `/api/tasks/{id}`       | GET    | 获取单个任务   | -                                                                       | `{ code:0, data:Task }`           |
| `/api/tasks/{id}`       | PUT    | 更新任务       | `{ title?, description?, topic?, priority?, completed? }`               | `{ code:0, message:"ok" }`        |
| `/api/tasks/{id}`       | DELETE | 删除任务       | -                                                                       | `{ code:0, message:"ok" }`        |
| `/api/tasks/{id}/complete` | PUT | 完成任务     | -                                                                       | `{ code:0, message:"ok" }`        |
| `/api/tasks/system`     | GET    | 系统推荐任务   | -                                                                       | `{ code:0, data:[Task] }`         |

### 打卡模块

| 端点                  | 方法 | 说明         | 请求体              | 返回                              |
| --------------------- | ---- | ------------ | ------------------- | --------------------------------- |
| `/api/clock-in`       | POST | 打卡签到     | `{ taskId }`        | `{ code:0, message:"checked in" }` |
| `/api/clock-records`  | GET  | 打卡记录查询 | Query: `?taskId=&date=` | `{ code:0, data:[ClockRecord] }` |

### 分析模块

| 端点                       | 方法 | 说明           | 请求体                  | 返回                                   |
| -------------------------- | ---- | -------------- | ----------------------- | -------------------------------------- |
| `/api/analysis/overview`   | GET  | 总体概览       | -                       | `{ code:0, data:AnalysisOverview }`    |
| `/api/analysis/daily`      | GET  | 每日统计       | Query: `?start=&end=`   | `{ code:0, data:[DailyStat] }`         |
| `/api/analysis/priorities` | GET  | 优先级分布     | -                       | `{ code:0, data:{ "0":2, "1":5 } }`   |

### 数据模型

```typescript
interface Task {
  id: number; title: string; description: string; topic: string;
  priority: 0|1|2|3; source: "custom"|"system";
  needReviewReminder: boolean; completed: boolean;
  deadline: string|null; createdAt: string; completedAt: string|null;
}

interface AnalysisOverview {
  totalTasks: number; completed: number; pending: number;
  completionRate: number;
  topicDistribution: Record<string, number>;
  topicCompletionRate: Record<string, number>;
}

interface DailyStat { date: string; added: number; completed: number; rate: number; }
```

完整 API 文档见 [`api_design.md`](api_design.md)。

---

## 配置说明

### docker-compose.yml 环境变量

| 变量           | 默认值          | 说明                 |
| -------------- | --------------- | -------------------- |
| `POSTGRES_DB`  | `study_planner` | 数据库名             |
| `POSTGRES_USER`| `planner`       | 数据库用户           |
| `POSTGRES_PASSWORD` | `planner123` | 数据库密码        |
| `DB_HOST`      | `postgres`      | 后端连接的数据库主机 |
| `DB_PORT`      | `5432`          | 数据库端口           |

### 后端 config.json

监听 0.0.0.0:8080，4 个工作线程，启用 CORS。数据库连接使用 `${DB_*}` 占位符，运行时会替换为环境变量的值。

---

## 分支与提交规范

### 分支命名

```
main         —— 稳定发布分支
dev          —— 开发集成分支
feat/<name>  —— 新功能（如 feat/task-filter）
fix/<name>   —— 修复（如 fix/deadline-bug）
docs/<name>  —— 文档（如 docs/api-update）
refactor/<name> —— 重构
```

### 提交信息格式

```
<type>: <简短描述>

<可选详细说明>
```

| type      | 说明             |
| --------- | ---------------- |
| `feat`    | 新功能           |
| `fix`     | 修复             |
| `docs`    | 文档相关         |
| `style`   | 格式调整         |
| `refactor`| 重构             |
| `test`    | 测试相关         |
| `chore`   | 构建/工具相关    |
| `perf`    | 性能优化         |

示例：
```
feat: 添加按主题筛选任务功能
fix: 修复打卡日历每月天数显示错误
docs: 更新 API 文档，补充统计分析接口
```

---

## 已知问题 / TODO

### 已知问题
- 未实现用户鉴权，当前所有操作使用默认用户 ID=1
- 提醒功能仅输出日志，未集成邮件/推送通道
- 前端未实现按优先级/主题筛选（API 已支持，待接入 UI）

### 后续规划
- [ ] 用户注册与 JWT 鉴权
- [ ] 邮件 / WebSocket 推送提醒
- [ ] 番茄钟 + 专注计时统计
- [ ] 学习目标设定 + 里程碑追踪
- [ ] CSV/PDF 数据导出
- [ ] 响应式移动端布局
- [ ] 暗色主题
- [ ] 自动化测试（前后端）
- [ ] CI/CD 流水线

---


