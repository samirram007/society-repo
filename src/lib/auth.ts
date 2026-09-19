import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'society-erp-jwt-secret-key-2025'
)

const JWT_EXPIRY = '7d'

export interface TokenPayload extends JWTPayload {
  userId: number
  email: string
  role: string
  permissions?: string
}

// Generate JWT token
export async function generateToken(payload: {
  userId: number
  email: string
  role: string
  permissions?: string | null
}): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as TokenPayload
  } catch {
    return null
  }
}

// Authenticate user with email and password
export async function authenticateUser(email: string, password: string) {
  // Find user in users table
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    throw new Error('Invalid email or password')
  }

  // Verify password with bcrypt
  const isValidPassword = await bcrypt.compare(password, user.passwordHash)

  if (!isValidPassword) {
    throw new Error('Invalid email or password')
  }

  // Generate JWT token with real role
  const userRole = (user as any).role || 'member'
  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: userRole,
    permissions: (user as any).permissions || null,
  })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: userRole,
      permissions: (user as any).permissions || null,
      profileImage: user.profileImage || null,
    },
  }
}

// Get user from token
export async function getUserFromToken(token: string) {
  const payload = await verifyToken(token)
  if (!payload) return null

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1)

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: payload.role || 'member',
    permissions: payload.permissions || (user as any).permissions || null,
    profileImage: user.profileImage || null,
  }
}
