-- 测试种子数据（可重复执行）
-- 用法: docker cp seed_data.sql 容器:/tmp/ && docker exec 容器 psql -U planner -d study_planner -f /tmp/seed_data.sql

BEGIN;

TRUNCATE sessions RESTART IDENTITY CASCADE;
TRUNCATE clock_records RESTART IDENTITY CASCADE;
TRUNCATE tasks RESTART IDENTITY CASCADE;
TRUNCATE users RESTART IDENTITY CASCADE;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;

INSERT INTO users (id, username, password) VALUES
(1, 'alice', '123456'),
(2, 'bob', '123456');
ALTER SEQUENCE users_id_seq RESTART WITH 3;

INSERT INTO tasks (id, user_id, title, description, topic, priority, source, completed, completed_at, need_review_reminder, deadline, created_at) VALUES
(1,  1, '复习高等数学第三章',       '微积分中值定理与导数应用，重点看泰勒公式',                                '数学',   1, 'custom', false, NULL, true,  NOW() + INTERVAL '2 days',  NOW() - INTERVAL '3 days'),
(2,  1, '完成英语六级真题一套',      '2024年6月真题，重点练习听力和阅读',                                      '英语',   2, 'custom', false, NULL, true,  NOW() + INTERVAL '5 days',  NOW() - INTERVAL '2 days'),
(3,  1, '数据结构与算法作业',        '二叉树遍历、图的DFS/BFS、动态规划基础题',                                 '计算机', 1, 'custom', true,  NOW() - INTERVAL '1 day',  false, NULL, NOW() - INTERVAL '5 days'),
(4,  1, '阅读《深入理解计算机系统》第6章', '存储层次结构，理解cache工作原理',                                   '计算机', 3, 'custom', false, NULL, false, NOW() + INTERVAL '7 days',  NOW() - INTERVAL '1 day'),
(5,  1, '整理线性代数笔记',          '矩阵变换、特征值与特征向量复习笔记',                                     '数学',   2, 'custom', true,  NOW() - INTERVAL '2 days', false, NULL, NOW() - INTERVAL '6 days'),
(6,  1, '政治理论课程论文',          '马克思主义基本原理概论，3000字',                                         '政治',   2, 'custom', false, NULL, true,  NOW() + INTERVAL '10 days', NOW() - INTERVAL '4 days'),
(7,  1, '英语口语练习',              '每天早上朗读30分钟，练习发音与流利度',                                   '英语',   3, 'custom', false, NULL, false, NULL, NOW() - INTERVAL '7 days'),
(8,  1, '操作系统实验报告',          '进程调度算法模拟实现，提交代码+报告',                                    '计算机', 1, 'custom', false, NULL, true,  NOW() + INTERVAL '3 days',  NOW() - INTERVAL '2 days'),
(9,  1, '概率论与数理统计习题',      '第4-6章课后习题，重点：随机变量分布',                                    '数学',   2, 'custom', true,  NOW() - INTERVAL '3 days', false, NULL, NOW() - INTERVAL '8 days'),
(10, 1, '考研英语单词打卡',          '每天背诵50个高频词汇，使用艾宾浩斯记忆曲线',                             '英语',   1, 'custom', false, NULL, false, NULL, NOW() - INTERVAL '10 days'),
(11, 1, 'Python机器学习项目',        '使用scikit-learn实现房价预测模型',                                       '计算机', 2, 'custom', false, NULL, false, NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 day'),
(12, 1, '数据库系统概念复习',        '第7章 数据库设计和E-R模型',                                             '计算机', 3, 'custom', false, NULL, false, NOW() + INTERVAL '6 days',  NOW() - INTERVAL '3 days'),
(13, 1, '体育锻炼计划',              '每周跑步3次，每次5公里，配合力量训练',                                  '体育',   2, 'custom', false, NULL, false, NULL, NOW() - INTERVAL '5 days'),
(14, 1, '阅读《人类简史》并做笔记',  '读完前三部分，整理读书笔记和思维导图',                                  '阅读',   3, 'custom', true,  NOW() - INTERVAL '4 days', false, NULL, NOW() - INTERVAL '12 days'),
(15, 1, '计算机网络复习',            'TCP/IP协议栈、HTTP/HTTPS、DNS解析流程',                                  '计算机', 1, 'custom', false, NULL, true,  NOW() + INTERVAL '4 days',  NOW() - INTERVAL '2 days'),
(16, 1, '系统提示：每日复习任务',    '系统自动生成的每日复习提醒',                                            '通用',   1, 'system', false, NULL, false, NULL, NOW()),
(17, 1, '系统提示：本周学习目标',    '完成数学第三章+计算机系统第6章',                                        '通用',   2, 'system', false, NULL, false, NULL, NOW());

ALTER SEQUENCE tasks_id_seq RESTART WITH 18;

INSERT INTO clock_records (user_id, task_id, task_title, check_in_time) VALUES
(1, 3,  '数据结构与算法作业',    CURRENT_DATE - INTERVAL '1 day'  + INTERVAL '10 hours'),
(1, 3,  '数据结构与算法作业',    CURRENT_DATE - INTERVAL '3 days' + INTERVAL '14 hours'),
(1, 1,  '复习高等数学第三章',    CURRENT_DATE - INTERVAL '2 days' + INTERVAL '9 hours'),
(1, 2,  '完成英语六级真题一套',   CURRENT_DATE - INTERVAL '2 days' + INTERVAL '15 hours'),
(1, 4,  '阅读《深入理解计算机系统》第6章', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '10 hours'),
(1, 8,  '操作系统实验报告',      CURRENT_DATE - INTERVAL '3 days' + INTERVAL '16 hours'),
(1, 5,  '整理线性代数笔记',      CURRENT_DATE - INTERVAL '4 days' + INTERVAL '11 hours'),
(1, 7,  '英语口语练习',          CURRENT_DATE - INTERVAL '4 days' + INTERVAL '8 hours'),
(1, 9,  '概率论与数理统计习题',  CURRENT_DATE - INTERVAL '5 days' + INTERVAL '10 hours'),
(1, 11, 'Python机器学习项目',    CURRENT_DATE - INTERVAL '5 days' + INTERVAL '15 hours'),
(1, 14, '阅读《人类简史》并做笔记', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '9 hours'),
(1, 6,  '政治理论课程论文',      CURRENT_DATE - INTERVAL '6 days' + INTERVAL '14 hours'),
(1, 1,  '复习高等数学第三章',    CURRENT_DATE - INTERVAL '7 days' + INTERVAL '11 hours'),
(1, 13, '体育锻炼计划',          CURRENT_DATE - INTERVAL '7 days' + INTERVAL '16 hours'),
(1, 3,  '数据结构与算法作业',    CURRENT_DATE - INTERVAL '8 days' + INTERVAL '9 hours');

COMMIT;
