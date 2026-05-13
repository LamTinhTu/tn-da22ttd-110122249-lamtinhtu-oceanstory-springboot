-- Sync legacy/dev PostgreSQL schema to match current JPA entities.
-- This migration is idempotent and safe to run on existing databases.

DO $$
BEGIN
    -- ===== users =====
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='updated_at') THEN
            ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='last_login_at') THEN
            ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='is_locked') THEN
            ALTER TABLE users ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='lock_reason') THEN
            ALTER TABLE users ADD COLUMN lock_reason TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='is_active') THEN
            ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='deleted_at') THEN
            ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
        END IF;

        -- Password should be nullable (Google login + legacy datasets)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='users' AND column_name='password' AND is_nullable='NO'
        ) THEN
            ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        END IF;
    END IF;

    -- ===== stories =====
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stories') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='cover_image') THEN
            ALTER TABLE stories ADD COLUMN cover_image VARCHAR(1000);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='is_hidden') THEN
            ALTER TABLE stories ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='deleted_at') THEN
            ALTER TABLE stories ADD COLUMN deleted_at TIMESTAMP;
        END IF;

        -- Ensure created_at/updated_at exist (some legacy schemas miss them)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='created_at') THEN
            ALTER TABLE stories ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='updated_at') THEN
            ALTER TABLE stories ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
        END IF;
    END IF;

    -- ===== chapters =====
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='chapters') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chapters' AND column_name='deleted_at') THEN
            ALTER TABLE chapters ADD COLUMN deleted_at TIMESTAMP;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chapters' AND column_name='updated_at') THEN
            ALTER TABLE chapters ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chapters' AND column_name='created_at') THEN
            ALTER TABLE chapters ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();
        END IF;
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;
