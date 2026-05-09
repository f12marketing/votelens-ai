import { ElectionDataGenerator } from '../src/services/election-data-generator.service';

/**
 * Script to generate synthetic election dataset
 * Run with: npx ts-node scripts/generate-dataset.ts
 */

async function generateDataset() {
  console.log('🗳️  Starting synthetic election dataset generation...\n');

  const generator = new ElectionDataGenerator();

  try {
    // Generate constituencies
    console.log('📍 Generating constituency data...');
    const constituencies = generator['generateConstituencies'](543);
    console.log(`   Generated ${constituencies.length} constituencies\n`);

    // Generate historical data
    console.log('📊 Generating historical election data (2014, 2019, 2024)...');
    const historicalData = generator['generateHistoricalData'](constituencies, [2014, 2019, 2024]);
    console.log(`   Generated ${historicalData.length} years of historical data\n`);

    // Generate demo scenarios
    console.log('🎭 Generating demo scenarios...');
    const scenarios = generator['generateDemoScenarios']();
    console.log(`   Generated ${scenarios.length} demo scenarios:`);
    scenarios.forEach(scenario => {
      console.log(`   - ${scenario.name}: ${scenario.description}`);
    });
    console.log('');

    // Generate CSV files
    console.log('📄 Generating CSV files...');
    const csvFiles = await generator['generateAllCSVFiles']();
    console.log(`   Generated ${csvFiles.length} CSV files:`);
    csvFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('');

    // Print summary statistics
    console.log('📈 Summary Statistics:');
    console.log('   Total Constituencies: 543');
    console.log('   States: 15');
    console.log('   Parties: 8');
    console.log('   Historical Years: 3 (2014, 2019, 2024)');
    console.log('   Demo Scenarios: 4');
    console.log('');

    // Print scenario details
    console.log('🎯 Demo Scenario Details:');
    for (const scenario of scenarios) {
      console.log(`\n   ${scenario.name}:`);
      console.log(`   ${scenario.description}`);
      console.log('   Characteristics:');
      scenario.characteristics.forEach(char => {
        console.log(`   • ${char}`);
      });
    }
    console.log('');

    console.log('✅ Dataset generation complete!');
    console.log('📁 CSV files saved to: data/');
    console.log('');
    console.log('To seed the database, run: npm run seed:database');

  } catch (error) {
    console.error('❌ Error generating dataset:', error);
    process.exit(1);
  }
}

// Run the generator
generateDataset();
