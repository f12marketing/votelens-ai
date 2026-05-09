# Synthetic Election Dataset Generator

This module generates realistic synthetic election data for testing, development, and demo purposes.

## Features

- **Realistic Constituency Data**: 543 constituencies across 15 Indian states with realistic demographics
- **Multiple Parties**: 8 major political parties with base support and swing factors
- **Turnout Variation**: Dynamic turnout based on urban/rural split, literacy rates, and demographics
- **Swing Regions**: Configurable swing regions with volatile voting patterns
- **Historical Comparison**: Multi-year historical data (2014, 2019, 2024) with continuity
- **Close Contests**: Generates close races with configurable percentage
- **Demo Scenarios**: Pre-built scenarios for different election outcomes

## Demo Scenarios

### 1. Competitive Election
- Highly competitive election with multiple parties having significant support
- Close national race
- Multiple regional strongholds
- High voter turnout
- Swing regions with volatile results

### 2. Landslide Victory
- One party achieves a decisive victory with large margins
- Single party dominance
- Large victory margins
- Regional polarization
- Lower turnout in opposition strongholds

### 3. Hung Parliament
- No single party achieves majority, requiring coalition
- Fragmented vote share
- Close contests in many constituencies
- Regional party dominance
- High importance of swing constituencies

### 4. Wave Election
- Significant shift in voter preferences from previous election
- Large swing from previous election
- Anti-incumbency wave
- Surprise victories
- Voter turnout changes

## Usage

### Generate CSV Files

```bash
cd backend
npx ts-node scripts/generate-dataset.ts
```

This will generate:
- `data/constituencies.csv` - All constituency data
- `data/competitive_election_results.csv` - Competitive scenario results
- `data/competitive_election_2014_results.csv` - Historical data
- `data/competitive_election_2019_results.csv` - Historical data
- `data/competitive_election_2024_results.csv` - Historical data
- Additional CSV files for other scenarios

### Seed Database

```bash
cd backend
npx ts-node scripts/seed-database.ts
```

This will:
- Create all necessary database tables
- Seed 8 parties
- Seed 543 constituencies
- Seed 3 historical elections (2014, 2019, 2024)
- Seed 4 demo scenarios
- Seed close contests demo election

### Programmatic Usage

```typescript
import { ElectionDataGenerator } from './src/services/election-data-generator.service';

const generator = new ElectionDataGenerator();

// Generate constituencies
const constituencies = generator.generateConstituencies(543);

// Generate election results
const results = generator.generateElectionResults(constituencies, 2024);

// Generate historical data
const historical = generator.generateHistoricalData(constituencies, [2014, 2019, 2024]);

// Generate demo scenarios
const scenarios = generator.generateDemoScenarios();

// Generate close contests
const closeContests = generator.generateCloseContests(constituencies, 2024, 0.15);

// Generate CSV files
const csvPath = await generator.generateCSV(results, 'results.csv');
const constituencyCsv = await generator.generateConstituencyCSV(constituencies, 'constituencies.csv');
```

## Data Schema

### Constituency
- `id`: Unique identifier
- `name`: Constituency name
- `state`: State name
- `district`: District name
- `totalVoters`: Total registered voters
- `urbanPercentage`: Percentage of urban population
- `ruralPercentage`: Percentage of rural population
- `literacyRate`: Literacy rate percentage
- `medianAge`: Median age of voters
- `population`: Total population

### Election Result
- `constituencyId`: Reference to constituency
- `constituencyName`: Constituency name
- `state`: State name
- `year`: Election year
- `party`: Party name
- `votes`: Total votes received
- `voteShare`: Percentage of votes
- `seatsWon`: Seats won (0 or 1)
- `margin`: Victory margin percentage
- `winner`: Winning party
- `turnout`: Voter turnout percentage
- `totalVotes`: Total votes cast in constituency

### Party
- `id`: Party identifier
- `name`: Full party name
- `abbreviation`: Party abbreviation
- `color`: Party color (hex)
- `ideology`: Political ideology (left, center, right, center-left)
- `baseSupport`: Base support percentage
- `swingFactor`: Swing volatility factor

## Database Schema

The seeder creates the following tables:

- `constituencies` - Constituency demographic data
- `parties` - Party information
- `elections` - Election metadata
- `election_results` - Detailed election results
- `demo_scenarios` - Demo scenario definitions

Indexes are created on:
- `constituencies(state)`
- `election_results(election_id)`
- `election_results(constituency_id)`
- `election_results(party_id)`

## Configuration

### States
Default states: Uttar Pradesh, Maharashtra, Tamil Nadu, West Bengal, Bihar, Karnataka, Rajasthan, Gujarat, Andhra Pradesh, Madhya Pradesh, Telangana, Kerala, Punjab, Haryana, Delhi

### Parties
- BJP (Bharatiya Janata Party) - Right
- INC (Indian National Congress) - Center
- AAP (Aam Aadmi Party) - Center
- TMC (Trinamool Congress) - Center-left
- BSP (Bahujan Samaj Party) - Left
- SP (Samajwadi Party) - Left
- DMK - Center-left
- JD(U) (Janata Dal United) - Center

### Swing Regions
- Uttar Pradesh (swing factor: 0.25)
- Maharashtra (swing factor: 0.22)
- West Bengal (swing factor: 0.30)
- Bihar (swing factor: 0.28)
- Karnataka (swing factor: 0.20)

## Customization

You can customize the generator by modifying:

1. **States**: Edit the `states` array in the service
2. **Parties**: Modify the `parties` array with custom party data
3. **Swing Regions**: Update the `swingRegions` array
4. **Constituency Count**: Change the count parameter in `generateConstituencies()`
5. **Years**: Customize years in `generateHistoricalData()`
6. **Close Contest Percentage**: Adjust the percentage in `generateCloseContests()`

## Output Statistics

- **Total Constituencies**: 543
- **States**: 15
- **Parties**: 8
- **Historical Years**: 3 (2014, 2019, 2024)
- **Demo Scenarios**: 4
- **CSV Files**: ~15 files
- **Total Records**: ~13,000+ election results

## Notes

- The generated data is synthetic and for development/testing purposes only
- All data is statistically realistic but not based on real election results
- The seeder uses a placeholder database connection - you'll need to implement actual database connection logic for your specific database (PostgreSQL, MySQL, etc.)
- CSV files are generated in the `data/` directory
- Historical data maintains continuity between years using previous results as a base

## License

This dataset generator is part of the VoteLens AI project.
