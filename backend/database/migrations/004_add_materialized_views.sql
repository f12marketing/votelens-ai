-- Migration 004: Add Materialized Views
-- VoteLens AI - PostgreSQL Database Migration
-- This migration adds materialized views for analytics optimization

BEGIN;

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

-- Constituency Performance Materialized View
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

COMMIT;
