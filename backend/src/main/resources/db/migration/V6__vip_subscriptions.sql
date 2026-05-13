-- VIP subscription records.
-- Idempotent to support existing dev databases.

CREATE TABLE IF NOT EXISTS vip_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_vip_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_user ON vip_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_status ON vip_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_end_date ON vip_subscriptions(end_date);
