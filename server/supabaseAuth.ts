import { createClient } from '@supabase/supabase-js'
import type { RequestHandler } from 'express'

const supabaseUrl = 'https://ycfbegvjeviovbglbrdy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZmJlZ3ZqZXZpb3ZiZ2xicmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjUyOTEsImV4cCI6MjA2NDA0MTI5MX0.vpTfW9Z2k6uwZRk-bI7pBD-V-rAA6uwnl53mscDqa7c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Supabase auth error:', error)
    return res.status(401).json({ message: 'Unauthorized' })
  }
}