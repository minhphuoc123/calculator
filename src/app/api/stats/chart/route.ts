import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const user = await requireUser()
        const { searchParams } = new URL(request.url)

        const year = Number(searchParams.get('year'))

        if (!year) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Thiếu tham số year',
                },
                { status: 400 }
            )
        }

        const start = new Date(year, 0, 1)
        const end = new Date(year, 11, 31, 23, 59, 59, 999)

        const records = await prisma.financialRecord.findMany({
            where: {
                userId: user.id,
                recordDate: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                recordDate: true,
                revenueBeforeVat: true,
                grossProfit: true,
                netProfit: true,
            },
            orderBy: {
                recordDate: 'asc',
            },
        })

        const monthlyData = Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            totalRevenueBeforeVat: new Prisma.Decimal(0),
            totalGrossProfit: new Prisma.Decimal(0),
            totalNetProfit: new Prisma.Decimal(0),
        }))

        for (const record of records) {
            const monthIndex = new Date(record.recordDate).getMonth()

            monthlyData[monthIndex].totalRevenueBeforeVat =
                monthlyData[monthIndex].totalRevenueBeforeVat.plus(record.revenueBeforeVat)

            monthlyData[monthIndex].totalGrossProfit =
                monthlyData[monthIndex].totalGrossProfit.plus(record.grossProfit)

            monthlyData[monthIndex].totalNetProfit =
                monthlyData[monthIndex].totalNetProfit.plus(record.netProfit)
        }

        return NextResponse.json(
            {
                success: true,
                data: monthlyData,
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