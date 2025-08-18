import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkmyrnlnodstltxkesfm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbXlybmxub2RzdGx0eGtlc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODIzOTAsImV4cCI6MjA3MTA1ODM5MH0.XUaKJCJcZoxGnwWWwCab-YWYY0gS-lQ3qYsyufYsYso'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupStoragePolicies() {
  try {
    console.log('🔧 Setting up storage policies...')
    
    // Enable RLS but allow public read access
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Allow public read access to weekly_summaries bucket
        CREATE POLICY "Public read access" ON storage.objects
        FOR SELECT USING (bucket_id = 'weekly_summaries');
        
        -- Allow authenticated users to upload
        CREATE POLICY "Authenticated users can upload" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'weekly_summaries' AND auth.role() = 'authenticated');
        
        -- Allow authenticated users to update
        CREATE POLICY "Authenticated users can update" ON storage.objects
        FOR UPDATE USING (bucket_id = 'weekly_summaries' AND auth.role() = 'authenticated');
      `
    })
    
    if (error) {
      console.log('⚠️  Policies might already exist, trying alternative approach...')
      
      // Try to upload directly with public bucket
      console.log('📁 Attempting direct upload...')
      const uploadResult = await supabase.storage
        .from('weekly_summaries')
        .upload('latest.json', '{"test": "data"}', {
          contentType: 'application/json',
          upsert: true
        })
      
      if (uploadResult.error) {
        console.error('❌ Still having permission issues:', uploadResult.error)
        console.log('💡 You may need to manually configure bucket permissions in the Supabase dashboard')
      } else {
        console.log('✅ Upload successful!')
      }
    } else {
      console.log('✅ Storage policies configured successfully!')
    }
    
  } catch (error) {
    console.error('❌ Error setting up policies:', error)
    console.log('💡 You may need to manually configure bucket permissions in the Supabase dashboard')
  }
}

setupStoragePolicies() 