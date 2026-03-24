import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const parsed = registerSchema.safeParse(body)

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

        const { name, email, password } = parsed.data

        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        })

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email đã được sử dụng',
                },
                { status: 409 }
            )
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        })

        return NextResponse.json(
            {
                success: true,
                message: 'Đăng ký tài khoản thành công',
                data: user,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('REGISTER_ERROR:', error)

        return NextResponse.json(
            {
                success: false,
                message: 'Đã có lỗi xảy ra ở máy chủ',
            },
            { status: 500 }
        )
    }
}