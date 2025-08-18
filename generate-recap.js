#!/usr/bin/env node

/**
 * Simple script to generate a Commissar analysis from the command line
 * Usage: node generate-recap.js [context]
 * Contexts: draft, pre-season, weekly (default)
 */

import OpenAI from 'openai'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { getPromptForContext } from './prompts.js'

// Load environment variables
config({ path: './frontend/.env' })

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || 'your_openai_api_key_here',
})

async function generateCommissarAnalysis(leagueData, context = 'weekly') {
  try {
    console.log(`🤖 Calling OpenAI API for ${context} analysis...`)
    
    const apiKey = process.env.VITE_OPENAI_API_KEY
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please check your .env file.')
    }

    const prompt = getPromptForContext(context)
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: `Generate a ${context} fantasy football analysis in the style of the Commissar of Competitive Balance. Focus on the specific context and always call out Riky and Levi by name. Here is the league data:\n\n${JSON.stringify(leagueData, null, 2)}`
        }
      ],
      temperature: 0.8,
      max_tokens: 1500
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response received from OpenAI')
    }

    return response

  } catch (error) {
    console.error('❌ OpenAI API error:', error)
    throw error
  }
}

async function main() {
  try {
    // Get context from command line argument
    const context = process.argv[2] || 'weekly'
    console.log(`🚀 Generating Commissar ${context.toUpperCase()} Analysis...`)
    
    // Check if latest.json exists
    const latestFile = path.join('weekly_summaries', 'latest.json')
    if (!fs.existsSync(latestFile)) {
      console.log('⚠️ No latest.json found, running fetch script first...')
      
      // Run the fetch script
      const { execSync } = await import('child_process')
      execSync('npm run fetch', { stdio: 'inherit' })
    }
    
    // Load league data
    const leagueData = JSON.parse(fs.readFileSync(latestFile, 'utf8'))
    console.log(`📊 Loaded league data for Week ${leagueData.week}`)
    
    // Generate analysis
    const analysis = await generateCommissarAnalysis(leagueData, context)
    
    // Save to file with timestamp and context
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `commissar_${context}_week${leagueData.week}_${timestamp}.md`
    fs.writeFileSync(filename, analysis)
    
    console.log(`\n✅ ${context.toUpperCase()} ANALYSIS GENERATED SUCCESSFULLY!`)
    console.log(`💾 Saved to: ${filename}`)
    console.log('\n📋 PREVIEW:')
    console.log('='.repeat(60))
    console.log(analysis.substring(0, 500) + '...')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main() 