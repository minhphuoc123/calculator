import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

const updateSettingsSchema = z.object({
    vatRate: z.number().min(0).max(1),
    corporateTaxRate: z.number().min(0).max(1),
})

export async function GET() {
    try {
        await requireUser()

        const setting = await prisma.appSetting.findFirst({
            select: {
                id: true,
                vatRate: true,
                corporateTaxRate: true,
                updatedAt: true,
            },
        })

        if (!setting) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Chưa có cấu hình hệ thống',
                },
                { status: 404 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                data: setting,
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
        await requireUser()

        const body = await request.json()
        const parsed = updateSettingsSchema.safeParse(body)

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

        const { vatRate, corporateTaxRate } = parsed.data

        const setting = await prisma.appSetting.findFirst()

        if (!setting) {
            const created = await prisma.appSetting.create({
                data: {
                    vatRate: new Prisma.Decimal(vatRate),
                    corporateTaxRate: new Prisma.Decimal(corporateTaxRate),
                },
                select: {
                    id: true,
                    vatRate: true,
                    corporateTaxRate: true,
                    updatedAt: true,
                },
            })

            return NextResponse.json(
                {
                    success: true,
                    message: 'Tạo cấu hình thành công',
                    data: created,
                },
                { status: 201 }
            )
        }

        const updated = await prisma.appSetting.update({
            where: { id: setting.id },
            data: {
                vatRate: new Prisma.Decimal(vatRate),
                corporateTaxRate: new Prisma.Decimal(corporateTaxRate),
            },
            select: {
                id: true,
                vatRate: true,
                corporateTaxRate: true,
                updatedAt: true,
            },
        })

        return NextResponse.json(
            {
                success: true,
                message: 'Cập nhật cấu hình thành công',
                data: updated,
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