/**
 * Headless test script for OpenAI Commissar integration
 * This will help us debug the freezing issue without browser UI
 */

import OpenAI from 'openai'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
config({ path: './frontend/.env' })

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || 'your_openai_api_key_here',
})

// The Commissar prompt (same as in the frontend)
const COMMISSAR_PROMPT = `You are the "Commissar of Competitive Balance," a faux-authoritarian fantasy football commissioner who delivers weekly league recaps with satirical, over-the-top commentary. Your style is:

- **Authoritarian but incompetent**: You speak like a Soviet-era bureaucrat who takes fantasy football way too seriously
- **Satirical and dramatic**: Everything is a "crisis" or "victory for the people"
- **Markdown formatting**: Use headers, bold text, and bullet points for dramatic effect
- **Personalized commentary**: Reference specific managers by their REAL NAMES and team names
- **Over-the-top reactions**: Treat every win/loss like a major historical event
- **Mock official language**: Use bureaucratic jargon mixed with fantasy football terms

Your task: Analyze the provided fantasy football league data and create a weekly recap that focuses on:

1. **🏛️ League Status Report**: Dramatic overview of the week's events
2. **🔥 Hero of the Revolution**: Manager with the highest score (use their REAL NAME and team name)
3. **📉 Enemy of the State**: Manager with the lowest score (use their REAL NAME and team name)
4. **💥 Biggest Blowout**: Most lopsided victory with margin and REAL NAMES of both managers
5. **⚡ Closest Battle**: Tightest game with margin and REAL NAMES of both managers
6. **🎯 Best Manager**: Who scored the most points vs what they left on bench (use REAL NAME)
7. **🤦 Worst Manager**: Who left the most points on their bench (use REAL NAME)
8. **🧭 Team-by-Team Roundup**: Provide one concise bullet for each manager/team so all are mentioned
9. **📊 Fun Stats**: Any other interesting statistics from the week
10. **🎪 Next Week's Directive**: Dramatic predictions for upcoming matchups using REAL NAMES

**CRITICAL INSTRUCTIONS**: 
- Use the "real_name" field from the data instead of handles when available
- Always use team names when available, not just handles
- Make it personal and specific to the actual game outcomes
- Focus on the drama of the matchups and manager decisions
- Ensure balanced coverage without repeatedly highlighting the same teams; mention every manager at least once

Format your response in Markdown with dramatic headers, bold text for emphasis, and maintain the authoritarian commissar voice throughout.`

async function generateCommissarRecap(leagueData) {
  try {
    console.log('🤖 Calling OpenAI API...')
    
    // Check if API key is set
    const apiKey = process.env.VITE_OPENAI_API_KEY
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please check your .env file.')
    }

    console.log('📤 Sending data to OpenAI...')
    console.log('📊 Data structure:', Object.keys(leagueData))
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: COMMISSAR_PROMPT
        },
        {
          role: "user",
          content: `Generate a weekly fantasy football recap in the style of the Commissar of Competitive Balance. Focus on game outcomes, manager performance, and specific stats. Provide balanced coverage across ALL teams and include a team-by-team roundup (one bullet per team). Avoid over-focusing on the same teams. Here is the league data:\n\n${JSON.stringify(leagueData, null, 2)}`
        }
      ],
      temperature: 0.9,
      max_tokens: 10000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response received from OpenAI')
    }

    console.log('✅ OpenAI response received')
    console.log('📝 Response length:', response.length)
    console.log('📄 First 200 chars:', response.substring(0, 200))
    
    return response

  } catch (error) {
    console.error('❌ OpenAI API error:', error)
    
    // Provide a fallback response if OpenAI fails
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API key not configured. Please check your .env file.')
    } else if (error.message.includes('rate limit')) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a moment.')
    } else if (error.message.includes('quota')) {
      throw new Error('OpenAI quota exceeded. Please check your account.')
    } else {
      throw new Error(`OpenAI API error: ${error.message}`)
    }
  }
}

// Test with minimal data first
async function testMinimalData() {
  console.log('\n🧪 TESTING WITH MINIMAL DATA...')
  
  const testData = {
    week: 1,
    league: { name: "Test League" },
    stats: {
      top_score: { manager: "@alex", real_name: "Alex", team_name: "Alex's Aces", points: 150 },
      low_score: { manager: "@sam", real_name: "Sam", team_name: "Sam's Spartans", points: 100 }
    }
  }
  
  try {
    const recap = await generateCommissarRecap(testData)
    console.log('\n✅ MINIMAL TEST SUCCESSFUL!')
    console.log('\n📋 GENERATED RECAP:')
    console.log('='.repeat(50))
    console.log(recap)
    console.log('='.repeat(50))
    
    // Save to file
    const filename = `test_recap_${Date.now()}.md`
    fs.writeFileSync(filename, recap)
    console.log(`\n💾 Saved to: ${filename}`)
    
    return true
  } catch (error) {
    console.error('\n❌ MINIMAL TEST FAILED:', error.message)
    return false
  }
}

// Test with full league data
async function testFullData() {
  console.log('\n🏈 TESTING WITH FULL LEAGUE DATA...')
  
  try {
    // Read the latest data from weekly_summaries
    const latestFile = path.join('weekly_summaries', 'latest.json')
    if (!fs.existsSync(latestFile)) {
      console.log('⚠️ No latest.json found, running fetch script first...')
      
      // Run the fetch script
      const { execSync } = await import('child_process')
      execSync('npm run fetch', { stdio: 'inherit' })
    }
    
    const leagueData = JSON.parse(fs.readFileSync(latestFile, 'utf8'))
    console.log('📊 Loaded league data with', Object.keys(leagueData).length, 'top-level keys')
    
    const recap = await generateCommissarRecap(leagueData)
    console.log('\n✅ FULL TEST SUCCESSFUL!')
    console.log('\n📋 GENERATED RECAP:')
    console.log('='.repeat(50))
    console.log(recap)
    console.log('='.repeat(50))
    
    // Save to file
    const filename = `full_recap_${Date.now()}.md`
    fs.writeFileSync(filename, recap)
    console.log(`\n💾 Saved to: ${filename}`)
    
    return true
  } catch (error) {
    console.error('\n❌ FULL TEST FAILED:', error.message)
    return false
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting headless OpenAI tests...')
  console.log('🔑 API Key status:', process.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Not set')
  
  // Test 1: Minimal data
  const minimalSuccess = await testMinimalData()
  
  if (minimalSuccess) {
    // Test 2: Full data
    await testFullData()
  } else {
    console.log('\n❌ Skipping full data test due to minimal test failure')
  }
  
  console.log('\n🏁 Tests completed!')
}

// Run the tests
runTests().catch(console.error) 