import { createClient } from '@supabase/supabase-js'
import type { RequestHandler } from 'express'

// Typ-Erweiterung für Express-Request: fügt req.user hinzu
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://ycfbegvjeviovbglbrdy.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZmJlZ3ZqZXZpb3ZiZ2xicmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjUyOTEsImV4cCI6MjA2NDA0MTI5MX0.vpTfW9Z2k6uwZRk-bI7pBD-V-rAA6uwnl53mscDqa7c'

console.log('🔧 Supabase config:', {
  url: supabaseUrl,
  anonKeyLength: supabaseAnonKey?.length || 0,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  envUrl: process.env.SUPABASE_URL,
  envKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
  timestamp: new Date().toISOString(),
  debug: true
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAuth: RequestHandler = async (req, res, next) => {
  try {
    console.log('🔧 SupabaseAuth middleware called');
    console.log('🔧 Headers:', req.headers.authorization ? 'Authorization header present' : 'No authorization header');
    
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔴 No valid authorization header');
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    console.log('🔧 Token length:', token.length);
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error) {
      console.error('🔴 Supabase getUser error:', error)
      return res.status(401).json({ message: 'Unauthorized', error: error.message })
    }
    
    if (!user) {
      console.error('🔴 No user returned from Supabase')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    req.user = user
    
    // Ensure user exists in our database for every authenticated request
    const { storage } = await import('./storage')
    try {
      console.log(`🔧 SupabaseAuth: Ensuring user exists in database: ${user.id}`);
      const dbUser = await storage.upsertUser({
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.full_name?.split(' ')[0] || null,
        lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: user.user_metadata?.avatar_url || null,
      });
      console.log(`🔧 SupabaseAuth: User ensured in database:`, { id: dbUser.id, email: dbUser.email, username: dbUser.username });
    } catch (dbError) {
      console.error('🔴 SupabaseAuth: Error creating/updating user in database:', dbError);
      // Don't fail the auth request if user creation fails
      // The client can handle this gracefully
    }
    
    next()
  } catch (error) {
    console.error('Supabase auth error:', error)
    return res.status(401).json({ message: 'Unauthorized' })
  }
}
