import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkmyrnlnodstltxkesfm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbXlybmxub2RzdGx0eGtlc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODIzOTAsImV4cCI6MjA3MTA1ODM5MH0.XUaKJCJcZoxGnwWWwCab-YWYY0gS-lQ3qYsyufYsYso'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixStorage() {
  try {
    console.log('🔧 Fixing storage permissions...')
    
    // Try to create a public policy that allows all operations
    const { data, error } = await supabase
      .from('storage.objects')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('Testing connection...')
    }
    
    // Try to upload with a different approach
    console.log('📁 Attempting upload with public bucket...')
    
    // First, let's try to list the bucket to see if we can access it
    const { data: listData, error: listError } = await supabase.storage
      .from('weekly_summaries')
      .list()
    
    if (listError) {
      console.log('❌ Cannot list bucket:', listError.message)
      console.log('💡 The bucket needs to be configured as public')
    } else {
      console.log('✅ Can access bucket, trying upload...')
      
      // Try upload
      const uploadResult = await supabase.storage
        .from('weekly_summaries')
        .upload('test.json', '{"test": "data"}', {
          contentType: 'application/json',
          upsert: true
        })
      
      if (uploadResult.error) {
        console.log('❌ Upload failed:', uploadResult.error.message)
        console.log('🔧 Need to configure bucket permissions')
      } else {
        console.log('✅ Upload successful!')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixStorage() 