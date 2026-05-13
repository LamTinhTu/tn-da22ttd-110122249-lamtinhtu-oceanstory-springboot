DO $$
BEGIN
    -- Legacy DBs may have username/email stored as BYTEA (breaks lower()/like queries).
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'email'
          AND udt_name = 'bytea'
    ) THEN
        ALTER TABLE users
            ALTER COLUMN email TYPE TEXT
            USING convert_from(email, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'username'
          AND udt_name = 'bytea'
    ) THEN
        ALTER TABLE users
            ALTER COLUMN username TYPE TEXT
            USING convert_from(username, 'UTF8');
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;
