import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://fkmyrnlnodstltxkesfm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbXlybmxub2RzdGx0eGtlc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODIzOTAsImV4cCI6MjA3MTA1ODM5MH0.XUaKJCJcZoxGnwWWwCab-YWYY0gS-lQ3qYsyufYsYso'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function uploadLatestData() {
  try {
    // Read the latest JSON file from weekly_summaries
    const summariesDir = path.join(process.cwd(), 'weekly_summaries')
    const files = fs.readdirSync(summariesDir).filter(file => file.endsWith('.json'))
    
    if (files.length === 0) {
      console.log('❌ No JSON files found in weekly_summaries directory')
      return
    }
    
    // Get the most recent file
    const latestFile = files.sort().reverse()[0]
    const filePath = path.join(summariesDir, latestFile)
    const jsonData = fs.readFileSync(filePath, 'utf8')
    
    console.log(`📁 Uploading ${latestFile} to Supabase...`)
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('weekly_summaries')
      .upload('latest.json', jsonData, {
        contentType: 'application/json',
        upsert: true
      })
    
    if (error) {
      console.error('❌ Error uploading to Supabase:', error)
      return
    }
    
    console.log('✅ Successfully uploaded to Supabase!')
    console.log('📊 File available at: latest.json in weekly_summaries bucket')
    
  } catch (error) {
    console.error('❌ Failed to upload:', error)
  }
}

uploadLatestData() 