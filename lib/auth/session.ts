import { SessionOptions, getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  username?: string
  isLoggedIn: boolean
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'clothing-accounting-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)

  if (!session.isLoggedIn) {
    session.isLoggedIn = false
  }

  return session
}

export async function setSession(username: string) {
  const session = await getSession()
  session.username = username
  session.isLoggedIn = true
  await session.save()
}

export async function destroySession() {
  const session = await getSession()
  session.destroy()
}
