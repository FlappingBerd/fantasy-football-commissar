#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const config = require('./config');

console.log('🧪 Fantasy Weekly Updates - Test Script\n');

// Check if fetch script exists
const fetchScriptPath = path.join(__dirname, 'scripts', 'fetch_sleeper_week.js');
if (fs.existsSync(fetchScriptPath)) {
  console.log('✅ fetch_sleeper_week.js found in scripts/ directory');
} else {
  console.log('❌ fetch_sleeper_week.js not found in scripts/ directory');
  console.log('   Please add your fetch script to the scripts/ folder');
}

// Check configuration
console.log('\n📋 Configuration Check:');
console.log(`   League ID: ${config.SLEEPER_LEAGUE_ID}`);
console.log(`   Discord Webhook: ${config.DISCORD_WEBHOOK_URL ? 'Configured' : 'Not configured'}`);
console.log(`   Timezone: ${config.TIMEZONE}`);
console.log(`   Schedule: ${config.SCHEDULE_TIME}`);

// Check if weekly_summaries directory exists
const summariesDir = path.join(__dirname, 'weekly_summaries');
if (fs.existsSync(summariesDir)) {
  console.log('✅ weekly_summaries directory exists');
} else {
  console.log('❌ weekly_summaries directory missing');
}

// Check package.json dependencies
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['node-cron', 'axios', 'commander'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length === 0) {
    console.log('✅ All required dependencies found in package.json');
  } else {
    console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
    console.log('   Run: npm install');
  }
} else {
  console.log('❌ package.json not found');
}

console.log('\n🚀 Next Steps:');
console.log('1. Add your fetch_sleeper_week.js to the scripts/ directory');
console.log('2. Update your League ID in config.js');
console.log('3. Run: npm install');
console.log('4. Test with: npm run fetch -- --league YOUR_LEAGUE_ID');
console.log('5. Start scheduler with: npm start');

console.log('\n📚 For more help, see README.md'); 