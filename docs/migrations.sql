-- 迁移脚本：为已有数据库补充任务类型相关字段（初始化脚本只在空库时执行）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'once' CHECK (type IN ('once', 'daily', 'periodic'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS interval_value INTEGER DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS interval_unit VARCHAR(10) DEFAULT 'day' CHECK (interval_unit IN ('day', 'week', 'month'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP;

-- 头像字段：本地上传后进入待审核(pending)状态，需管理员审核通过(approved)后对外展示
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_status VARCHAR(20) DEFAULT 'none' CHECK (avatar_status IN ('none', 'pending', 'approved', 'rejected'));
