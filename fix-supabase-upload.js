import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://fkmyrnlnodstltxkesfm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbXlybmxub2RzdGx0eGtlc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODIzOTAsImV4cCI6MjA3MTA1ODM5MH0.XUaKJCJcZoxGnwWWwCab-YWYY0gS-lQ3qYsyufYsYso'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function uploadCleanData() {
  try {
    console.log('📁 Reading clean JSON data...')
    
    // Read the clean JSON file
    const jsonPath = path.join('weekly_summaries', 'latest.json')
    const jsonData = fs.readFileSync(jsonPath, 'utf8')
    
    // Parse to validate it's clean JSON
    const parsed = JSON.parse(jsonData)
    console.log('✅ JSON is valid, contains:', Object.keys(parsed))
    console.log('👥 Number of users:', parsed.users?.length || 0)
    console.log('🏈 Number of rosters:', parsed.rosters?.length || 0)
    
    console.log('📤 Uploading clean data to Supabase...')
    
    const { data, error } = await supabase.storage
      .from('weekly_summaries')
      .upload('latest.json', jsonData, {
        contentType: 'application/json',
        upsert: true // Overwrite existing file
      })
    
    if (error) {
      console.error('❌ Upload error:', error)
      throw error
    }
    
    console.log('✅ Successfully uploaded clean data to Supabase!')
    console.log('📊 File available at: latest.json in weekly_summaries bucket')
    
  } catch (error) {
    console.error('❌ Failed to upload clean data:', error)
    process.exit(1)
  }
}

uploadCleanData() 