import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkmyrnlnodstltxkesfm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbXlybmxub2RzdGx0eGtlc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODIzOTAsImV4cCI6MjA3MTA1ODM5MH0.XUaKJCJcZoxGnwWWwCab-YWYY0gS-lQ3qYsyufYsYso'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchLatestRecap() {
  try {
    console.log('🔍 Attempting to fetch from local weekly_summaries...')
    
    // First try to fetch from local weekly_summaries directory
    try {
      const timestamp = Date.now()
      
      // Try trimmed data first (reduces token usage)
      let localResponse = await fetch(`/latest_trimmed.json?t=${timestamp}`)
      if (localResponse.ok) {
        const localData = await localResponse.json()
        console.log('✅ Successfully loaded trimmed data from public directory')
        console.log('📊 Local data structure:', Object.keys(localData))
        console.log('👥 Users:', localData.users?.length || 0)
        console.log('🏈 Rosters:', localData.rosters?.length || 0)
        console.log('⚔️ Matchups:', localData.matchups?.length || 0)
        return localData
      }
      
      // Fallback to full data
      localResponse = await fetch(`/latest.json?t=${timestamp}`)
      if (localResponse.ok) {
        const localData = await localResponse.json()
        console.log('✅ Successfully loaded full data from public directory')
        console.log('📊 Local data structure:', Object.keys(localData))
        console.log('👥 Users:', localData.users?.length || 0)
        console.log('🏈 Rosters:', localData.rosters?.length || 0)
        console.log('⚔️ Matchups:', localData.matchups?.length || 0)
        return localData
      }
      
      // Fallback to parent directory
      localResponse = await fetch(`/weekly_summaries/latest_trimmed.json?t=${timestamp}`)
      if (localResponse.ok) {
        const localData = await localResponse.json()
        console.log('✅ Successfully loaded trimmed data from parent directory')
        console.log('📊 Local data structure:', Object.keys(localData))
        console.log('👥 Users:', localData.users?.length || 0)
        console.log('🏈 Rosters:', localData.rosters?.length || 0)
        console.log('⚔️ Matchups:', localData.matchups?.length || 0)
        return localData
      }
      
      localResponse = await fetch(`/weekly_summaries/latest.json?t=${timestamp}`)
      if (localResponse.ok) {
        const localData = await localResponse.json()
        console.log('✅ Successfully loaded full data from parent directory')
        console.log('📊 Local data structure:', Object.keys(localData))
        console.log('👥 Users:', localData.users?.length || 0)
        console.log('🏈 Rosters:', localData.rosters?.length || 0)
        console.log('⚔️ Matchups:', localData.matchups?.length || 0)
        return localData
      }
    } catch (localError) {
      console.log('⚠️ Local fetch failed, trying Supabase:', localError.message)
    }
    
    // Fallback to Supabase if local fetch fails
    console.log('🔍 Fetching from Supabase storage...')
    
    const { data, error } = await supabase.storage
      .from('weekly_summaries')
      .download('latest.json')
    
    if (error) {
      console.error('❌ Supabase error:', error)
      throw new Error(`Supabase error: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No data received from Supabase')
    }
    
    console.log('📄 Received data from Supabase, parsing JSON...')
    const jsonData = await data.text()
    console.log('📄 Raw data preview:', jsonData.substring(0, 100) + '...')
    
    try {
      const parsed = JSON.parse(jsonData)
      console.log('✅ JSON parsed successfully from Supabase')
      return parsed
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('📄 Raw data that failed to parse:', jsonData)
      throw new Error(`JSON Parse error: ${parseError.message}`)
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch latest recap:', error)
    throw error
  }
}

export async function uploadRecap(jsonData) {
  try {
    const { data, error } = await supabase.storage
      .from('weekly_summaries')
      .upload('latest.json', JSON.stringify(jsonData, null, 2), {
        contentType: 'application/json',
        upsert: true
      })
    
    if (error) {
      console.error('Error uploading recap:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Failed to upload recap:', error)
    throw error
  }
}

// Save Commissar recap as text file
export async function saveCommissarRecap(recapText, week = 1) {
  try {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `commissar_recap_week_${week}_${timestamp}.md`
    
    console.log('💾 Saving Commissar recap to Supabase...')
    
    const { data, error } = await supabase.storage
      .from('recaps')
      .upload(filename, recapText, {
        contentType: 'text/markdown',
        upsert: false // Don't overwrite existing files
      })
    
    if (error) {
      console.error('❌ Error saving recap:', error)
      throw new Error(`Failed to save recap: ${error.message}`)
    }
    
    console.log('✅ Recap saved successfully:', filename)
    return { filename, data }
    
  } catch (error) {
    console.error('❌ Failed to save recap:', error)
    throw error
  }
}

// List all saved recaps
export async function listSavedRecaps() {
  try {
    const { data, error } = await supabase.storage
      .from('recaps')
      .list()
    
    if (error) {
      console.error('❌ Error listing recaps:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Failed to list recaps:', error)
    throw error
  }
}

// Download a specific recap
export async function downloadRecap(filename) {
  try {
    const { data, error } = await supabase.storage
      .from('recaps')
      .download(filename)
    
    if (error) {
      console.error('❌ Error downloading recap:', error)
      throw error
    }
    
    const text = await data.text()
    return text
  } catch (error) {
    console.error('❌ Failed to download recap:', error)
    throw error
  }
} 