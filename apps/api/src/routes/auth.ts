import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { OAuth2Client } from 'google-auth-library'

const authApp = new Hono()

const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is not set')
  }
  return new OAuth2Client(clientId)
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return secret
}

const getAllowedEmails = (): string[] => {
  const emails = process.env.ADMIN_EMAILS || ''
  return emails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

// POST /api/auth/google — Verify Google ID Token and issue JWT
authApp.post('/google', async (c) => {
  try {
    const { credential } = await c.req.json<{ credential: string }>()

    if (!credential) {
      return c.json({ error: 'Missing credential' }, 400)
    }

    const client = getGoogleClient()
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      return c.json({ error: 'Invalid token payload' }, 401)
    }

    // Allow any valid Google email to login (per user request)

    // Sign JWT token
    const jwtSecret = getJwtSecret()
    const now = Math.floor(Date.now() / 1000)
    const token = await sign(
      {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        iat: now,
        exp: now + 60 * 60 * 24 * 7, // 7 days
      },
      jwtSecret,
      'HS256'
    )

    return c.json({
      token,
      user: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    })
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
})

// GET /api/auth/verify — Verify JWT token
authApp.get('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401)
    }

    const token = authHeader.substring(7)
    const jwtSecret = getJwtSecret()
    const payload = await verify(token, jwtSecret, 'HS256')

    return c.json({
      valid: true,
      user: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    })
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
})

export default authApp
