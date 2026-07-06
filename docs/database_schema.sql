CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id                    SERIAL PRIMARY KEY,
    user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                 VARCHAR(255) NOT NULL,
    description           TEXT DEFAULT '',
    topic                 VARCHAR(100) DEFAULT '',
    priority              INTEGER DEFAULT 1 CHECK (priority BETWEEN 0 AND 3),
    source                VARCHAR(20) DEFAULT 'custom' CHECK (source IN ('custom', 'system')),
    need_review_reminder  BOOLEAN DEFAULT FALSE,
    completed             BOOLEAN DEFAULT FALSE,
    deadline              TIMESTAMP,
    created_at            TIMESTAMP DEFAULT NOW(),
    completed_at          TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_topic ON tasks(topic);
CREATE INDEX idx_tasks_completed ON tasks(completed);

CREATE TABLE IF NOT EXISTS clock_records (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id         INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    task_title      VARCHAR(255) NOT NULL,
    check_in_time   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clock_user_date ON clock_records(user_id, check_in_time);
CREATE INDEX idx_clock_task_id ON clock_records(task_id);

INSERT INTO users (username, password) VALUES ('default', 'default')
ON CONFLICT (username) DO NOTHING;
