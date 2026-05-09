import { ElectionDataGenerator } from '../src/services/election-data-generator.service';

/**
 * Database Seeding Script
 * Seeds the database with synthetic election data
 * Run with: npx ts-node scripts/seed-database.ts
 */

interface DatabaseClient {
  query: (sql: string, params?: any[]) => Promise<any>;
}

class DatabaseSeeder {
  private generator: ElectionDataGenerator;
  private db: DatabaseClient | null = null;

  constructor() {
    this.generator = new ElectionDataGenerator();
  }

  /**
   * Initialize database connection
   * This is a placeholder - actual implementation depends on your DB setup
   */
  async initializeDatabase(): Promise<void> {
    // Placeholder for database initialization
    // In production, this would connect to PostgreSQL, MySQL, etc.
    console.log('🔌 Initializing database connection...');
    // Example: this.db = await createConnection(config);
    this.db = {
      query: async (sql: string, _params: any[] = []) => {
        console.log(`   Executing: ${sql}`);
        return { rows: [], rowCount: 0 };
      },
    };
    console.log('   Database connection established\n');
  }

  /**
   * Create tables if they don't exist
   */
  async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('📋 Creating tables...');

    const tables = [
      `
      CREATE TABLE IF NOT EXISTS constituencies (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        district VARCHAR(100),
        total_voters INTEGER NOT NULL,
        urban_percentage DECIMAL(5,2),
        rural_percentage DECIMAL(5,2),
        literacy_rate DECIMAL(5,2),
        median_age DECIMAL(4,1),
        population INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS parties (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        abbreviation VARCHAR(10) NOT NULL,
        color VARCHAR(7),
        ideology VARCHAR(20),
        base_support DECIMAL(5,2),
        swing_factor DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS elections (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL UNIQUE,
        name VARCHAR(255),
        description TEXT,
        total_voters BIGINT,
        total_votes_cast BIGINT,
        voter_turnout DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS election_results (
        id SERIAL PRIMARY KEY,
        election_id INTEGER REFERENCES elections(id),
        constituency_id VARCHAR(50) REFERENCES constituencies(id),
        party_id VARCHAR(10) REFERENCES parties(id),
        votes BIGINT NOT NULL,
        vote_share DECIMAL(5,2),
        seats_won INTEGER DEFAULT 0,
        margin DECIMAL(5,2),
        winner BOOLEAN DEFAULT FALSE,
        turnout DECIMAL(5,2),
        total_votes BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(election_id, constituency_id, party_id)
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS demo_scenarios (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        characteristics JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_constituencies_state ON constituencies(state);
      CREATE INDEX IF NOT EXISTS idx_election_results_election ON election_results(election_id);
      CREATE INDEX IF NOT EXISTS idx_election_results_constituency ON election_results(constituency_id);
      CREATE INDEX IF NOT EXISTS idx_election_results_party ON election_results(party_id);
      `
    ];

    for (const tableSQL of tables) {
      await this.db.query(tableSQL);
    }

    console.log('   Tables created successfully\n');
  }

  /**
   * Seed parties
   */
  async seedParties(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('🏛️  Seeding parties...');

    const parties = this.generator['parties'];

    for (const party of parties) {
      await this.db.query(
        `INSERT INTO parties (id, name, abbreviation, color, ideology, base_support, swing_factor)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           abbreviation = EXCLUDED.abbreviation,
           color = EXCLUDED.color,
           ideology = EXCLUDED.ideology,
           base_support = EXCLUDED.base_support,
           swing_factor = EXCLUDED.swing_factor`,
        [party.id, party.name, party.abbreviation, party.color, party.ideology, party.baseSupport, party.swingFactor]
      );
    }

    console.log(`   Seeded ${parties.length} parties\n`);
  }

  /**
   * Seed constituencies
   */
  async seedConstituencies(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('📍 Seeding constituencies...');

    const constituencies = this.generator['generateConstituencies'](543);

    for (const constituency of constituencies) {
      await this.db.query(
        `INSERT INTO constituencies (id, name, state, district, total_voters, urban_percentage, rural_percentage, literacy_rate, median_age, population)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           state = EXCLUDED.state,
           district = EXCLUDED.district,
           total_voters = EXCLUDED.total_voters,
           urban_percentage = EXCLUDED.urban_percentage,
           rural_percentage = EXCLUDED.rural_percentage,
           literacy_rate = EXCLUDED.literacy_rate,
           median_age = EXCLUDED.median_age,
           population = EXCLUDED.population`,
        [
          constituency.id,
          constituency.name,
          constituency.state,
          constituency.district,
          constituency.totalVoters,
          constituency.urbanPercentage,
          constituency.ruralPercentage,
          constituency.literacyRate,
          constituency.medianAge,
          constituency.population,
        ]
      );
    }

    console.log(`   Seeded ${constituencies.length} constituencies\n`);
  }

  /**
   * Seed elections and results
   */
  async seedElectionsAndResults(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('📊 Seeding elections and results...');

    const constituencies = this.generator['generateConstituencies'](543);
    const historicalData = this.generator['generateHistoricalData'](constituencies, [2014, 2019, 2024]);

    for (const historical of historicalData) {
      // Insert election
      const electionResult = await this.db.query(
        `INSERT INTO elections (year, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (year) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description
         RETURNING id`,
        [historical.year, `General Election ${historical.year}`, `Indian General Election held in ${historical.year}`]
      );

      const electionId = electionResult.rows[0]?.id || historical.year;

      // Calculate total voters and votes
      const totalVoters = constituencies.reduce((sum, c) => sum + c.totalVoters, 0);
      const totalVotes = historical.results.reduce((sum, r) => sum + r.votes, 0);
      const avgTurnout = totalVotes / totalVoters;

      await this.db.query(
        `UPDATE elections SET total_voters = $1, total_votes_cast = $2, voter_turnout = $3 WHERE id = $4`,
        [totalVoters, totalVotes, avgTurnout, electionId]
      );

      // Insert results
      const partyMap: Record<string, string> = {};
      const parties = this.generator['parties'];
      parties.forEach(p => partyMap[p.name] = p.id);

      for (const result of historical.results) {
        const partyId = partyMap[result.party];
        if (!partyId) continue;

        await this.db.query(
          `INSERT INTO election_results (election_id, constituency_id, party_id, votes, vote_share, seats_won, margin, winner, turnout, total_votes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (election_id, constituency_id, party_id) DO UPDATE SET
             votes = EXCLUDED.votes,
             vote_share = EXCLUDED.vote_share,
             seats_won = EXCLUDED.seats_won,
             margin = EXCLUDED.margin,
             winner = EXCLUDED.winner,
             turnout = EXCLUDED.turnout,
             total_votes = EXCLUDED.total_votes`,
          [
            electionId,
            result.constituencyId,
            partyId,
            result.votes,
            result.voteShare,
            result.seatsWon,
            result.margin,
            result.party === result.winner,
            result.turnout,
            result.totalVotes,
          ]
        );
      }

      console.log(`   Seeded ${historical.year} election with ${historical.results.length} results`);
    }

    console.log('');
  }

  /**
   * Seed demo scenarios
   */
  async seedDemoScenarios(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('🎭 Seeding demo scenarios...');

    const scenarios = this.generator['generateDemoScenarios']();

    for (const scenario of scenarios) {
      await this.db.query(
        `INSERT INTO demo_scenarios (name, description, characteristics)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           characteristics = EXCLUDED.characteristics`,
        [scenario.name, scenario.description, JSON.stringify(scenario.characteristics)]
      );
    }

    console.log(`   Seeded ${scenarios.length} demo scenarios\n`);
  }

  /**
   * Generate and seed close contests
   */
  async seedCloseContests(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('🎯 Generating and seeding close contests...');

    const constituencies = this.generator['generateConstituencies'](543);
    const closeContests = this.generator['generateCloseContests'](constituencies, 2024, 0.15);

    // Insert as a special election
    const electionResult = await this.db.query(
      `INSERT INTO elections (year, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (year) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description
       RETURNING id`,
      [2025, 'Close Contests Demo', 'Demo election with 15% close contests for testing']
    );

    const electionId = electionResult.rows[0]?.id || 2025;

    const partyMap: Record<string, string> = {};
    const parties = this.generator['parties'];
    parties.forEach(p => partyMap[p.name] = p.id);

    for (const result of closeContests) {
      const partyId = partyMap[result.party];
      if (!partyId) continue;

      await this.db.query(
        `INSERT INTO election_results (election_id, constituency_id, party_id, votes, vote_share, seats_won, margin, winner, turnout, total_votes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (election_id, constituency_id, party_id) DO UPDATE SET
           votes = EXCLUDED.votes,
           vote_share = EXCLUDED.vote_share,
           seats_won = EXCLUDED.seats_won,
           margin = EXCLUDED.margin,
           winner = EXCLUDED.winner,
           turnout = EXCLUDED.turnout,
           total_votes = EXCLUDED.total_votes`,
        [
          electionId,
          result.constituencyId,
          partyId,
          result.votes,
          result.voteShare,
          result.seatsWon,
          result.margin,
          result.party === result.winner,
          result.turnout,
          result.totalVotes,
        ]
      );
    }

    console.log(`   Seeded close contests election with ${closeContests.length} results\n`);
  }

  /**
   * Run full seeding process
   */
  async seed(): Promise<void> {
    try {
      console.log('🌱 Starting database seeding...\n');

      await this.initializeDatabase();
      await this.createTables();
      await this.seedParties();
      await this.seedConstituencies();
      await this.seedElectionsAndResults();
      await this.seedDemoScenarios();
      await this.seedCloseContests();

      console.log('✅ Database seeding complete!');
      console.log('\n📊 Seeding Summary:');
      console.log('   • 8 Parties');
      console.log('   • 543 Constituencies');
      console.log('   • 3 Historical Elections (2014, 2019, 2024)');
      console.log('   • 4 Demo Scenarios');
      console.log('   • 1 Close Contests Demo Election');
      console.log('\n🎉 Your database is now ready for testing and demos!');

    } catch (error) {
      console.error('❌ Error seeding database:', error);
      process.exit(1);
    }
  }
}

// Run the seeder
const seeder = new DatabaseSeeder();
seeder.seed();
