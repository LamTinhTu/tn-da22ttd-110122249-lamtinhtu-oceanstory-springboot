-- Baseline schema for Ocean Stories platform.
-- This migration is idempotent to support existing dev databases.

-- ===== users =====
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    auth_provider VARCHAR(50),
    role VARCHAR(50) NOT NULL,
    vip_expiry_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    lock_reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP
);

-- ===== stories =====
CREATE TABLE IF NOT EXISTS stories (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author_name VARCHAR(255),
    co_author VARCHAR(255),
    user_id BIGINT,
    type VARCHAR(100),
    description TEXT,
    content TEXT,
    genres TEXT,
    topics TEXT,
    category VARCHAR(255),
    cover_image VARCHAR(1000),
    submission_status VARCHAR(50),
    status VARCHAR(50),
    story_status VARCHAR(50),
    admin_notes TEXT,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_stories_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_submission_status ON stories(submission_status);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_updated_at ON stories(updated_at);

-- ===== chapters =====
CREATE TABLE IF NOT EXISTS chapters (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    chapter_number INT NOT NULL,
    image_url VARCHAR(1000),
    moderation_status VARCHAR(50),
    violation_note TEXT,
    views INT,
    report_count INT,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_chapters_story FOREIGN KEY (story_id) REFERENCES stories(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_chapters_story_number ON chapters(story_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_moderation_status ON chapters(moderation_status);

-- ===== lightweight update triggers (optional via application code) =====
-- Kept as columns only; updated in application layer.
