-- Migration: Create dashboard page visit tracking tables
-- Date: 2026-03-04
-- Description: Tracks page hit counts for /profile/* and /dashboard/* public URLs

CREATE TABLE IF NOT EXISTS dashboard_page_visit_totals (
    domain VARCHAR(255) NOT NULL,
    section VARCHAR(20) NOT NULL,
    total_hits BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT dashboard_page_visit_totals_pk PRIMARY KEY (domain, section),
    CONSTRAINT dashboard_page_visit_totals_section_check CHECK (section IN ('profile', 'dashboard'))
);

CREATE TABLE IF NOT EXISTS dashboard_page_visit_urls (
    domain VARCHAR(255) NOT NULL,
    pathname TEXT NOT NULL,
    section VARCHAR(20) NOT NULL,
    hit_count BIGINT NOT NULL DEFAULT 0,
    last_url TEXT,
    last_visitor_id VARCHAR(255),
    last_ip_address VARCHAR(45),
    last_user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT dashboard_page_visit_urls_pk PRIMARY KEY (domain, pathname),
    CONSTRAINT dashboard_page_visit_urls_section_check CHECK (section IN ('profile', 'dashboard'))
);

CREATE INDEX IF NOT EXISTS idx_dashboard_page_visit_urls_domain_hit_count
    ON dashboard_page_visit_urls (domain, hit_count DESC);

CREATE INDEX IF NOT EXISTS idx_dashboard_page_visit_urls_domain_section
    ON dashboard_page_visit_urls (domain, section);

COMMENT ON TABLE dashboard_page_visit_totals IS 'Aggregated hit counts for public dashboard page sections';
COMMENT ON TABLE dashboard_page_visit_urls IS 'Per-path hit counts for public dashboard URLs';
COMMENT ON COLUMN dashboard_page_visit_totals.section IS 'profile or dashboard';
COMMENT ON COLUMN dashboard_page_visit_urls.section IS 'profile or dashboard';
