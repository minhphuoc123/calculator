import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('session_token')?.value

        if (!token) return null

        const payload = await verifySession(token)

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        if (!user || !user.isActive) return null

        return user
    } catch {
        return null
    }
}

export async function requireUser() {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('UNAUTHORIZED')
    }

    return user
}