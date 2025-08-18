import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Use the same credentials as the frontend
const supabaseUrl = 'https://fkmyrnlnodstltxkesfm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbXlybmxub2RzdGx0eGtlc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODIzOTAsImV4cCI6MjA3MTA1ODM5MH0.XUaKJCJcZoxGnwWWwCab-YWYY0gS-lQ3qYsyufYsYso'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function uploadFile(bucket, filePath, destinationPath) {
  try {
    const fileContent = fs.readFileSync(filePath)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(destinationPath, fileContent, {
        upsert: true,
        contentType: path.extname(filePath) === '.json' ? 'application/json' : 'text/markdown'
      })

    if (error) {
      console.error(`❌ Error uploading ${filePath}:`, error.message)
      return false
    }

    console.log(`✅ Uploaded ${filePath} to ${bucket}/${destinationPath}`)
    return true
  } catch (err) {
    console.error(`❌ Error reading ${filePath}:`, err.message)
    return false
  }
}

async function uploadEssentialFiles() {
  console.log('🚀 Uploading essential files to Supabase...\n')

  const filesToUpload = [
    // Data files
    { local: 'weekly_summaries/latest.json', bucket: 'weekly_summaries', remote: 'latest.json' },
    { local: 'weekly_summaries/post_draft_20250817_220605.json', bucket: 'weekly_summaries', remote: 'post_draft_20250817_220605.json' },
    
    // Sample data for documentation
    { local: 'sample-data.json', bucket: 'weekly_summaries', remote: 'sample-data.json' },
    
    // Generated recaps (most recent ones)
    { local: 'commissar_draft_week1_2025-08-18T03-26-49-715Z.md', bucket: 'recaps', remote: 'draft_analysis.md' },
    { local: 'commissar_pre-season_week1_2025-08-18T03-13-04-165Z.md', bucket: 'recaps', remote: 'pre_season_preview.md' },
    { local: 'commissar_weekly_week1_2025-08-18T03-16-05-848Z.md', bucket: 'recaps', remote: 'weekly_recap.md' }
  ]

  let successCount = 0
  let totalCount = filesToUpload.length

  for (const file of filesToUpload) {
    if (fs.existsSync(file.local)) {
      const success = await uploadFile(file.bucket, file.local, file.remote)
      if (success) successCount++
    } else {
      console.log(`⚠️  File not found: ${file.local}`)
    }
  }

  console.log(`\n📊 Upload Summary:`)
  console.log(`✅ Successfully uploaded: ${successCount}/${totalCount} files`)
  
  if (successCount === totalCount) {
    console.log('🎉 All essential files uploaded successfully!')
  } else {
    console.log('⚠️  Some files were not uploaded. Check the errors above.')
  }

  // List files in buckets
  console.log('\n📁 Checking bucket contents...')
  
  try {
    const { data: weeklyFiles, error: weeklyError } = await supabase.storage
      .from('weekly_summaries')
      .list('', { limit: 10 })
    
    if (!weeklyError && weeklyFiles) {
      console.log('📊 weekly_summaries bucket:')
      weeklyFiles.forEach(file => console.log(`  - ${file.name}`))
    }

    const { data: recapFiles, error: recapError } = await supabase.storage
      .from('recaps')
      .list('', { limit: 10 })
    
    if (!recapError && recapFiles) {
      console.log('📝 recaps bucket:')
      recapFiles.forEach(file => console.log(`  - ${file.name}`))
    }
  } catch (err) {
    console.log('⚠️  Could not list bucket contents:', err.message)
  }
}

uploadEssentialFiles().catch(console.error) 