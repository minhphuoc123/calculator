import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

const updateProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .max(100, 'Họ tên không được quá 100 ký tự'),
})

export async function GET() {
    try {
        const user = await requireUser()

        return NextResponse.json(
            {
                success: true,
                data: user,
            },
            { status: 200 }
        )
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json(
                { success: false, message: 'Chưa đăng nhập' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Đã có lỗi xảy ra ở máy chủ' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const user = await requireUser()
        const body = await request.json()

        const parsed = updateProfileSchema.safeParse(body)

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

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: parsed.data.name,
            },
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

        return NextResponse.json(
            {
                success: true,
                message: 'Cập nhật hồ sơ thành công',
                data: updatedUser,
            },
            { status: 200 }
        )
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json(
                { success: false, message: 'Chưa đăng nhập' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Đã có lỗi xảy ra ở máy chủ' },
            { status: 500 }
        )
    }
}