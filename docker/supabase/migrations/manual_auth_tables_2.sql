-- Create missing Auth tables

CREATE TABLE IF NOT EXISTS auth.instances (
    id UUID NOT NULL PRIMARY KEY,
    uuid UUID,
    raw_base_config TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
    instance_id UUID,
    id UUID NOT NULL PRIMARY KEY,
    payload JSON,
    created_at TIMESTAMPTZ,
    ip_address VARCHAR(64) DEFAULT '',
    aud VARCHAR(255),
    path VARCHAR(255),
    raw_user_meta_data JSONB,
    event_message VARCHAR(255),
    level VARCHAR(64),
    timestamp TIMESTAMPTZ,
    component VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    instance_id UUID,
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255),
    user_id VARCHAR(255),
    revoked BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    parent VARCHAR(255),
    session_id UUID
);

CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    factor_id UUID,
    aal VARCHAR(50), -- enum in real schema
    not_after TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS auth.identities (
    id TEXT NOT NULL,
    user_id UUID NOT NULL,
    identity_data JSONB NOT NULL,
    provider TEXT NOT NULL,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    email TEXT,
    CONSTRAINT identities_pkey PRIMARY KEY (provider, id)
);

CREATE TABLE IF NOT EXISTS auth.schema_migrations (
    version VARCHAR(255) NOT NULL PRIMARY KEY
);

-- Grant access
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
