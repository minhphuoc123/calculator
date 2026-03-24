import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(8, 'Mật khẩu hiện tại phải có ít nhất 8 ký tự')
            .max(72, 'Mật khẩu hiện tại không được quá 72 ký tự'),
        newPassword: z
            .string()
            .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
            .max(72, 'Mật khẩu mới không được quá 72 ký tự'),
        confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        path: ['confirmNewPassword'],
        message: 'Mật khẩu xác nhận không khớp',
    })

export async function PUT(request: Request) {
    try {
        const user = await requireUser()
        const body = await request.json()

        const parsed = changePasswordSchema.safeParse(body)

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

        const { currentPassword, newPassword } = parsed.data

        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                passwordHash: true,
            },
        })

        if (!existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Người dùng không tồn tại',
                },
                { status: 404 }
            )
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            existingUser.passwordHash
        )

        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng',
                },
                { status: 400 }
            )
        }

        const isSamePassword = await bcrypt.compare(
            newPassword,
            existingUser.passwordHash
        )

        if (isSamePassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Mật khẩu mới không được trùng mật khẩu hiện tại',
                },
                { status: 400 }
            )
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 12)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
            },
        })

        return NextResponse.json(
            {
                success: true,
                message: 'Đổi mật khẩu thành công',
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