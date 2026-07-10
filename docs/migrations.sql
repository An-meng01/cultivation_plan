-- 迁移脚本：为已有数据库补充任务类型相关字段（初始化脚本只在空库时执行）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'once' CHECK (type IN ('once', 'daily', 'periodic'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS interval_value INTEGER DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS interval_unit VARCHAR(10) DEFAULT 'day' CHECK (interval_unit IN ('day', 'week', 'month'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP;
