import { SignJWT, jwtVerify } from 'jose'

const secret = process.env.AUTH_SECRET

if (!secret) {
  throw new Error('AUTH_SECRET is not set')
}

const secretKey = new TextEncoder().encode(secret)

export type SessionPayload = {
  userId: string
  email: string
  name: string
}

export async function signSession(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secretKey)
  return payload as unknown as SessionPayload
}