const cron = require('node-cron');
const { exec } = require('child_process');
const config = require('./config');

console.log('🧪 Testing Scheduler...\n');

// Test the fetch command
console.log('📡 Testing fetch command...');
const command = `node scripts/fetch_sleeper_week.js --league=${config.SLEEPER_LEAGUE_ID}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`⚠️  Stderr: ${stderr}`);
  }

  try {
    const data = JSON.parse(stdout);
    console.log('✅ Fetch command works!');
    console.log(`📊 League: ${data.league.name}`);
    console.log(`📅 Week: ${data.week}`);
    console.log(`👥 Teams: ${data.users.length}`);
    
    // Test the formatting function
    const { formatWeeklyMessage } = require('./schedule');
    const message = formatWeeklyMessage(data);
    console.log('\n📝 Formatted Message:');
    console.log(message);
    
    console.log('\n🎉 All tests passed! Your automated workflow is ready.');
    
  } catch (parseError) {
    console.error('❌ Failed to parse JSON output:', parseError.message);
  }
}); 