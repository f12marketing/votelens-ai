-- VoteLens AI - PostgreSQL Schema
-- Production-grade database schema for election intelligence platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('guest', 'user', 'analyst', 'admin')),
    organization VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Elections Table
CREATE TABLE elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    year INTEGER NOT NULL,
    election_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    region VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Constituencies Table
CREATE TABLE constituencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    district VARCHAR(255),
    voter_count INTEGER NOT NULL DEFAULT 0,
    coordinates_lat DECIMAL(10, 8),
    coordinates_lng DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Election-Constituencies Junction Table (Many-to-Many)
CREATE TABLE election_constituencies (
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (election_id, constituency_id)
);

-- Candidates Table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(255),
    position VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(election_id, constituency_id, name)
);

-- Results Table (Historical Versioning)
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id),
    constituency_id UUID NOT NULL REFERENCES constituencies(id),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    votes INTEGER NOT NULL DEFAULT 0,
    vote_share DECIMAL(5, 2),
    turnout DECIMAL(5, 2),
    margin DECIMAL(5, 2),
    swing DECIMAL(5, 2),
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(255),
    version INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(election_id, constituency_id, candidate_id, version)
);

-- Datasets Table
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    election_id UUID REFERENCES elections(id) ON DELETE SET NULL,
    constituency_id UUID REFERENCES constituencies(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    row_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights Table
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('prediction', 'trend', 'anomaly', 'recommendation')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3, 2) CHECK (confidence BETWEEN 0 AND 1),
    source VARCHAR(255),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    constituency_id UUID REFERENCES constituencies(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
    parameters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('summary', 'detailed', 'custom')),
    format VARCHAR(50) NOT NULL CHECK (format IN ('pdf', 'csv', 'json')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('generating', 'ready', 'failed')),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    constituency_id UUID REFERENCES constituencies(id) ON DELETE CASCADE,
    parameters JSONB,
    storage_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_at TIMESTAMP WITH TIME ZONE
);

-- User Queries Table (Analytics Tracking)
CREATE TABLE user_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    query_type VARCHAR(50),
    election_id UUID REFERENCES elections(id) ON DELETE SET NULL,
    constituency_id UUID REFERENCES constituencies(id) ON DELETE SET NULL,
    response_summary TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users Indexes
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization ON users(organization);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Elections Indexes
CREATE INDEX idx_elections_status ON elections(status);
CREATE INDEX idx_elections_year ON elections(year);
CREATE INDEX idx_elections_date ON elections(election_date);
CREATE INDEX idx_elections_region ON elections(region);
CREATE INDEX idx_elections_status_year ON elections(status, year);

-- Constituencies Indexes
CREATE INDEX idx_constituencies_state ON constituencies(state);
CREATE INDEX idx_constituencies_district ON constituencies(district);
CREATE INDEX idx_constituencies_name ON constituencies(name);
CREATE INDEX idx_constituencies_coordinates ON constituencies(coordinates_lat, coordinates_lng);

-- Election-Constituencies Indexes
CREATE INDEX idx_election_constituencies_election ON election_constituencies(election_id);
CREATE INDEX idx_election_constituencies_constituency ON election_constituencies(constituency_id);

-- Candidates Indexes
CREATE INDEX idx_candidates_election ON candidates(election_id);
CREATE INDEX idx_candidates_constituency ON candidates(constituency_id);
CREATE INDEX idx_candidates_party ON candidates(party);

-- Results Indexes (Optimized for Analytics)
CREATE INDEX idx_results_election ON results(election_id);
CREATE INDEX idx_results_constituency ON results(constituency_id);
CREATE INDEX idx_results_candidate ON results(candidate_id);
CREATE INDEX idx_results_reported_at ON results(reported_at);
CREATE INDEX idx_results_election_constituency ON results(election_id, constituency_id);
CREATE INDEX idx_results_election_date ON results(election_id, reported_at);
CREATE INDEX idx_results_is_final ON results(is_final) WHERE is_final = TRUE;

-- Datasets Indexes
CREATE INDEX idx_datasets_user ON datasets(user_id);
CREATE INDEX idx_datasets_election ON datasets(election_id);
CREATE INDEX idx_datasets_constituency ON datasets(constituency_id);
CREATE INDEX idx_datasets_status ON datasets(status);
CREATE INDEX idx_datasets_uploaded_at ON datasets(uploaded_at);

-- AI Insights Indexes
CREATE INDEX idx_ai_insights_type ON ai_insights(type);
CREATE INDEX idx_ai_insights_election ON ai_insights(election_id);
CREATE INDEX idx_ai_insights_constituency ON ai_insights(constituency_id);
CREATE INDEX idx_ai_insights_dataset ON ai_insights(dataset_id);
CREATE INDEX idx_ai_insights_confidence ON ai_insights(confidence);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at);
CREATE INDEX idx_ai_insights_type_election ON ai_insights(type, election_id);

-- Reports Indexes
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_election ON reports(election_id);
CREATE INDEX idx_reports_constituency ON reports(constituency_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- User Queries Indexes
CREATE INDEX idx_user_queries_user ON user_queries(user_id);
CREATE INDEX idx_user_queries_election ON user_queries(election_id);
CREATE INDEX idx_user_queries_constituency ON user_queries(constituency_id);
CREATE INDEX idx_user_queries_created_at ON user_queries(created_at);
CREATE INDEX idx_user_queries_type ON user_queries(query_type);

-- JSONB Indexes for Flexible Metadata
CREATE INDEX idx_datasets_metadata ON datasets USING GIN (metadata);
CREATE INDEX idx_ai_insights_parameters ON ai_insights USING GIN (parameters);
CREATE INDEX idx_reports_parameters ON reports USING GIN (parameters);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elections_updated_at BEFORE UPDATE ON elections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constituencies_updated_at BEFORE UPDATE ON constituencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS
-- =====================================================

-- Election Summary Materialized View
CREATE MATERIALIZED VIEW mv_election_summary AS
SELECT 
    e.id as election_id,
    e.name as election_name,
    e.year,
    e.status,
    e.election_date,
    e.region,
    COUNT(DISTINCT ec.constituency_id) as constituency_count,
    COALESCE(SUM(c.voter_count), 0) as total_voters,
    COUNT(DISTINCT cand.id) as candidate_count,
    COUNT(DISTINCT r.id) as result_count
FROM elections e
LEFT JOIN election_constituencies ec ON e.id = ec.election_id
LEFT JOIN constituencies c ON ec.constituency_id = c.id
LEFT JOIN candidates cand ON e.id = cand.election_id
LEFT JOIN results r ON e.id = r.election_id AND r.is_final = TRUE
GROUP BY e.id, e.name, e.year, e.status, e.election_date, e.region;

CREATE INDEX idx_mv_election_summary ON mv_election_summary(election_id);

-- Constituency Performance View
CREATE MATERIALIZED VIEW mv_constituency_performance AS
SELECT 
    c.id as constituency_id,
    c.name as constituency_name,
    c.state,
    c.district,
    c.voter_count,
    e.id as election_id,
    e.name as election_name,
    e.year,
    cand.party,
    cand.name as candidate_name,
    r.votes,
    r.vote_share,
    r.turnout,
    r.margin,
    r.is_final,
    r.reported_at
FROM constituencies c
JOIN election_constituencies ec ON c.id = ec.constituency_id
JOIN elections e ON ec.election_id = e.id
JOIN candidates cand ON e.id = cand.election_id AND c.id = cand.constituency_id
LEFT JOIN results r ON cand.id = r.candidate_id AND r.is_final = TRUE;

CREATE INDEX idx_mv_constituency_performance_constituency ON mv_constituency_performance(constituency_id);
CREATE INDEX idx_mv_constituency_performance_election ON mv_constituency_performance(election_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'User accounts with Firebase authentication and role-based access control';
COMMENT ON TABLE elections IS 'Election events with year, date, status, and regional information';
COMMENT ON TABLE constituencies IS 'Geographic constituencies with voter counts and coordinates';
COMMENT ON TABLE candidates IS 'Candidates running in specific elections and constituencies';
COMMENT ON TABLE results IS 'Election results with historical versioning for tracking changes';
COMMENT ON TABLE datasets IS 'Uploaded election datasets for analysis';
COMMENT ON TABLE ai_insights IS 'AI-generated insights including predictions, trends, and anomalies';
COMMENT ON TABLE reports IS 'User-generated reports in various formats';
COMMENT ON TABLE user_queries IS 'Natural language query history for analytics';

COMMENT ON COLUMN results.version IS 'Version number for historical tracking of result changes';
COMMENT ON COLUMN results.is_final IS 'Indicates if result is final or provisional';
COMMENT ON COLUMN ai_insights.confidence IS 'AI confidence score between 0 and 1';
COMMENT ON COLUMN ai_insights.expires_at IS 'Optional expiration for time-sensitive insights';
