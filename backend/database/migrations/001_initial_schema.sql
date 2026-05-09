-- Migration 001: Initial Schema
-- VoteLens AI - PostgreSQL Database Migration
-- This migration creates the initial database schema

BEGIN;

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

-- Election-Constituencies Junction Table
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

-- Results Table
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

-- User Queries Table
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

COMMIT;
