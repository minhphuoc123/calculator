import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

import { prisma } from '@/lib/prisma'
import { signSession } from '@/lib/session'
import { loginSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const parsed = loginSchema.safeParse(body)

        if (!parsed.success) {
            const errors = parsed.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            }))

            return NextResponse.json(
                {
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors,
                },
                { status: 400 }
            )
        }

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                passwordHash: true,
                isActive: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng',
                },
                { status: 401 }
            )
        }

        if (!user.isActive) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Tài khoản đã bị khóa',
                },
                { status: 403 }
            )
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng',
                },
                { status: 401 }
            )
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        })

        const token = await signSession({
            userId: user.id,
            email: user.email,
            name: user.name,
        })

        const response = NextResponse.json(
            {
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            { status: 200 }
        )

        response.cookies.set({
            name: 'session_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        })

        return response
    } catch (error) {
        console.error('LOGIN_ERROR:', error)

        return NextResponse.json(
            {
                success: false,
                message: 'Đã có lỗi xảy ra ở máy chủ',
            },
            { status: 500 }
        )
    }
}