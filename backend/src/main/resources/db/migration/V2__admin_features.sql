-- Admin features: comments, reports, notifications, audit logs, vip, reading history, bookmarks, moderation actions.
-- Designed to be idempotent for dev environments.

-- ===== comments =====
CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    story_id BIGINT,
    chapter_id BIGINT,
    content TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    lock_reason TEXT,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_comments_story FOREIGN KEY (story_id) REFERENCES stories(id),
    CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
CREATE INDEX IF NOT EXISTS idx_comments_story_id ON comments(story_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- ===== reports =====
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- STORY | CHAPTER | COMMENT
    target_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING | RESOLVED | REJECTED
    handled_by BIGINT,
    handled_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    handled_at TIMESTAMP,
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT fk_reports_handler FOREIGN KEY (handled_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

-- ===== notifications =====
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- STORY_APPROVED | STORY_REJECTED | CHAPTER_APPROVED | WARNING | VIP_RENEWED
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    meta JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ===== audit logs =====
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT,
    actor_username VARCHAR(255),
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    detail JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON audit_logs(actor_id);

-- ===== moderation actions/history =====
CREATE TABLE IF NOT EXISTS moderation_actions (
    id BIGSERIAL PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL, -- STORY | CHAPTER | COMMENT | REPORT
    target_id BIGINT NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- SUBMIT | APPROVE | REJECT | HIDE | UNHIDE | DELETE | RESTORE
    reason TEXT,
    moderator_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_moderation_moderator FOREIGN KEY (moderator_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_moderation_target ON moderation_actions(target_type, target_id);

-- ===== VIP packages =====
CREATE TABLE IF NOT EXISTS vip_packages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration_days INT NOT NULL,
    price BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===== subscriptions =====
CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    package_id BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | CANCELED | EXPIRED
    start_at TIMESTAMP NOT NULL DEFAULT NOW(),
    end_at TIMESTAMP NOT NULL,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_sub_package FOREIGN KEY (package_id) REFERENCES vip_packages(id)
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ===== payments =====
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    subscription_id BIGINT,
    amount BIGINT NOT NULL,
    method VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    status VARCHAR(50) NOT NULL DEFAULT 'PAID',
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pay_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_pay_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- ===== reading history (traffic proxy) =====
CREATE TABLE IF NOT EXISTS reading_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    story_id BIGINT,
    chapter_id BIGINT,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_read_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_read_story FOREIGN KEY (story_id) REFERENCES stories(id),
    CONSTRAINT fk_read_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
CREATE INDEX IF NOT EXISTS idx_reading_created_at ON reading_history(created_at);
CREATE INDEX IF NOT EXISTS idx_reading_story ON reading_history(story_id);

-- ===== bookmarks =====
CREATE TABLE IF NOT EXISTS bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    story_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_bookmark_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_bookmark_story FOREIGN KEY (story_id) REFERENCES stories(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookmark_user_story ON bookmarks(user_id, story_id);

-- ===== safety: ensure existing tables have new columns =====
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
      ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_locked') THEN
      ALTER TABLE users ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
      ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_at') THEN
      ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='is_hidden') THEN
      ALTER TABLE stories ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='deleted_at') THEN
      ALTER TABLE stories ADD COLUMN deleted_at TIMESTAMP;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chapters') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chapters' AND column_name='deleted_at') THEN
      ALTER TABLE chapters ADD COLUMN deleted_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chapters' AND column_name='updated_at') THEN
      ALTER TABLE chapters ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;
  END IF;
END $$;
