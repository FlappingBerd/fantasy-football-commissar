import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkmyrnlnodstltxkesfm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbXlybmxub2RzdGx0eGtlc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODIzOTAsImV4cCI6MjA3MTA1ODM5MH0.XUaKJCJcZoxGnwWWwCab-YWYY0gS-lQ3qYsyufYsYso'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupRecapsBucket() {
  try {
    console.log('🔧 Setting up recaps bucket...')
    
    // Try to upload a test file to create the bucket
    const testContent = '# Test Commissar Recap\n\nThis is a test file to create the recaps bucket.'
    const testFilename = 'test_recap.md'
    
    console.log('📁 Attempting to create recaps bucket...')
    
    const { data, error } = await supabase.storage
      .from('recaps')
      .upload(testFilename, testContent, {
        contentType: 'text/markdown',
        upsert: true
      })
    
    if (error) {
      if (error.message.includes('Bucket not found')) {
        console.log('❌ Recaps bucket does not exist')
        console.log('💡 You need to create the "recaps" bucket in your Supabase dashboard:')
        console.log('   1. Go to Storage in your Supabase dashboard')
        console.log('   2. Click "Create a new bucket"')
        console.log('   3. Name it: recaps')
        console.log('   4. Make it public')
        console.log('   5. Run this script again')
      } else {
        console.error('❌ Error:', error.message)
      }
    } else {
      console.log('✅ Recaps bucket setup successful!')
      console.log('📄 Test file uploaded:', testFilename)
      
      // Clean up test file
      await supabase.storage.from('recaps').remove([testFilename])
      console.log('🧹 Test file cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

setupRecapsBucket() 