-- Migration 002: Add Indexes
-- VoteLens AI - PostgreSQL Database Migration
-- This migration adds indexes for performance optimization

BEGIN;

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

COMMIT;
