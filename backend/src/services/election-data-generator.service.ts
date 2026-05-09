import { promises as fs } from 'fs';
import path from 'path';

/**
 * Synthetic Election Dataset Generator
 * Generates realistic election data for testing and demo purposes
 */

interface Constituency {
  id: string;
  name: string;
  state: string;
  district: string;
  totalVoters: number;
  urbanPercentage: number;
  ruralPercentage: number;
  literacyRate: number;
  medianAge: number;
  population: number;
}

interface Party {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  ideology: 'left' | 'center' | 'right' | 'center-left';
  baseSupport: number; // Base support percentage
  swingFactor: number; // How much support can swing
}

interface ElectionResult {
  constituencyId: string;
  constituencyName: string;
  state: string;
  year: number;
  party: string;
  votes: number;
  voteShare: number;
  seatsWon: number;
  margin: number;
  winner: string;
  turnout: number;
  totalVotes: number;
}

interface HistoricalData {
  year: number;
  results: ElectionResult[];
  nationalResults: {
    party: string;
    votes: number;
    seats: number;
    voteShare: number;
  }[];
}

interface DemoScenario {
  name: string;
  description: string;
  characteristics: string[];
  data: {
    constituencies: Constituency[];
    results: ElectionResult[];
    historical: HistoricalData[];
  };
}

export class ElectionDataGenerator {
  private states = [
    'Uttar Pradesh', 'Maharashtra', 'Tamil Nadu', 'West Bengal', 'Bihar',
    'Karnataka', 'Rajasthan', 'Gujarat', 'Andhra Pradesh', 'Madhya Pradesh',
    'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Delhi'
  ];

  private parties: Party[] = [
    { id: 'bjp', name: 'Bharatiya Janata Party', abbreviation: 'BJP', color: '#FF9933', ideology: 'right', baseSupport: 35, swingFactor: 0.15 },
    { id: 'inc', name: 'Indian National Congress', abbreviation: 'INC', color: '#00BFFF', ideology: 'center', baseSupport: 25, swingFactor: 0.18 },
    { id: 'aap', name: 'Aam Aadmi Party', abbreviation: 'AAP', color: '#0066CC', ideology: 'center', baseSupport: 10, swingFactor: 0.25 },
    { id: 'tmc', name: 'Trinamool Congress', abbreviation: 'TMC', color: '#00AA00', ideology: 'center-left', baseSupport: 8, swingFactor: 0.20 },
    { id: 'bsp', name: 'Bahujan Samaj Party', abbreviation: 'BSP', color: '#22409A', ideology: 'left', baseSupport: 6, swingFactor: 0.12 },
    { id: 'sp', name: 'Samajwadi Party', abbreviation: 'SP', color: '#FF0000', ideology: 'left', baseSupport: 5, swingFactor: 0.15 },
    { id: 'dmk', name: 'DMK', abbreviation: 'DMK', color: '#FF0000', ideology: 'center-left', baseSupport: 5, swingFactor: 0.18 },
    { id: 'jd_u', name: 'Janata Dal (United)', abbreviation: 'JD(U)', color: '#FF0000', ideology: 'center', baseSupport: 4, swingFactor: 0.20 },
  ];

  private swingRegions = [
    { state: 'Uttar Pradesh', swingFactor: 0.25 },
    { state: 'Maharashtra', swingFactor: 0.22 },
    { state: 'West Bengal', swingFactor: 0.30 },
    { state: 'Bihar', swingFactor: 0.28 },
    { state: 'Karnataka', swingFactor: 0.20 },
  ];

  /**
   * Generate realistic constituency data
   */
  generateConstituencies(count: number = 543): Constituency[] {
    const constituencies: Constituency[] = [];
    const constituenciesPerState = Math.floor(count / this.states.length);

    for (const state of this.states) {
      const stateConstituencyCount = state === 'Uttar Pradesh' ? 80 : 
                                      state === 'Maharashtra' ? 48 :
                                      state === 'West Bengal' ? 42 :
                                      state === 'Bihar' ? 40 :
                                      constituenciesPerState;

      for (let i = 0; i < stateConstituencyCount && constituencies.length < count; i++) {
        const urbanPct = this.randomGaussian(40, 15);
        const literacyRate = this.randomGaussian(75, 10);
        const medianAge = this.randomGaussian(30, 8);
        const population = this.randomInt(500000, 3000000);

        constituencies.push({
          id: `const_${state.substring(0, 2).toLowerCase()}_${String(i + 1).padStart(3, '0')}`,
          name: `${this.generateConstituencyName(state, i)}`,
          state,
          district: this.generateDistrictName(state),
          totalVoters: Math.floor(population * 0.65),
          urbanPercentage: Math.min(Math.max(urbanPct, 10), 90),
          ruralPercentage: Math.min(Math.max(100 - urbanPct, 10), 90),
          literacyRate: Math.min(Math.max(literacyRate, 50), 95),
          medianAge: Math.min(Math.max(medianAge, 18), 65),
          population,
        });
      }
    }

    return constituencies;
  }

  /**
   * Generate election results for a given year
   */
  generateElectionResults(
    constituencies: Constituency[],
    year: number,
    previousYearResults?: ElectionResult[]
  ): ElectionResult[] {
    const results: ElectionResult[] = [];
    const nationalSwing = this.randomFloat(-0.1, 0.1);

    for (const constituency of constituencies) {
      const turnout = this.generateTurnout(constituency);
      const totalVotes = Math.floor(constituency.totalVoters * turnout);
      const votesPerParty: Record<string, number> = {};
      let totalAllocated = 0;

      // Calculate base support for each party
      for (const party of this.parties) {
        let partySupport = party.baseSupport;
        
        // Adjust based on constituency characteristics
        if (constituency.urbanPercentage > 60) {
          if (party.ideology === 'right') partySupport += 5;
          if (party.ideology === 'left') partySupport -= 3;
        } else if (constituency.urbanPercentage < 40) {
          if (party.ideology === 'left') partySupport += 5;
          if (party.ideology === 'right') partySupport -= 3;
        }

        if (constituency.literacyRate > 80) {
          if (party.ideology === 'center') partySupport += 3;
        }

        // Add swing based on region
        const swingRegion = this.swingRegions.find(sr => sr.state === constituency.state);
        if (swingRegion) {
          partySupport += this.randomFloat(-swingRegion.swingFactor * 20, swingRegion.swingFactor * 20);
        }

        // Add national swing
        partySupport += nationalSwing * 50;

        // Add random variation
        partySupport += this.randomFloat(-10, 10);

        // If we have previous results, add continuity
        if (previousYearResults) {
          const prevResult = previousYearResults.find(r => r.constituencyId === constituency.id);
          if (prevResult) {
            const prevPartyResult = previousYearResults.find(r => 
              r.constituencyId === constituency.id && r.party === party.name
            );
            if (prevPartyResult) {
              partySupport = (prevPartyResult.voteShare * 0.7) + (partySupport * 0.3);
            }
          }
        }

        partySupport = Math.max(0, partySupport);
        votesPerParty[party.name] = 0;
        totalAllocated += partySupport;
      }

      // Normalize and allocate votes
      for (const party of this.parties) {
        // Recalculate with normalization
        const normalizedSupport = (votesPerParty[party.name] || 0) / totalAllocated;
        const votes = Math.floor(totalVotes * normalizedSupport);
        votesPerParty[party.name] = votes;
      }

      // Distribute remaining votes
      let allocatedVotes = Object.values(votesPerParty).reduce((a, b) => a + b, 0);
      const remainingVotes = totalVotes - allocatedVotes;
      const winningParty = Object.entries(votesPerParty).reduce((a, b) => b[1] > a[1] ? b : a)[0];
      votesPerParty[winningParty] += remainingVotes;

      // Find winner and margin
      const sortedVotes = Object.entries(votesPerParty).sort((a, b) => b[1] - a[1]);
      const winner = sortedVotes[0][0];
      const winnerVotes = sortedVotes[0][1];
      const runnerUpVotes = sortedVotes[1][1];
      const margin = ((winnerVotes - runnerUpVotes) / totalVotes) * 100;

      for (const party of this.parties) {
        const votes = votesPerParty[party.name];
        const voteShare = (votes / totalVotes) * 100;
        const seatsWon = party.name === winner ? 1 : 0;

        results.push({
          constituencyId: constituency.id,
          constituencyName: constituency.name,
          state: constituency.state,
          year,
          party: party.name,
          votes,
          voteShare,
          seatsWon,
          margin,
          winner,
          turnout,
          totalVotes,
        });
      }
    }

    return results;
  }

  /**
   * Generate realistic turnout based on constituency characteristics
   */
  private generateTurnout(constituency: Constituency): number {
    let baseTurnout = 0.65;

    // Higher turnout in rural areas
    if (constituency.ruralPercentage > 60) {
      baseTurnout += 0.05;
    }

    // Higher turnout with higher literacy
    if (constituency.literacyRate > 80) {
      baseTurnout += 0.08;
    }

    // Lower turnout in urban areas
    if (constituency.urbanPercentage > 70) {
      baseTurnout -= 0.03;
    }

    // Add random variation
    baseTurnout += this.randomFloat(-0.1, 0.1);

    return Math.min(Math.max(baseTurnout, 0.4), 0.85);
  }

  /**
   * Generate historical comparison data
   */
  generateHistoricalData(
    constituencies: Constituency[],
    years: number[] = [2014, 2019, 2024]
  ): HistoricalData[] {
    const historicalData: HistoricalData[] = [];
    let previousResults: ElectionResult[] | undefined;

    for (const year of years) {
      const results = this.generateElectionResults(constituencies, year, previousResults);
      
      const nationalResults = this.calculateNationalResults(results);
      
      historicalData.push({
        year,
        results,
        nationalResults,
      });

      previousResults = results;
    }

    return historicalData;
  }

  /**
   * Calculate national results from constituency results
   */
  private calculateNationalResults(results: ElectionResult[]): {
    party: string;
    votes: number;
    seats: number;
    voteShare: number;
  }[] {
    const partyStats: Record<string, { votes: number; seats: number }> = {};
    let totalVotes = 0;

    for (const result of results) {
      if (!partyStats[result.party]) {
        partyStats[result.party] = { votes: 0, seats: 0 };
      }
      partyStats[result.party].votes += result.votes;
      partyStats[result.party].seats += result.seatsWon;
      totalVotes += result.votes;
    }

    return Object.entries(partyStats).map(([party, stats]) => ({
      party,
      votes: stats.votes,
      seats: stats.seats,
      voteShare: (stats.votes / totalVotes) * 100,
    })).sort((a, b) => b.seats - a.seats);
  }

  /**
   * Generate close contests
   */
  generateCloseContests(
    constituencies: Constituency[],
    year: number,
    percentage: number = 0.15
  ): ElectionResult[] {
    const results = this.generateElectionResults(constituencies, year);
    const closeContestCount = Math.floor(constituencies.length * percentage);
    
    // Select random constituencies to make close contests
    const selectedIndices = this.shuffleArray(
      Array.from({ length: constituencies.length }, (_, i) => i)
    ).slice(0, closeContestCount);

    for (const index of selectedIndices) {
      const constituency = constituencies[index];
      const constituencyResults = results.filter(r => r.constituencyId === constituency.id);
      
      if (constituencyResults.length >= 2) {
        // Make the top two parties very close
        constituencyResults.sort((a, b) => b.votes - a.votes);
        const winner = constituencyResults[0];
        const runnerUp = constituencyResults[1];
        
        const marginVotes = Math.floor(winner.votes * 0.02); // 2% margin
        const avgVotes = (winner.votes + runnerUp.votes) / 2;
        
        winner.votes = avgVotes + marginVotes;
        runnerUp.votes = avgVotes - marginVotes;
        
        winner.voteShare = (winner.votes / winner.totalVotes) * 100;
        runnerUp.voteShare = (runnerUp.votes / runnerUp.totalVotes) * 100;
        winner.margin = (marginVotes / winner.totalVotes) * 100;
      }
    }

    return results;
  }

  /**
   * Generate demo scenarios
   */
  generateDemoScenarios(): DemoScenario[] {
    const constituencies = this.generateConstituencies(543);
    const historical = this.generateHistoricalData(constituencies, [2014, 2019, 2024]);

    return [
      {
        name: 'Competitive Election',
        description: 'A highly competitive election with multiple parties having significant support',
        characteristics: [
          'Close national race',
          'Multiple regional strongholds',
          'High voter turnout',
          'Swing regions with volatile results',
        ],
        data: {
          constituencies,
          results: historical[historical.length - 1].results,
          historical,
        },
      },
      {
        name: 'Landslide Victory',
        description: 'One party achieves a decisive victory with large margins',
        characteristics: [
          'Single party dominance',
          'Large victory margins',
          'Regional polarization',
          'Lower turnout in opposition strongholds',
        ],
        data: {
          constituencies,
          results: this.generateLandslideResults(constituencies, 2024, 'BJP'),
          historical,
        },
      },
      {
        name: 'Hung Parliament',
        description: 'No single party achieves majority, requiring coalition',
        characteristics: [
          'Fragmented vote share',
          'Close contests in many constituencies',
          'Regional party dominance',
          'High importance of swing constituencies',
        ],
        data: {
          constituencies,
          results: this.generateHungParliamentResults(constituencies, 2024),
          historical,
        },
      },
      {
        name: 'Wave Election',
        description: 'A significant shift in voter preferences from previous election',
        characteristics: [
          'Large swing from previous election',
          'Anti-incumbency wave',
          'Surprise victories',
          'Voter turnout changes',
        ],
        data: {
          constituencies,
          results: this.generateWaveElectionResults(constituencies, 2024, historical[1].results),
          historical,
        },
      },
    ];
  }

  /**
   * Generate landslide victory results
   */
  private generateLandslideResults(
    constituencies: Constituency[],
    year: number,
    winningParty: string
  ): ElectionResult[] {
    const results = this.generateElectionResults(constituencies, year);
    
    // Boost winning party votes across all constituencies
    for (const result of results) {
      if (result.party === winningParty) {
        result.votes = Math.floor(result.votes * 1.5);
        result.voteShare = (result.votes / result.totalVotes) * 100;
      } else {
        result.votes = Math.floor(result.votes * 0.6);
        result.voteShare = (result.votes / result.totalVotes) * 100;
      }
    }

    // Recalculate winners and margins
    for (const constituency of constituencies) {
      const constituencyResults = results.filter(r => r.constituencyId === constituency.id);
      constituencyResults.sort((a, b) => b.votes - a.votes);
      
      if (constituencyResults.length > 0) {
        const winner = constituencyResults[0];
        const runnerUp = constituencyResults[1];
        const winnerVotes = winner.votes;
        const runnerUpVotes = runnerUp ? runnerUp.votes : 0;
        const margin = ((winnerVotes - runnerUpVotes) / winner.totalVotes) * 100;
        
        constituencyResults.forEach(r => {
          r.winner = winner.party;
          r.margin = margin;
          r.seatsWon = r.party === winner.party ? 1 : 0;
        });
      }
    }

    return results;
  }

  /**
   * Generate hung parliament results
   */
  private generateHungParliamentResults(
    constituencies: Constituency[],
    year: number
  ): ElectionResult[] {
    const results = this.generateCloseContests(constituencies, year, 0.4);
    return results;
  }

  /**
   * Generate wave election results
   */
  private generateWaveElectionResults(
    constituencies: Constituency[],
    year: number,
    previousResults: ElectionResult[]
  ): ElectionResult[] {
    const results = this.generateElectionResults(constituencies, year, previousResults);
    
    // Add significant swing
    for (const result of results) {
      const prevResult = previousResults.find(
        r => r.constituencyId === result.constituencyId && r.party === result.party
      );
      
      if (prevResult) {
        const swing = this.randomFloat(-0.3, 0.3);
        result.votes = Math.floor(result.votes * (1 + swing));
        result.voteShare = (result.votes / result.totalVotes) * 100;
      }
    }

    // Recalculate winners
    for (const constituency of constituencies) {
      const constituencyResults = results.filter(r => r.constituencyId === constituency.id);
      constituencyResults.sort((a, b) => b.votes - a.votes);
      
      if (constituencyResults.length > 0) {
        const winner = constituencyResults[0];
        const runnerUp = constituencyResults[1];
        const margin = ((winner.votes - (runnerUp?.votes || 0)) / winner.totalVotes) * 100;
        
        constituencyResults.forEach(r => {
          r.winner = winner.party;
          r.margin = margin;
          r.seatsWon = r.party === winner.party ? 1 : 0;
        });
      }
    }

    return results;
  }

  /**
   * Generate CSV file from results
   */
  async generateCSV(results: ElectionResult[], filename: string): Promise<string> {
    const headers = ['Constituency ID', 'Constituency Name', 'State', 'Year', 'Party', 'Votes', 'Vote Share (%)', 'Seats Won', 'Margin (%)', 'Winner', 'Turnout (%)', 'Total Votes'];
    const rows = results.map(r => [
      r.constituencyId,
      r.constituencyName,
      r.state,
      r.year,
      r.party,
      r.votes,
      r.voteShare.toFixed(2),
      r.seatsWon,
      r.margin.toFixed(2),
      r.winner,
      (r.turnout * 100).toFixed(2),
      r.totalVotes,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filePath = path.join(process.cwd(), 'data', filename);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, csvContent);
    
    return filePath;
  }

  /**
   * Generate constituency CSV
   */
  async generateConstituencyCSV(constituencies: Constituency[], filename: string): Promise<string> {
    const headers = ['ID', 'Name', 'State', 'District', 'Total Voters', 'Urban %', 'Rural %', 'Literacy Rate', 'Median Age', 'Population'];
    const rows = constituencies.map(c => [
      c.id,
      c.name,
      c.state,
      c.district,
      c.totalVoters,
      c.urbanPercentage.toFixed(2),
      c.ruralPercentage.toFixed(2),
      c.literacyRate.toFixed(2),
      c.medianAge.toFixed(1),
      c.population,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filePath = path.join(process.cwd(), 'data', filename);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, csvContent);
    
    return filePath;
  }

  /**
   * Generate all sample CSV files
   */
  async generateAllCSVFiles(): Promise<string[]> {
    const constituencies = this.generateConstituencies(543);
    const scenarios = this.generateDemoScenarios();
    const files: string[] = [];

    // Generate constituency data
    const constituencyFile = await this.generateConstituencyCSV(constituencies, 'constituencies.csv');
    files.push(constituencyFile);

    // Generate results for each scenario
    for (const scenario of scenarios) {
      const resultsFile = await this.generateCSV(
        scenario.data.results,
        `${scenario.name.toLowerCase().replace(/\s+/g, '_')}_results.csv`
      );
      files.push(resultsFile);

      // Generate historical data
      for (const historical of scenario.data.historical) {
        const historicalFile = await this.generateCSV(
          historical.results,
          `${scenario.name.toLowerCase().replace(/\s+/g, '_')}_${historical.year}_results.csv`
        );
        files.push(historicalFile);
      }
    }

    return files;
  }

  /**
   * Helper: Generate random constituency name
   */
  private generateConstituencyName(state: string, index: number): string {
    const prefixes = ['North', 'South', 'East', 'West', 'Central', 'New', 'Old', 'Greater'];
    const suffixes = ['Nagar', 'Pur', 'Ganj', 'Garh', 'Mandal', 'Parliamentary', 'Lok Sabha'];
    const names = ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Meerut', 'Allahabad', 'Ghaziabad', 'Noida'];
    
    if (index < names.length) {
      return `${names[index]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }
    
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${state} ${index + 1}`;
  }

  /**
   * Helper: Generate random district name
   */
  private generateDistrictName(_state: string): string {
    const districts = [
      'Central', 'North', 'South', 'East', 'West', 'Rural', 'Urban',
      'Capital', 'Coastal', 'Hill', 'Valley', 'River', 'Lake'
    ];
    return `${districts[Math.floor(Math.random() * districts.length)]} District`;
  }

  /**
   * Helper: Random integer between min and max (inclusive)
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Helper: Random float between min and max
   */
  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Helper: Gaussian random number
   */
  private randomGaussian(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z * stdDev + mean;
  }

  /**
   * Helper: Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
