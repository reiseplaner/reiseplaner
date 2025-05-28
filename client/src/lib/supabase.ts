import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ycfbegvjeviovbglbrdy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZmJlZ3ZqZXZpb3ZiZ2xicmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjUyOTEsImV4cCI6MjA2NDA0MTI5MX0.vpTfW9Z2k6uwZRk-bI7pBD-V-rAA6uwnl53mscDqa7c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})