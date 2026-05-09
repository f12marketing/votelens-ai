-- =====================================================
-- VoteLens AI - Optimized Analytics SQL Queries
-- =====================================================
-- These queries are optimized for performance using proper indexes,
-- materialized views, and efficient joins.

-- =====================================================
-- TURNOUT ANALYSIS QUERIES
-- =====================================================

-- Overall turnout for an election
-- Uses materialized view for performance
SELECT 
    e.id AS election_id,
    e.name AS election_name,
    e.year,
    COUNT(DISTINCT c.id) AS total_constituencies,
    SUM(c.voter_count) AS total_voters,
    SUM(r.votes) AS total_votes_cast,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2) AS overall_turnout_percentage
FROM elections e
JOIN constituencies c ON c.election_id = e.id
LEFT JOIN results r ON r.constituency_id = c.id
WHERE e.id = $1
GROUP BY e.id, e.name, e.year;

-- Turnout by constituency with ranking
WITH constituency_turnout AS (
    SELECT 
        c.id AS constituency_id,
        c.name AS constituency_name,
        c.state,
        c.district,
        c.voter_count,
        SUM(r.votes) AS votes_cast,
        ROUND((SUM(r.votes)::NUMERIC / NULLIF(c.voter_count, 0)) * 100, 2) AS turnout_percentage
    FROM constituencies c
    LEFT JOIN results r ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY c.id, c.name, c.state, c.district, c.voter_count
)
SELECT 
    ct.*,
    RANK() OVER (ORDER BY ct.turnout_percentage DESC) AS turnout_rank
FROM constituency_turnout ct
ORDER BY ct.turnout_percentage DESC;

-- High turnout constituencies (above average)
WITH avg_turnout AS (
    SELECT 
        ROUND(AVG((SUM(r.votes)::NUMERIC / NULLIF(c.voter_count, 0)) * 100), 2) AS avg_percentage
    FROM constituencies c
    LEFT JOIN results r ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY c.election_id
),
constituency_turnout AS (
    SELECT 
        c.id AS constituency_id,
        c.name AS constituency_name,
        c.state,
        SUM(r.votes) AS votes_cast,
        c.voter_count,
        ROUND((SUM(r.votes)::NUMERIC / NULLIF(c.voter_count, 0)) * 100, 2) AS turnout_percentage
    FROM constituencies c
    LEFT JOIN results r ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY c.id, c.name, c.state, c.voter_count
)
SELECT 
    ct.constituency_id,
    ct.constituency_name,
    ct.state,
    ct.votes_cast,
    ct.voter_count,
    ct.turnout_percentage
FROM constituency_turnout ct, avg_turnout at
WHERE ct.turnout_percentage > at.avg_percentage
ORDER BY ct.turnout_percentage DESC
LIMIT 20;

-- Low turnout constituencies (below average)
WITH avg_turnout AS (
    SELECT 
        ROUND(AVG((SUM(r.votes)::NUMERIC / NULLIF(c.voter_count, 0)) * 100), 2) AS avg_percentage
    FROM constituencies c
    LEFT JOIN results r ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY c.election_id
),
constituency_turnout AS (
    SELECT 
        c.id AS constituency_id,
        c.name AS constituency_name,
        c.state,
        SUM(r.votes) AS votes_cast,
        c.voter_count,
        ROUND((SUM(r.votes)::NUMERIC / NULLIF(c.voter_count, 0)) * 100, 2) AS turnout_percentage
    FROM constituencies c
    LEFT JOIN results r ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY c.id, c.name, c.state, c.voter_count
)
SELECT 
    ct.constituency_id,
    ct.constituency_name,
    ct.state,
    ct.votes_cast,
    ct.voter_count,
    ct.turnout_percentage
FROM constituency_turnout ct, avg_turnout at
WHERE ct.turnout_percentage < at.avg_percentage
ORDER BY ct.turnout_percentage ASC
LIMIT 20;

-- Turnout by region/state
SELECT 
    c.state AS region,
    COUNT(DISTINCT c.id) AS total_constituencies,
    SUM(c.voter_count) AS total_voters,
    SUM(r.votes) AS total_votes_cast,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2) AS turnout_percentage
FROM constituencies c
LEFT JOIN results r ON r.constituency_id = c.id
WHERE c.election_id = $1
GROUP BY c.state
ORDER BY turnout_percentage DESC;

-- Historical turnout trend
SELECT 
    e.year,
    e.name AS election_name,
    SUM(c.voter_count) AS total_voters,
    SUM(r.votes) AS total_votes_cast,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2) AS turnout_percentage
FROM elections e
JOIN constituencies c ON c.election_id = e.id
LEFT JOIN results r ON r.constituency_id = c.id
WHERE e.region = $1
GROUP BY e.year, e.name
ORDER BY e.year;

-- =====================================================
-- VOTE SHARE ANALYSIS QUERIES
-- =====================================================

-- Overall vote share by party
WITH total_votes AS (
    SELECT SUM(r.votes) AS total
    FROM results r
    JOIN constituencies c ON r.constituency_id = c.id
    WHERE c.election_id = $1
)
SELECT 
    p.name AS party,
    p.abbreviation AS party_abbreviation,
    SUM(r.votes) AS total_votes,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) AS vote_share_percentage,
    COUNT(DISTINCT CASE WHEN r.rank = 1 THEN r.constituency_id END) AS seats_won
FROM results r
JOIN candidates cand ON r.candidate_id = cand.id
JOIN parties p ON cand.party_id = p.id
JOIN constituencies c ON r.constituency_id = c.id
CROSS JOIN total_votes tv
WHERE c.election_id = $1
GROUP BY p.name, p.abbreviation, tv.total
ORDER BY total_votes DESC;

-- Vote share by constituency
SELECT 
    c.id AS constituency_id,
    c.name AS constituency_name,
    c.state,
    p.name AS party,
    p.abbreviation AS party_abbreviation,
    r.votes,
    ROUND((r.votes::NUMERIC / NULLIF(cv.total_votes, 0)) * 100, 2) AS vote_share_percentage,
    r.rank
FROM results r
JOIN candidates cand ON r.candidate_id = cand.id
JOIN parties p ON cand.party_id = p.id
JOIN constituencies c ON r.constituency_id = c.id
JOIN (
    SELECT 
        constituency_id,
        SUM(votes) AS total_votes
    FROM results
    WHERE constituency_id IN (
        SELECT id FROM constituencies WHERE election_id = $1
    )
    GROUP BY constituency_id
) cv ON r.constituency_id = cv.constituency_id
WHERE c.election_id = $1
ORDER BY c.name, r.rank;

-- Vote share by region
SELECT 
    c.state AS region,
    p.name AS party,
    p.abbreviation AS party_abbreviation,
    SUM(r.votes) AS total_votes,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(rv.total_votes, 0)) * 100, 2) AS vote_share_percentage
FROM results r
JOIN candidates cand ON r.candidate_id = cand.id
JOIN parties p ON cand.party_id = p.id
JOIN constituencies c ON r.constituency_id = c.id
JOIN (
    SELECT 
        c.state,
        SUM(r.votes) AS total_votes
    FROM results r
    JOIN constituencies c ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY c.state
) rv ON c.state = rv.state
WHERE c.election_id = $1
GROUP BY c.state, p.name, p.abbreviation, rv.total_votes
ORDER BY c.state, total_votes DESC;

-- Historical vote share trend by party
SELECT 
    e.year,
    p.name AS party,
    SUM(r.votes) AS total_votes,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) AS vote_share_percentage,
    COUNT(DISTINCT CASE WHEN r.rank = 1 THEN r.constituency_id END) AS seats_won
FROM elections e
JOIN constituencies c ON c.election_id = e.id
JOIN results r ON r.constituency_id = c.id
JOIN candidates cand ON r.candidate_id = cand.id
JOIN parties p ON cand.party_id = p.id
CROSS JOIN (
    SELECT SUM(r.votes) AS total
    FROM results r
    JOIN constituencies c ON r.constituency_id = c.id
    WHERE c.election_id = $1
) tv
WHERE e.region = $1
GROUP BY e.year, p.name, tv.total
ORDER BY e.year, total_votes DESC;

-- =====================================================
-- SEAT DISTRIBUTION QUERIES
-- =====================================================

-- Seat distribution by party
WITH total_seats AS (
    SELECT COUNT(DISTINCT c.id) AS total
    FROM constituencies c
    WHERE c.election_id = $1
),
party_seats AS (
    SELECT 
        p.name AS party,
        p.abbreviation AS party_abbreviation,
        COUNT(DISTINCT CASE WHEN r.rank = 1 THEN r.constituency_id END) AS seats_won,
        SUM(r.votes) AS total_votes
    FROM results r
    JOIN candidates cand ON r.candidate_id = cand.id
    JOIN parties p ON cand.party_id = p.id
    JOIN constituencies c ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY p.name, p.abbreviation
)
SELECT 
    ps.party,
    ps.party_abbreviation,
    ps.seats_won,
    ROUND((ps.seats_won::NUMERIC / NULLIF(ts.total, 0)) * 100, 2) AS seat_percentage,
    ROUND((ps.total_votes::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) AS vote_share,
    ts.total AS total_seats,
    CEIL(ts.total * 0.5) AS majority_threshold
FROM party_seats ps
CROSS JOIN total_seats ts
CROSS JOIN (
    SELECT SUM(r.votes) AS total
    FROM results r
    JOIN constituencies c ON r.constituency_id = c.id
    WHERE c.election_id = $1
) tv
ORDER BY ps.seats_won DESC;

-- Seat distribution by region
SELECT 
    c.state AS region,
    COUNT(DISTINCT c.id) AS total_seats,
    p.name AS party,
    COUNT(DISTINCT CASE WHEN r.rank = 1 THEN r.constituency_id END) AS seats_won
FROM constituencies c
LEFT JOIN results r ON r.constituency_id = c.id
LEFT JOIN candidates cand ON r.candidate_id = cand.id
LEFT JOIN parties p ON cand.party_id = p.id
WHERE c.election_id = $1
GROUP BY c.state, p.name
ORDER BY c.state, seats_won DESC;

-- Leading party and majority status
WITH party_seats AS (
    SELECT 
        p.name AS party,
        COUNT(DISTINCT CASE WHEN r.rank = 1 THEN r.constituency_id END) AS seats_won
    FROM results r
    JOIN candidates cand ON r.candidate_id = cand.id
    JOIN parties p ON cand.party_id = p.id
    JOIN constituencies c ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY p.name
),
total_seats AS (
    SELECT COUNT(DISTINCT c.id) AS total
    FROM constituencies c
    WHERE c.election_id = $1
)
SELECT 
    ps.party,
    ps.seats_won,
    ts.total AS total_seats,
    ROUND((ps.seats_won::NUMERIC / NULLIF(ts.total, 0)) * 100, 2) AS percentage,
    CEIL(ts.total * 0.5) AS majority_threshold,
    CASE 
        WHEN ps.seats_won >= CEIL(ts.total * 0.5) THEN 'Majority'
        WHEN ps.seats_won >= CEIL(ts.total * 0.4) THEN 'Close to Majority'
        ELSE 'No Majority'
    END AS majority_status
FROM party_seats ps
CROSS JOIN total_seats ts
ORDER BY ps.seats_won DESC
LIMIT 1;

-- =====================================================
-- CONSTITUENCY RANKING QUERIES
-- =====================================================

-- Constituency ranking by turnout
WITH constituency_turnout AS (
    SELECT 
        c.id AS constituency_id,
        c.name AS constituency_name,
        c.state,
        c.voter_count,
        SUM(r.votes) AS votes_cast,
        ROUND((SUM(r.votes)::NUMERIC / NULLIF(c.voter_count, 0)) * 100, 2) AS turnout_percentage,
        cand.name AS winner_name,
        p.name AS winner_party,
        r.votes AS winner_votes
    FROM constituencies c
    LEFT JOIN results r ON r.constituency_id = c.id AND r.rank = 1
    LEFT JOIN candidates cand ON r.candidate_id = cand.id
    LEFT JOIN parties p ON cand.party_id = p.id
    WHERE c.election_id = $1
    GROUP BY c.id, c.name, c.state, c.voter_count, cand.name, p.name, r.votes
)
SELECT 
    ct.*,
    RANK() OVER (ORDER BY ct.turnout_percentage DESC) AS turnout_rank
FROM constituency_turnout ct
ORDER BY ct.turnout_percentage DESC;

-- Constituency ranking by margin
WITH constituency_margin AS (
    SELECT 
        c.id AS constituency_id,
        c.name AS constituency_name,
        c.state,
        cand.name AS winner_name,
        p.name AS winner_party,
        r.votes AS winner_votes,
        r.vote_share AS winner_vote_share,
        r.margin,
        ROUND((r.margin::NUMERIC / NULLIF(SUM(r2.votes) OVER (PARTITION BY c.id), 0)) * 100, 2) AS margin_percentage,
        100 - ROUND((r.margin::NUMERIC / NULLIF(SUM(r2.votes) OVER (PARTITION BY c.id), 0)) * 100, 2) AS competitive_index
    FROM constituencies c
    JOIN results r ON r.constituency_id = c.id AND r.rank = 1
    JOIN candidates cand ON r.candidate_id = cand.id
    JOIN parties p ON cand.party_id = p.id
    LEFT JOIN results r2 ON r.constituency_id = r2.constituency_id
    WHERE c.election_id = $1
)
SELECT 
    cm.*,
    RANK() OVER (ORDER BY cm.margin_percentage ASC) AS margin_rank
FROM constituency_margin cm
ORDER BY cm.margin_percentage ASC;

-- Constituency ranking by competitive index
WITH constituency_competitive AS (
    SELECT 
        c.id AS constituency_id,
        c.name AS constituency_name,
        c.state,
        cand.name AS winner_name,
        p.name AS winner_party,
        r.votes AS winner_votes,
        r.vote_share AS winner_vote_share,
        r.margin,
        ROUND((r.margin::NUMERIC / NULLIF(SUM(r2.votes) OVER (PARTITION BY c.id), 0)) * 100, 2) AS margin_percentage,
        100 - ROUND((r.margin::NUMERIC / NULLIF(SUM(r2.votes) OVER (PARTITION BY c.id), 0)) * 100, 2) AS competitive_index,
        COUNT(r2.id) OVER (PARTITION BY c.id) AS total_candidates
    FROM constituencies c
    JOIN results r ON r.constituency_id = c.id AND r.rank = 1
    JOIN candidates cand ON r.candidate_id = cand.id
    JOIN parties p ON cand.party_id = p.id
    LEFT JOIN results r2 ON r.constituency_id = r2.constituency_id
    WHERE c.election_id = $1
)
SELECT 
    cc.*,
    RANK() OVER (ORDER BY cc.competitive_index DESC) AS competitive_rank
FROM constituency_competitive cc
ORDER BY cc.competitive_index DESC;

-- =====================================================
-- SWING ANALYSIS QUERIES
-- =====================================================

-- Overall swing by party (comparing two elections)
WITH current_election AS (
    SELECT 
        p.name AS party,
        SUM(r.votes) AS total_votes,
        ROUND((SUM(r.votes)::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) AS vote_share
    FROM results r
    JOIN candidates cand ON r.candidate_id = cand.id
    JOIN parties p ON cand.party_id = p.id
    JOIN constituencies c ON r.constituency_id = c.id
    CROSS JOIN (SELECT SUM(votes) AS total FROM results r JOIN constituencies c ON r.constituency_id = c.id WHERE c.election_id = $1) tv
    WHERE c.election_id = $1
    GROUP BY p.name, tv.total
),
previous_election AS (
    SELECT 
        p.name AS party,
        SUM(r.votes) AS total_votes,
        ROUND((SUM(r.votes)::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) AS vote_share
    FROM results r
    JOIN candidates cand ON r.candidate_id = cand.id
    JOIN parties p ON cand.party_id = p.id
    JOIN constituencies c ON r.constituency_id = c.id
    CROSS JOIN (SELECT SUM(votes) AS total FROM results r JOIN constituencies c ON r.constituency_id = c.id WHERE c.election_id = $2) tv
    WHERE c.election_id = $2
    GROUP BY p.name, tv.total
)
SELECT 
    COALESCE(ce.party, pe.party) AS party,
    ce.vote_share AS current_vote_share,
    pe.vote_share AS previous_vote_share,
    ROUND(ce.vote_share - pe.vote_share, 2) AS swing
FROM current_election ce
FULL OUTER JOIN previous_election pe ON ce.party = pe.party
ORDER BY ABS(swing) DESC;

-- Swing by constituency
WITH current_results AS (
    SELECT 
        c.id AS constituency_id,
        c.name AS constituency_name,
        p.name AS party,
        r.vote_share
    FROM results r
    JOIN candidates cand ON r.candidate_id = cand.id
    JOIN parties p ON cand.party_id = p.id
    JOIN constituencies c ON r.constituency_id = c.id
    WHERE c.election_id = $1
),
previous_results AS (
    SELECT 
        c.name AS constituency_name,
        p.name AS party,
        r.vote_share
    FROM results r
    JOIN candidates cand ON r.candidate_id = cand.id
    JOIN parties p ON cand.party_id = p.id
    JOIN constituencies c ON r.constituency_id = c.id
    WHERE c.election_id = $2
)
SELECT 
    cr.constituency_id,
    cr.constituency_name,
    COALESCE(cr.party, pr.party) AS party,
    cr.vote_share AS current_vote_share,
    pr.vote_share AS previous_vote_share,
    ROUND(cr.vote_share - pr.vote_share, 2) AS swing
FROM current_results cr
FULL OUTER JOIN previous_results pr ON cr.constituency_name = pr.constituency_name AND cr.party = pr.party
ORDER BY ABS(swing) DESC;

-- Significant swings (swing > 5%)
WITH swing_data AS (
    SELECT 
        COALESCE(ce.party, pe.party) AS party,
        ROUND(ce.vote_share - pe.vote_share, 2) AS swing
    FROM current_election ce
    FULL OUTER JOIN previous_election pe ON ce.party = pe.party
)
SELECT 
    party,
    swing,
    (SELECT COUNT(DISTINCT constituency_id) FROM swing_by_constituency WHERE party = s.party AND ABS(swing) > 5) AS constituencies_affected
FROM swing_data s
WHERE ABS(swing) > 5
ORDER BY ABS(swing) DESC;

-- =====================================================
-- HISTORICAL COMPARISON QUERIES
-- =====================================================

-- Election overview across years
SELECT 
    e.id AS election_id,
    e.year,
    e.name AS election_name,
    e.election_date,
    e.status,
    COUNT(DISTINCT c.id) AS total_constituencies,
    SUM(c.voter_count) AS total_voters,
    SUM(r.votes) AS total_votes_cast,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2) AS turnout_percentage,
    (SELECT p.name FROM results r JOIN candidates cand ON r.candidate_id = cand.id JOIN parties p ON cand.party_id = p.id JOIN constituencies c ON r.constituency_id = c.id WHERE c.election_id = e.id AND r.rank = 1 GROUP BY p.name ORDER BY COUNT(*) DESC LIMIT 1) AS leading_party
FROM elections e
JOIN constituencies c ON c.election_id = e.id
LEFT JOIN results r ON r.constituency_id = c.id
WHERE e.region = $1
GROUP BY e.id, e.year, e.name, e.election_date, e.status
ORDER BY e.year DESC;

-- Turnout comparison across years
SELECT 
    e.year,
    e.name AS election_name,
    SUM(c.voter_count) AS total_voters,
    SUM(r.votes) AS total_votes_cast,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2) AS turnout_percentage,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2) - 
    LAG(ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2)) OVER (ORDER BY e.year) AS turnout_change
FROM elections e
JOIN constituencies c ON c.election_id = e.id
LEFT JOIN results r ON r.constituency_id = c.id
WHERE e.region = $1
GROUP BY e.year, e.name
ORDER BY e.year;

-- Party performance comparison across years
SELECT 
    p.name AS party,
    e.year,
    SUM(r.votes) AS total_votes,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) AS vote_share,
    COUNT(DISTINCT CASE WHEN r.rank = 1 THEN r.constituency_id END) AS seats_won
FROM elections e
JOIN constituencies c ON c.election_id = e.id
LEFT JOIN results r ON r.constituency_id = c.id
LEFT JOIN candidates cand ON r.candidate_id = cand.id
LEFT JOIN parties p ON cand.party_id = p.id
CROSS JOIN (SELECT SUM(r.votes) AS total FROM results r JOIN constituencies c ON r.constituency_id = c.id WHERE c.election_id = $1) tv
WHERE e.region = $1
GROUP BY p.name, e.year, tv.total
ORDER BY p.name, e.year;

-- =====================================================
-- CLOSE CONTEST DETECTION QUERIES
-- =====================================================

-- Close contests by margin threshold
WITH constituency_results AS (
    SELECT 
        c.id AS constituency_id,
        c.name AS constituency_name,
        c.state,
        cand_w.name AS winner_name,
        p_w.name AS winner_party,
        r_w.votes AS winner_votes,
        cand_r.name AS runner_up_name,
        p_r.name AS runner_up_party,
        r_r.votes AS runner_up_votes,
        r_w.margin,
        ROUND((r_w.margin::NUMERIC / NULLIF(SUM(r.votes) OVER (PARTITION BY c.id), 0)) * 100, 2) AS margin_percentage,
        COUNT(r.id) OVER (PARTITION BY c.id) AS total_candidates
    FROM constituencies c
    JOIN results r_w ON r_w.constituency_id = c.id AND r_w.rank = 1
    JOIN candidates cand_w ON r_w.candidate_id = cand_w.id
    JOIN parties p_w ON cand_w.party_id = p_w.id
    LEFT JOIN results r_r ON r_r.constituency_id = c.id AND r_r.rank = 2
    LEFT JOIN candidates cand_r ON r_r.candidate_id = cand_r.id
    LEFT JOIN parties p_r ON cand_r.party_id = p_r.id
    LEFT JOIN results r ON r.constituency_id = c.id
    WHERE c.election_id = $1
)
SELECT 
    cr.constituency_id,
    cr.constituency_name,
    cr.state,
    cr.margin,
    cr.margin_percentage,
    cr.winner_name,
    cr.winner_party,
    cr.winner_votes,
    cr.runner_up_name,
    cr.runner_up_party,
    cr.runner_up_votes,
    cr.total_candidates
FROM constituency_results cr
WHERE cr.margin_percentage < $2
ORDER BY cr.margin_percentage ASC;

-- Close contest statistics
WITH close_contests AS (
    SELECT 
        c.state,
        c.id AS constituency_id,
        ROUND((r.margin::NUMERIC / NULLIF(SUM(r2.votes) OVER (PARTITION BY c.id), 0)) * 100, 2) AS margin_percentage
    FROM constituencies c
    JOIN results r ON r.constituency_id = c.id AND r.rank = 1
    LEFT JOIN results r2 ON r.constituency_id = r2.constituency_id
    WHERE c.election_id = $1
),
total_constituencies AS (
    SELECT COUNT(DISTINCT c.id) AS total
    FROM constituencies c
    WHERE c.election_id = $1
)
SELECT 
    cc.state,
    COUNT(cc.constituency_id) AS close_contest_count,
    ROUND(AVG(cc.margin_percentage), 2) AS average_margin,
    ROUND((COUNT(cc.constituency_id)::NUMERIC / NULLIF(tc.total, 0)) * 100, 2) AS percentage_of_total
FROM close_contests cc, total_constituencies tc
WHERE cc.margin_percentage < $2
GROUP BY cc.state, tc.total
ORDER BY close_contest_count DESC;

-- Most competitive region
WITH close_contests AS (
    SELECT 
        c.state,
        c.id AS constituency_id,
        ROUND((r.margin::NUMERIC / NULLIF(SUM(r2.votes) OVER (PARTITION BY c.id), 0)) * 100, 2) AS margin_percentage
    FROM constituencies c
    JOIN results r ON r.constituency_id = c.id AND r.rank = 1
    LEFT JOIN results r2 ON r.constituency_id = r2.constituency_id
    WHERE c.election_id = $1
)
SELECT 
    state AS most_competitive_region,
    COUNT(constituency_id) AS close_contest_count
FROM close_contests
WHERE margin_percentage < $2
GROUP BY state
ORDER BY close_contest_count DESC
LIMIT 1;

-- =====================================================
-- REGIONAL ANALYSIS QUERIES
-- =====================================================

-- Comprehensive regional analysis
WITH regional_data AS (
    SELECT 
        c.state AS region,
        COUNT(DISTINCT c.id) AS total_constituencies,
        SUM(c.voter_count) AS total_voters,
        SUM(r.votes) AS total_votes_cast,
        ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2) AS turnout_percentage,
        (SELECT p.name FROM results r2 JOIN candidates cand2 ON r2.candidate_id = cand2.id JOIN parties p ON cand2.party_id = p.id WHERE r2.constituency_id = c.id AND r2.rank = 1 GROUP BY p.name ORDER BY COUNT(*) DESC LIMIT 1) AS leading_party
    FROM constituencies c
    LEFT JOIN results r ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY c.state
)
SELECT 
    rd.region,
    rd.total_constituencies,
    rd.total_voters,
    rd.total_votes_cast,
    rd.turnout_percentage,
    rd.leading_party
FROM regional_data rd
ORDER BY rd.turnout_percentage DESC;

-- Party distribution by region
SELECT 
    c.state AS region,
    p.name AS party,
    SUM(r.votes) AS total_votes,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(rv.total_votes, 0)) * 100, 2) AS vote_share,
    COUNT(DISTINCT CASE WHEN r.rank = 1 THEN r.constituency_id END) AS seats_won
FROM constituencies c
LEFT JOIN results r ON r.constituency_id = c.id
LEFT JOIN candidates cand ON r.candidate_id = cand.id
LEFT JOIN parties p ON cand.party_id = p.id
JOIN (
    SELECT 
        c.state,
        SUM(r.votes) AS total_votes
    FROM results r
    JOIN constituencies c ON r.constituency_id = c.id
    WHERE c.election_id = $1
    GROUP BY c.state
) rv ON c.state = rv.state
WHERE c.election_id = $1
GROUP BY c.state, p.name, rv.total_votes
ORDER BY c.state, seats_won DESC;

-- Regional comparison
SELECT 
    c.state AS region,
    'Turnout' AS metric,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2) AS value,
    RANK() OVER (ORDER BY (SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) DESC) AS rank
FROM constituencies c
LEFT JOIN results r ON r.constituency_id = c.id
WHERE c.election_id = $1
GROUP BY c.state

UNION ALL

SELECT 
    c.state AS region,
    'Total Votes' AS metric,
    SUM(r.votes) AS value,
    RANK() OVER (ORDER BY SUM(r.votes) DESC) AS rank
FROM constituencies c
LEFT JOIN results r ON r.constituency_id = c.id
WHERE c.election_id = $1
GROUP BY c.state

UNION ALL

SELECT 
    c.state AS region,
    'Total Constituencies' AS metric,
    COUNT(DISTINCT c.id) AS value,
    RANK() OVER (ORDER BY COUNT(DISTINCT c.id) DESC) AS rank
FROM constituencies c
WHERE c.election_id = $1
GROUP BY c.state
ORDER BY region, metric;

-- Regional trends over time
SELECT 
    c.state AS region,
    e.year,
    ROUND((SUM(r.votes)::NUMERIC / NULLIF(SUM(c.voter_count), 0)) * 100, 2) AS turnout_percentage,
    (SELECT p.name FROM results r2 JOIN candidates cand2 ON r2.candidate_id = cand2.id JOIN parties p ON cand2.party_id = p.id WHERE r2.constituency_id = c.id AND r2.rank = 1 GROUP BY p.name ORDER BY COUNT(*) DESC LIMIT 1) AS leading_party
FROM elections e
JOIN constituencies c ON c.election_id = e.id
LEFT JOIN results r ON r.constituency_id = c.id
WHERE e.region = $1
GROUP BY c.state, e.year
ORDER BY c.state, e.year;
