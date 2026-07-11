# 学习养成计划 (Study Planner)

帮助用户创建、管理、追踪学习任务的 Web 应用，提供任务提醒、每日打卡签到、番茄钟专注、进度可视化与统计分析功能。

---

## 功能列表

### 已实现
- [x] 自定义学习任务创建（标题 / 描述 / 主题 / 优先级 / 截止时间 / 任务类型）
- [x] 三种任务类型：每日打卡 / 周期任务（可设间隔天数）/ 一次性任务
- [x] 系统推荐任务一键添加（英语 / 编程 / 阅读 / 数学 / 复习 5 种模板）
- [x] 任务 CRUD + 筛选（主题 / 优先级 / 来源 / 状态 / 类型）
- [x] 完成任务标记（手动完成 + 打卡自动完成）
- [x] 签到打卡模块（每日打卡，重复打卡返回 409）
- [x] 打卡日历热力图（按月切换，绿色标记已打卡日期）
- [x] 打卡成功庆祝动画（CSS 彩带 + 对勾）
- [x] 任务提醒（后端独立线程定时轮询，按优先级分间隔输出日志）
- [x] 提醒历史记录（reminders / notifications 表持久化）
- [x] 进度条展示（总体进度 + 各主题进度）
- [x] 分析面板（完成率 / 主题分布 / 优先级分布 / 30 日明细表）
- [x] 统计图表（折线图 + 柱状图 + 饼图，Recharts 自适应容器）
- [x] 仪表盘概览（4 统计卡片 + 进度条 + 趋势折线图 + 主题饼图）
- [x] 用户注册与登录（Token 会话，参数化查询 + 密码校验）
- [x] 个人资料管理（邮箱 / 手机设置，前端脱敏显示）
- [x] 密码修改（旧密码验证）
- [x] 头像上传（Base64 → 待审核 → 管理员审批工作流）
- [x] 管理员面板（用户管理 / 头像审核 / 任务审核）
- [x] 管理员审核通知（用户下次登录时查看审核结果）
- [x] 番茄钟计时器（25min 专注 / 5min 短休 / 15min 长休，SVG 圆环倒计时）
- [x] 番茄钟会话计数
- [x] 暗色 / 亮色主题（localStorage 持久化，antd darkAlgorithm）
- [x] 响应式侧边栏（桌面悬浮展开 / 移动端抽屉导航）
- [x] 动画导航指示器（滑块跟随鼠标 + 选中项）
- [x] Data persistence（PostgreSQL 15）
- [x] Mock Server 模式（`VITE_USE_MOCK=true`，前端独立开发）
- [x] Docker Compose 一键部署（3 容器：PostgreSQL + 后端 + 前端）
- [x] setup.ps1 脚本（配置 Docker 镜像加速器，解决国内网络问题）

### 规划中
- [ ] JWT 鉴权（当前为 Token 会话方案）
- [ ] 邮件 / WebSocket 推送通知
- [ ] 学习目标与里程碑追踪
- [ ] CSV / PDF 数据导出
- [ ] 移动端深度适配
- [ ] i18n 多语言支持
- [ ] 前后端自动化测试
- [ ] CI/CD 流水线

---

## 技术栈

| 层级 | 技术 | 选择原因与优势 |
| --- | --- | --- |
| 前端框架 | React 18 + TypeScript | 组件化开发、虚拟 DOM 高效渲染、Hooks 状态逻辑复用；TypeScript 静态类型检查减少运行时错误，大型项目可维护性强 |
| UI 组件库 | Ant Design 5 | 企业级组件生态完整（Form/Table/Modal/Calendar），开箱即用减少重复造轮子；支持 CSS-in-JS 主题定制和 darkAlgorithm 暗色模式 |
| 图表库 | Recharts 2 | 基于 React 组件化声明式 API，与 Ant Design 搭配自然；ResponsiveContainer 自动适配容器宽高，支持折线/柱状/饼图等常见图表 |
| 构建工具 | Vite 5 | 原生 ES Module 开发服务器秒级冷启动、HMR 极速热更新；Rollup 生产构建 Tree-shaking 优化，比 Webpack 开发体验提升明显 |
| HTTP 客户端 | Axios 1.7 | 拦截器机制统一注入 Token 和错误处理；请求/响应转换、超时控制、取消请求等内置功能，减少样板代码 |
| 日期处理 | Dayjs 1.11 | 2KB 轻量级，API 与 Moment.js 兼容但体积仅 1/30；链式调用、不可变操作、插件化设计（按需加载时区/相对时间等） |
| 后端框架 | Drogon (C++17) | 高性能异步非阻塞，单机并发能力远超 Node.js/Python；跨平台（Windows/Linux/macOS），统一语言栈方便 C++ 开发者维护 |
| 数据库 | PostgreSQL 15 | 成熟的关系型数据库，支持复杂聚合查询（窗口函数 / FILTER）、JSONB 灵活存储；ACID 事务保证数据一致性，pg_isready 健康检查便于容器编排 |
| 容器编排 | Docker Compose 3.8 | 三服务一键编排（PostgreSQL + Backend + Frontend），healthcheck 控制启动顺序；环境变量注入配置，多阶段构建减小生产镜像体积 |
| 反向代理 | Nginx | 高性能反向代理，`/api` 路径透传到后端 8080；SPA 路由 `try_files` 处理前端 history 模式；配置简单稳定，生产环境标配 |

---

## 项目结构

```
cultivation_plan/
├── docker-compose.yml              # PostgreSQL + Backend + Frontend 编排
├── setup.ps1                       # Docker 镜像加速器配置脚本（Windows）
├── .gitignore
│
├── frontend/                       # React 18 + TypeScript SPA
│   ├── Dockerfile                  # 多阶段构建：Node build → Nginx serve
│   ├── nginx.conf                  # 生产环境反向代理（/api → backend:8080）
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts              # Vite + React 插件 + 开发代理配置
│   ├── index.html
│   └── src/
│       ├── main.tsx                # React 入口：BrowserRouter + ThemeProvider
│       ├── App.tsx                 # 根布局：侧边栏 + 路由 + 鉴权守卫
│       ├── pages/
│       │   ├── Dashboard.tsx       # 仪表盘：统计卡片 + 进度条 + 趋势折线图 + 饼图
│       │   ├── Tasks.tsx           # 任务管理：卡片列表、新建/编辑弹窗、筛选、系统推荐
│       │   ├── ClockIn.tsx         # 打卡签到：待打卡列表 + 日历热力图
│       │   ├── Analysis.tsx        # 数据分析：概览数字 + 趋势/柱状/饼图 + 明细表
│       │   ├── Pomodoro.tsx        # 番茄钟：SVG 环形倒计时 + 专注/短休/长休
│       │   ├── Login.tsx           # 登录/注册（动画切换遮罩层）
│       │   ├── Admin.tsx           # 管理员布局
│       │   ├── Account.tsx         # 个人设置（邮箱/手机脱敏显示）
│       │   ├── Settings.tsx        # 主题切换 + 默认提醒天数
│       │   └── Achievements.tsx    # 学习成就展示
│       ├── components/
│       │   ├── TaskCard.tsx        # 任务卡片（优先级色标、逾期/即将逾期高亮）
│       │   ├── ProgressBar.tsx     # 进度条（总体 + 各主题拆分）
│       │   ├── CalendarHeatmap.tsx # 打卡日历热力图（按月切换）
│       │   ├── StatisticsChart.tsx # Recharts 封装（Line / Bar / Pie）
│       │   ├── CheckInSuccess.tsx  # 打卡成功庆祝动画（纯 CSS）
│       │   ├── AdminPanel.tsx      # 管理员面板：用户 / 头像 / 任务审核
│       │   ├── UserProfile.tsx     # 用户头像上传 + 审核工作流
│       │   └── TrackingNav.tsx     # 侧边栏导航指示器（滑块动画）
│       ├── hooks/
│       │   ├── useTasks.ts         # 任务 CRUD 封装
│       │   ├── useClockRecords.ts  # 打卡记录封装
│       │   └── useIsMobile.ts      # 响应式断点检测
│       ├── services/
│       │   ├── api.ts              # Axios 实例 + 全部 API 接口 + 类型定义
│       │   └── mockServer.ts       # 内存 Mock 后端（VITE_USE_MOCK=true）
│       ├── utils/
│       │   ├── priorityHelper.ts   # 优先级标签/颜色映射
│       │   ├── dateHelper.ts       # 日期格式化 / 逾期判断
│       │   ├── taskStatus.ts       # 任务打卡状态逻辑
│       │   └── response.ts         # 统一错误处理
│       └── theme/
│           └── ThemeContext.tsx     # 暗色/亮色主题 Context + antd ConfigProvider
│
├── backend/                        # C++17 Drogon REST API
│   ├── CMakeLists.txt              # CMake 构建（C++17, Drogon, PostgreSQL）
│   ├── config.json                 # 应用配置（端口、线程、DB 连接）
│   ├── Dockerfile                  # 多阶段构建（编译 Drogon → 构建项目 → 精简部署）
│   ├── main.cc                     # 入口：注册控制器 + 启动提醒服务
│   ├── controllers/
│   │   ├── TaskController.h/.cc    # 任务 CRUD + 完成 + 系统推荐 + 今日数量
│   │   ├── ClockController.h/.cc   # 打卡 + 打卡记录查询
│   │   ├── AnalysisController.h/.cc# 概览 / 每日 / 优先级 + 健康检查
│   │   ├── AuthController.h/.cc    # 登录 / 注册 / 个人资料 / 改密 / 通知
│   │   ├── AdminController.h/.cc   # 用户管理 / 头像审核 / 任务审核
│   │   └── ReminderController.h/.cc# 提醒列表 + 确认
│   ├── models/
│   │   ├── Task.h/.cc              # 任务模型 + JSON 序列化
│   │   └── ClockRecord.h/.cc       # 打卡记录模型 + JSON 序列化
│   ├── services/
│   │   ├── ReminderService.h/.cc   # 后台独立线程，定时轮询到期任务
│   │   └── StatsService.h/.cc      # 统计分析 SQL 聚合查询
│   ├── filters/
│   │   ├── AuthFilter.h/.cc        # Bearer Token → session → user_id
│   │   └── AdminFilter.h/.cc       # Bearer Token → session → role=admin
│   └── utils/
│       └── AuthContext.h           # getUserId() 工具函数
│
├── build/                          # CMake 构建输出（VS 工程 + DLL + EXE）
│   └── Release/study_planner.exe   # 已编译的后端可执行文件
│
├── drogon_local/                   # 内嵌 Drogon 框架源码（离线构建用）
│   ├── conanfile.txt
│   └── trantor/                    # Trantor 网络库（Drogon 依赖）
│
└── docs/
    ├── README.md                   # ← 本文件
    ├── api_design.md               # RESTful API 详细定义
    ├── database_schema.sql         # 完整建表 SQL（6 表 + 索引 + 种子数据）
    ├── migrations.sql              # 增量迁移脚本
    ├── seed_data.sql               # 测试种子数据
    ├── System_Design_Document.md   # 系统设计文档（架构图 / UML / 算法）
    └── requirements_spec.md        # 需求规格说明书
```

---

## 环境要求

- **Docker** 24+ & **Docker Compose** 2.20+（推荐部署方式）
- **Node.js** 20+ & **npm** 10+（仅本地开发前端需要）
- **Windows** 环境建议先运行 `setup.ps1` 配置镜像加速器

---

## 安装与运行

### Docker Compose 部署（推荐）

```bash
# 配置 Docker 镜像加速器（Windows 首次部署建议执行）
powershell -File setup.ps1

# 构建并启动全部服务
docker compose up --build

# 访问
#   前端: http://localhost
#   后端 API: http://localhost:8080/api
```

### 本地开发

#### 前端（独立开发）

```bash
cd frontend
npm install

# 方式 A：连接真实后端
npm run dev               # → http://localhost:5173（API 代理到 localhost:8080）

# 方式 B：Mock 模式（无需后端）
$env:VITE_USE_MOCK="true"; npm run dev
```

#### 后端

需要本地安装 Drogon 和 PostgreSQL，参见 [Drogon 官方文档](https://github.com/drogonframework/drogon)。

```bash
cd backend
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release
./Release/study_planner   # → http://localhost:8080
```

---

## 使用说明

| 页面 | 路由 | 功能 |
| --- | --- | --- |
| 仪表盘 | `/` | 统计卡片（总/已完成/待办/完成率）+ 进度条 + 折线图 + 饼图 |
| 任务管理 | `/tasks` | 创建/编辑/删除/完成任务，筛选，一键添加系统推荐 |
| 打卡签到 | `/clock-in` | 今日待打卡列表 + 打卡操作 + 历史日历热力图 |
| 数据分析 | `/analysis` | 完成概览 + 趋势/柱状/饼图 + 主题完成率 + 30 日明细 |
| 番茄钟 | `/pomodoro` | SVG 环形倒计时，专注 25min / 短休 5min / 长休 15min |
| 个人设置 | `/settings` | 暗色/亮色主题切换，默认提醒天数 |
| 个人中心 | `/account` | 邮箱/手机设置（脱敏显示），修改密码 |
| 成就 | `/achievements` | 学习数据展示 |
| 管理面板 | `/admin` | 用户管理 / 头像审核 / 任务审核（需 admin 角色） |

**任务优先级：** `0` 低（绿）/ `1` 中（蓝）/ `2` 高（橙）/ `3` 紧急（红）

**任务类型：** 每日打卡 / 周期任务（N 天一次）/ 一次性任务

**打卡操作：** 在打卡页面对待完成任务点击「打卡」，成功后自动生成打卡记录并显示庆祝动画。重复打卡返回 409。

---

## Docker 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `POSTGRES_DB` | `study_planner` | 数据库名 |
| `POSTGRES_USER` | `planner` | 数据库用户 |
| `POSTGRES_PASSWORD` | `planner123` | 数据库密码 |
| `DB_HOST` | `postgres` | 后端连接的数据库主机 |
| `DB_PORT` | `5432` | 数据库端口 |
| `GITHUB_MIRROR` | `https://gitclone.com/github.com` | GitHub 镜像（构建后端时拉取 Drogon 源码） |

---

## API 概览

所有 API 返回统一格式：`{ "code": 0, "data": {...} }` 或 `{ "code": NNN, "message": "..." }`

| 模块 | 端点 | 说明 |
| --- | --- | --- |
| 认证 | `POST /api/auth/login` | 登录 |
| | `POST /api/auth/register` | 注册 |
| | `PUT /api/auth/profile` | 更新个人资料 |
| | `PUT /api/auth/password` | 修改密码 |
| | `GET /api/auth/notices` | 获取管理员审核通知 |
| 任务 | `GET/POST /api/tasks` | 列表 / 创建 |
| | `GET/PUT/DELETE /api/tasks/{id}` | 单个任务查/改/删 |
| | `PUT /api/tasks/{id}/complete` | 标记完成 |
| | `GET /api/tasks/system` | 系统推荐任务 |
| | `GET /api/tasks/today-count` | 今日任务数量 |
| 打卡 | `POST /api/clock-in` | 打卡签到 |
| | `GET /api/clock-records` | 打卡记录查询 |
| 分析 | `GET /api/analysis/overview` | 总体概览 |
| | `GET /api/analysis/daily` | 每日统计 |
| | `GET /api/analysis/priorities` | 优先级分布 |
| | `GET /api/analysis/health` | 健康检查 |
| 提醒 | `GET /api/reminders` | 提醒列表 |
| | `PUT /api/reminders/{id}/ack` | 确认提醒 |
| 管理 | `GET /api/admin/users` | 用户列表 |
| | `DELETE /api/admin/users/{id}` | 删除用户 |
| | `GET /api/admin/pending-avatars` | 待审核头像 |
| | `POST /api/admin/avatars/{id}/review` | 审核头像 |
| | `GET /api/admin/pending-tasks` | 待审核任务 |
| | `POST /api/admin/tasks/{id}/review` | 审核任务 |

完整 API 文档见 [`api_design.md`](api_design.md)。

---

## 分支与提交规范

### 分支命名

```
main         —— 稳定发布
dev          —— 开发集成
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

| type | 说明 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 修复 |
| `docs` | 文档 |
| `style` | 格式调整 |
| `refactor` | 重构 |
| `test` | 测试 |
| `chore` | 构建/工具 |
| `perf` | 性能优化 |

---

## 已知问题

- 鉴权采用 Token 会话方案，未使用 JWT
- 提醒功能仅输出日志，未对接邮件 / WebSocket 推送通道
- 默认管理员账号密码硬编码在 `database_schema.sql` 的种子数据中

---

## 实践总结

### 一、实践过程中的具体任务

#### 1. 需求分析阶段
- **现状调研**：识别学习任务分散管理、缺乏复习提醒、缺少可视化反馈、无系统数据分析等痛点
- **可行性分析**：技术（C++ Drogon + React 全开源栈可行）、操作（Web 零安装）、经济（零成本）三重评估
- **用户画像**：在校学生、自学者、上班族三类目标用户
- **功能需求规格**：撰写 `docs/requirements_spec.md`，包含 5 大模块、15 个功能用例（FR-001 至 FR-015），每个用例含描述 / 前置条件 / 输入 / 处理流程 / 输出 / 异常处理 / UI 交互

#### 2. 系统设计阶段
- **架构设计**：B/S 前后端分离 + Docker Compose 三容器编排（PostgreSQL + Drogon 后端 + Nginx/React 前端）
- **分层架构**：前端 Page → Component → Hook → Service；后端 Controller → Service → Model → DB；Filter 横切鉴权
- **数据库设计**：6 张表（`users`、`sessions`、`tasks`、`clock_records`、`reminders`、`notifications`），含索引、外键、种子数据
- **API 设计**：RESTful 风格，统一 `{code, data, message}` 响应格式，覆盖认证 / 任务 / 打卡 / 分析 / 提醒 / 管理 6 大模块
- **算法设计**：差异化提醒算法、统计聚合算法、打卡去重算法

#### 3. 编码实现阶段
- **后端 C++/Drogon**：6 个 Controllers、2 个 Models、2 个 Services、2 个 Filters 完整实现
- **前端 React/TypeScript**：9 个页面、8 个组件、3 个 Hook、5 个工具模块、1 个主题模块
- **Mock Server**：`mockServer.ts` 内存模拟所有 API 端点，支持前后端并行开发
- **构建部署**：Dockerfile 多阶段构建、docker-compose.yml 编排、Nginx 反向代理、setup.ps1 镜像加速脚本

#### 4. 测试验证阶段
- Docker Compose 端到端验证所有功能
- Git 版本管理，约 20 次 commit，遵循 `<type>: <desc>` 规范

### 二、成果

| 维度 | 成果 |
| --- | --- |
| **核心功能** | 任务 CRUD、系统推荐、3 种任务类型、多维度筛选 |
| **打卡系统** | 每日签到、去重（409）、标题快照、日历热力图、庆祝动画 |
| **提醒系统** | 后台独立线程 120s 轮询，4 级优先级差异化频率、去重缓存 |
| **分析模块** | 概览统计、每日趋势折线/柱状图、主题饼图、优先级分布、30 日明细表 |
| **用户系统** | 注册/登录、Token 会话、邮箱/手机管理（脱敏）、密码修改 |
| **管理后台** | 用户管理、头像审核、任务审核、审核通知 |
| **番茄钟** | SVG 圆环倒计时、25/5/15 三模式、会话计数 |
| **UI/UX** | 暗色/亮色主题、响应式侧边栏、动画导航指示器、中文 Ant Design |
| **部署** | Docker Compose 一键部署、多阶段构建、Windows setup 脚本 |

交付物：前后端约 **20,000 行代码**（前端 ~12,000 行 TypeScript + 后端 ~8,000 行 C++），配套 **7 份文档**（需求规格、系统设计、API 文档、数据库 Schema、迁移脚本、种子数据、README）。

### 三、使用到的系统分析与设计方法

| 方法 | 应用位置 | 具体实践 |
| --- | --- | --- |
| **结构化分析（SA）** | 需求分析 | 数据流图（DFD）描述打卡/提醒/统计三大核心流程的数据流转；模块→子功能→功能点三级层次组织 |
| **面向对象分析（OOA）** | 领域建模 | 识别 `Task`、`ClockRecord`、`User` 实体对象及其属性、行为、关系 |
| **面向对象设计（OOD）** | 架构设计 | UML 类图设计前后端组件关系：Controller → Service → Model，Filter 横切 |
| **UML 建模** | 系统设计 | 时序图描述 4 个核心用例完整交互；类图设计前后端架构；活动图描述算法逻辑 |
| **分层架构** | 软件架构 | 前端 4 层、后端 4 层，层间单向依赖，Filter 横切关注点 |
| **RESTful API 设计** | 接口设计 | 资源导向 URL、HTTP 动词、统一响应格式、状态码语义（400/404/409） |
| **B/S + 容器化架构** | 部署架构 | Docker Compose 编排三容器，Nginx 反向代理 |
| **数据库规范化** | 数据建模 | 6 表 3NF 设计，外键约束，参数化 SQL 防注入 |
| **设计模式** | 代码结构 | Controller-Service-Model、Filter 管道过滤器、Hook 状态复用、单例后台线程 |
| **算法设计** | 业务逻辑 | 差异化提醒（权重轮询）、统计聚合（日期归并）、打卡去重（幂等校验） |

---

## 知识点应用总结

### 一、如何利用所学知识点进行数据结构与算法设计

#### 1.1 数据结构的应用

| 知识点 | 项目应用 | 解决的实际问题 |
| --- | --- | --- |
| **结构体/类** | `Task` 模型：id, userId, title, priority, deadline, completedAt 等字段 | 将数据库行映射为内存对象，实现 JSON 序列化/反序列化 |
| **枚举** | priority 取值 0/1/2/3 对应低/中/高/紧急 | 替代魔数，switch 分支可读性高 |
| **哈希表 / 集合** | ReminderService 中的 `remindedCache`：`unordered_map<string, bool>` | O(1) 查重，防止同批次内重复提醒 |
| **队列 / 计数器** | `pollCount` 全局递增计数器 + 取模运算 | 实现优先级差异化提醒频率调度 |
| **SQL 聚合** | StatsService 的 `COUNT(*)`, `GROUP BY`, `FILTER(WHERE ...)` | 数据库端完成统计，避免全量数据拉到内存 |
| **JSON 序列化** | `Task::toJson()` / `fromJson()` | C++ 后端与 TypeScript 前端跨语言数据交换 |

#### 1.2 关键算法设计

**算法 1：差异化提醒轮询**

```
pollCount 每 120s 自增 1
对每个候选任务 t：
    interval = MAP[t.priority]     // 3→1, 2→2, 1→6, 0→12
    batch = floor(pollCount / interval)
    if (pollCount % interval == 0 && !reminded[t.id_batch])
        fireReminder(t)
        reminded[t.id_batch] = true
```

- 知识点运用：取模运算实现周期调度、哈希表记忆化防重复
- 效果：紧急任务每 2 分钟提醒一次，低优先级每 24 分钟一次

**算法 2：统计聚合**

```
overview：COUNT(*) 总任务 + COUNT(completed) 已完成 → 完成率
daily：日期区间遍历 → lookup 归并新增/完成 → 累计总数算每日完成率
priorities：GROUP BY priority COUNT(*)
```

- 知识点运用：归并算法思想合并两个日期结果集、滑窗累加
- 效果：前端 3 个并行请求，后端秒级返回

**算法 3：打卡去重**

```
if EXISTS(SELECT 1 FROM clock_records WHERE task_id=$1 AND
          user_id=$2 AND DATE(check_in_time)=today)
    return 409 Conflict     // 数据库级幂等校验
else
    INSERT clock_records + UPDATE tasks SET completed=TRUE
```

- 知识点运用：数据库查询实现幂等性校验、快照模式保存历史标题
- 效果：防止重复打卡，记录不随任务编辑变化

### 二、如何利用开发工具解决实际问题

| 工具 | 解决的实际问题 | 关键用法 |
| --- | --- | --- |
| **Drogon** | 高性能 C++ REST API | `app().registerController()`、参数化查询防注入 |
| **CMake** | 跨平台构建、依赖管理 | `find_package(Drogon REQUIRED)` |
| **PostgreSQL** | 数据持久化、关系查询 | 6 表 3NF 设计、参数化 SQL |
| **React 18 + Vite 5** | SPA 快速开发 + HMR | proxy 配置 `/api` 转发到后端 |
| **Ant Design 5** | 企业级 UI 快速搭建 | Form/Modal/Table/Card 组件 + darkAlgorithm 暗色主题 |
| **Recharts 2** | 响应式统计图表 | ResponsiveContainer 自适应布局 |
| **Axios** | HTTP 统一管理 | 拦截器注入 Token + 统一错误处理 |
| **Dayjs** | 日期计算 | 截止时间判断 + 日历日期归一化 |
| **Docker Compose** | 一键部署、环境隔离 | 3 服务编排 + 健康检查 + 依赖等待 |
| **Nginx** | 反向代理 + 静态资源 | `/api` 代理到 `backend:8080`，SPA try_files |
| **Git** | 版本控制、分支管理 | feat/fix/docs 分支，`<type>: <desc>` 提交规范 |

**典型案例：**

1. **前后端解耦 → Mock Server**：`VITE_USE_MOCK=true` 时用 `mockServer.ts` 拦截所有请求，后端 C++ 编译慢不阻塞前端开发
2. **国内网络问题 → 镜像加速**：`setup.ps1` 配置 Docker registry mirror + `GITHUB_MIRROR` 变量
3. **多环境配置 → 环境变量分离**：`docker-compose.yml` 通过 `${DB_PASSWORD:-default}` 适配开发/生产

### 三、如何熟练正确地展示系统分析、设计过程

#### 3.1 需求分析阶段 → `docs/requirements_spec.md`

```
├─ 1. 项目背景（现状分析 + 可行性）
├─ 2. 项目目标（总体目标 + 具体目标 + 预期用户）
├─ 3. 系统架构（部署架构图 + 前端组件树 + 数据流图）
├─ 4. 用户角色（普通用户 + 管理员）
├─ 5. 功能需求（FR-001 至 FR-015，表格化规格条目）
├─ 6. 数据需求
└─ 7. 验收标准
```

**展示手法**：表格化规格 + 数据流图 + 组件树

#### 3.2 系统设计阶段 → `docs/System_Design_Document.md`

```
├─ 1. 系统体系架构（架构风格 + 部署架构图 + 软件分层图）
├─ 2. 系统功能结构（模块→子功能→功能点 三级层次图）
├─ 3. 系统用例时序图（4个核心用例交互流程）
├─ 4. 复杂功能算法设计（流程图 + 伪代码）
├─ 5. 面向对象类图（后端 + 前端类图）
├─ 6. 接口设计（RESTful + 统一响应 + 接口一览表）
└─ 7. 数据库设计（ER 图 + 表结构 + 索引）
```

**展示手法**：时序图展示三层交互、类图展示模块依赖、流程图+伪代码展示算法

#### 3.3 代码实现 → 文档与代码对照

| 设计文档描述 | 代码实现位置 |
| --- | --- |
| 差异化提醒算法 | `backend/services/ReminderService.cc` |
| 统计聚合算法 | `backend/services/StatsService.cc` |
| 打卡去重算法 | `backend/controllers/ClockController.cc` |
| 前端组件结构 | `frontend/src/App.tsx` + `pages/` |
| API 接口清单 | `frontend/src/services/api.ts` |
| 数据库表结构 | `docs/database_schema.sql` |

#### 3.4 展示过程要点总结

1. **自顶向下分解**：系统 → 模块 → 子功能 → 功能点，层次清晰
2. **多视图建模**：结构视图（类图）+ 行为视图（时序图/活动图）+ 部署视图
3. **图文并茂**：Mermaid 图 + UML + 伪代码 + 规格表格 多种表达方式结合
4. **前后对照**：文档接口定义与代码 API 一一对应
5. **关注例外**：每个功能点含异常处理（404/409/400），体现健壮性设计
