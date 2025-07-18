import type { RequestHandler } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { storage } from './storage'
import type { User } from '../shared/schema'

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface LocalAuthUser {
  id: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  subscriptionStatus?: string
}

export const localAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const user = await storage.getUser(decoded.userId)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: {
        full_name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null,
        avatar_url: user.profileImageUrl
      }
    }
    
    next()
  } catch (error) {
    console.error('Local auth error:', error)
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

export const signInWithEmail = async (email: string, password: string): Promise<{ user: LocalAuthUser; token: string }> => {
  const user = await storage.getUserByEmail(email)
  if (!user) {
    throw new Error('Invalid email or password')
  }

  // For demo purposes, we'll skip password verification
  // In production, you'd hash passwords and verify them here
  const isValid = await bcrypt.compare(password, user.password || 'demo-password')
  if (!isValid && password !== 'demo') {
    throw new Error('Invalid email or password')
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  
  return {
    user: {
      id: user.id,
      email: user.email!,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      profileImageUrl: user.profileImageUrl || undefined,
      subscriptionStatus: user.subscriptionStatus || 'free'
    },
    token
  }
}

export const signUpWithEmail = async (email: string, password: string): Promise<{ user: LocalAuthUser; token: string }> => {
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(email)
  if (existingUser) {
    throw new Error('User already exists')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Create user
  const userId = generateUserId()
  const newUser = await storage.upsertUser({
    id: userId,
    email,
    password: hashedPassword,
    subscriptionStatus: 'free'
  })

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
  
  return {
    user: {
      id: userId,
      email,
      subscriptionStatus: 'free'
    },
    token
  }
}

function generateUserId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}