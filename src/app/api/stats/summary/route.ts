import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

function getMonthRange(year: number, month: number) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59, 999)
    return { start, end }
}

function getQuarterRange(year: number, quarter: number) {
    const startMonth = (quarter - 1) * 3
    const start = new Date(year, startMonth, 1)
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999)
    return { start, end }
}

function getYearRange(year: number) {
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31, 23, 59, 59, 999)
    return { start, end }
}

export async function GET(request: Request) {
    try {
        const user = await requireUser()
        const { searchParams } = new URL(request.url)

        const type = searchParams.get('type')
        const year = Number(searchParams.get('year'))
        const month = Number(searchParams.get('month'))
        const quarter = Number(searchParams.get('quarter'))

        if (!type || !year || !['month', 'quarter', 'year'].includes(type)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Thiếu hoặc sai tham số type/year',
                },
                { status: 400 }
            )
        }

        let range: { start: Date; end: Date }

        if (type === 'month') {
            if (!month || month < 1 || month > 12) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Tham số month không hợp lệ',
                    },
                    { status: 400 }
                )
            }
            range = getMonthRange(year, month)
        } else if (type === 'quarter') {
            if (!quarter || quarter < 1 || quarter > 4) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Tham số quarter không hợp lệ',
                    },
                    { status: 400 }
                )
            }
            range = getQuarterRange(year, quarter)
        } else {
            range = getYearRange(year)
        }

        const result = await prisma.financialRecord.aggregate({
            where: {
                userId: user.id,
                recordDate: {
                    gte: range.start,
                    lte: range.end,
                },
            },
            _sum: {
                revenueBeforeVat: true,
                costBeforeVat: true,
                grossProfit: true,
                vatAmount: true,
                corporateTaxAmount: true,
                netProfit: true,
            },
            _count: {
                id: true,
            },
        })

        return NextResponse.json(
            {
                success: true,
                data: {
                    type,
                    year,
                    month: type === 'month' ? month : null,
                    quarter: type === 'quarter' ? quarter : null,
                    totalRecords: result._count.id,
                    totalRevenueBeforeVat: result._sum.revenueBeforeVat ?? new Prisma.Decimal(0),
                    totalCostBeforeVat: result._sum.costBeforeVat ?? new Prisma.Decimal(0),
                    totalGrossProfit: result._sum.grossProfit ?? new Prisma.Decimal(0),
                    totalVatAmount: result._sum.vatAmount ?? new Prisma.Decimal(0),
                    totalCorporateTaxAmount:
                        result._sum.corporateTaxAmount ?? new Prisma.Decimal(0),
                    totalNetProfit: result._sum.netProfit ?? new Prisma.Decimal(0),
                },
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