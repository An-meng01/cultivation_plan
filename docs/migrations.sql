-- 迁移脚本：为已有数据库补充任务类型相关字段（初始化脚本只在空库时执行）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'once' CHECK (type IN ('once', 'daily', 'periodic'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS interval_value INTEGER DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS interval_unit VARCHAR(10) DEFAULT 'day' CHECK (interval_unit IN ('day', 'week', 'month'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP;

-- 头像字段：本地上传后进入待审核(pending)状态，需管理员审核通过(approved)后对外展示
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_status VARCHAR(20) DEFAULT 'none' CHECK (avatar_status IN ('none', 'pending', 'approved', 'rejected'));

-- 提醒设置：开启"设置提醒"后，可在任务截止前 N 天提醒
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS remind_before_days INTEGER;

-- 账号联系方式：电子邮箱与电话号码（展示时对中间部分脱敏）
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- 角色与登录设备：用于区分管理员/普通用户，以及提醒渠道选择（PC 走邮件、移动走短信）
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_device VARCHAR(10) DEFAULT 'pc' CHECK (last_device IN ('pc', 'mobile'));

-- 提醒发送记录
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP;

CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id    INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    channel    VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms')),
    recipient  VARCHAR(255) NOT NULL,
    content    TEXT,
    status     VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- 任务审核：普通用户当日新增任务超过 30 个时，超出部分进入待审核(pending)状态，需管理员审核
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'none'
    CHECK (review_status IN ('none', 'pending', 'approved', 'rejected'));

-- 审核结果通知：管理员审核（头像/任务）后，被审核的普通用户下次登录时弹出结果
CREATE TABLE IF NOT EXISTS review_notices (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       VARCHAR(20) NOT NULL CHECK (kind IN ('avatar', 'task')),
    ref_id     INTEGER,
    title      VARCHAR(255) NOT NULL DEFAULT '',
    action     VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected')),
    seen       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_review_notices_user ON review_notices(user_id);
CREATE INDEX IF NOT EXISTS idx_review_notices_unseen ON review_notices(user_id, seen);
