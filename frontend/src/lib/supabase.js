import { createClient } from '@supabase/supabase-js'

// Use environment variables for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchLatestRecap(context = 'weekly') {
  try {
    // First try to fetch from local weekly_summaries directory
    try {
      const timestamp = Date.now()
      
      // For season kickoff, prefer full data (includes roster details)
      // For other contexts, prefer trimmed data (reduces token usage)
      const preferFullData = context === 'season_kickoff'
      
      if (preferFullData) {
        // Try full data first for season kickoff
        let localResponse = await fetch(`/latest.json?t=${timestamp}`)
        if (localResponse.ok) {
          return await localResponse.json()
        }
        
        // Fallback to trimmed data
        localResponse = await fetch(`/latest_trimmed.json?t=${timestamp}`)
        if (localResponse.ok) {
          return await localResponse.json()
        }
      } else {
        // Try trimmed data first for other contexts
        let localResponse = await fetch(`/latest_trimmed.json?t=${timestamp}`)
        if (localResponse.ok) {
          return await localResponse.json()
        }
        
        // Fallback to full data
        localResponse = await fetch(`/latest.json?t=${timestamp}`)
        if (localResponse.ok) {
          return await localResponse.json()
        }
      }
      
      // Fallback to parent directory
      let localResponse = await fetch(`/weekly_summaries/latest_trimmed.json?t=${timestamp}`)
      if (localResponse.ok) {
        return await localResponse.json()
      }
      
      localResponse = await fetch(`/weekly_summaries/latest.json?t=${timestamp}`)
      if (localResponse.ok) {
        return await localResponse.json()
      }
    } catch (localError) {
      // Local fetch failed, will try Supabase
    }
    
    // Fallback to Supabase if local fetch fails
    const { data, error } = await supabase.storage
      .from('weekly_summaries')
      .download('latest.json')
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No data received from Supabase')
    }
    
    const jsonData = await data.text()
    
    try {
      return JSON.parse(jsonData)
    } catch (parseError) {
      throw new Error(`JSON Parse error: ${parseError.message}`)
    }
    
  } catch (error) {
    console.error('Failed to fetch latest recap:', error)
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
      throw error
    }
    
    return data
  } catch (error) {
    throw error
  }
}

// Save Commissar recap as text file
export async function saveCommissarRecap(recapText, week = 1) {
  try {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `commissar_recap_week_${week}_${timestamp}.md`
    
    const { data, error } = await supabase.storage
      .from('recaps')
      .upload(filename, recapText, {
        contentType: 'text/markdown',
        upsert: false // Don't overwrite existing files
      })
    
    if (error) {
      throw new Error(`Failed to save recap: ${error.message}`)
    }
    
    return { filename, data }
    
  } catch (error) {
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
      throw error
    }
    
    return data || []
  } catch (error) {
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
      throw error
    }
    
    const text = await data.text()
    return text
  } catch (error) {
    throw error
  }
} 