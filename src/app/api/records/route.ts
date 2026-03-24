import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { createRecordSchema } from '@/lib/validations/record'

export async function GET(request: Request) {
    try {
        const user = await requireUser()
        const { searchParams } = new URL(request.url)

        const fromDate = searchParams.get('fromDate')
        const toDate = searchParams.get('toDate')
        const packageTypeId = searchParams.get('packageTypeId')
        const keyword = searchParams.get('keyword')

        const where: Prisma.FinancialRecordWhereInput = {
            userId: user.id,
        }

        if (fromDate || toDate) {
            where.recordDate = {}

            if (fromDate) {
                where.recordDate.gte = new Date(fromDate)
            }

            if (toDate) {
                const endDate = new Date(toDate)
                endDate.setHours(23, 59, 59, 999)
                where.recordDate.lte = endDate
            }
        }

        if (packageTypeId) {
            where.packageTypeId = packageTypeId
        }

        if (keyword) {
            where.note = {
                contains: keyword,
                mode: 'insensitive',
            }
        }

        const records = await prisma.financialRecord.findMany({
            where,
            orderBy: {
                recordDate: 'desc',
            },
            select: {
                id: true,
                recordDate: true,
                revenueBeforeVat: true,
                costBeforeVat: true,
                grossProfit: true,
                vatAmount: true,
                corporateTaxAmount: true,
                netProfit: true,
                note: true,
                createdAt: true,
                updatedAt: true,
                packageType: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        })

        return NextResponse.json(
            {
                success: true,
                data: records,
            },
            { status: 200 }
        )
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Chưa đăng nhập',
                },
                { status: 401 }
            )
        }

        console.error('GET_RECORDS_ERROR:', error)

        return NextResponse.json(
            {
                success: false,
                message: 'Đã có lỗi xảy ra ở máy chủ',
            },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireUser()
        const body = await request.json()

        const parsed = createRecordSchema.safeParse(body)

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

        const { recordDate, packageTypeId, revenueBeforeVat, costBeforeVat, note } =
            parsed.data

        const packageType = await prisma.packageType.findFirst({
            where: {
                id: packageTypeId,
                isActive: true,
            },
            select: {
                id: true,
                code: true,
                name: true,
            },
        })

        if (!packageType) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Gói dịch vụ không hợp lệ hoặc đã bị vô hiệu hóa',
                },
                { status: 400 }
            )
        }

        const appSetting = await prisma.appSetting.findFirst({
            select: {
                id: true,
                vatRate: true,
                corporateTaxRate: true,
            },
        })

        if (!appSetting) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Chưa có cấu hình hệ thống',
                },
                { status: 500 }
            )
        }

        const revenue = new Prisma.Decimal(revenueBeforeVat)
        const cost = new Prisma.Decimal(costBeforeVat)

        const grossProfit = revenue.sub(cost)
        const vatAmount = grossProfit.mul(appSetting.vatRate)
        const corporateTaxAmount = grossProfit.mul(appSetting.corporateTaxRate)
        const netProfit = grossProfit.sub(corporateTaxAmount)

        const record = await prisma.financialRecord.create({
            data: {
                userId: user.id,
                recordDate: new Date(recordDate),
                packageTypeId,
                revenueBeforeVat: revenue,
                costBeforeVat: cost,
                grossProfit,
                vatAmount,
                corporateTaxAmount,
                netProfit,
                note: note || null,
            },
            select: {
                id: true,
                recordDate: true,
                revenueBeforeVat: true,
                costBeforeVat: true,
                grossProfit: true,
                vatAmount: true,
                corporateTaxAmount: true,
                netProfit: true,
                note: true,
                createdAt: true,
                packageType: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        })

        return NextResponse.json(
            {
                success: true,
                message: 'Tạo bản ghi thành công',
                data: record,
            },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Chưa đăng nhập',
                },
                { status: 401 }
            )
        }

        console.error('CREATE_RECORD_ERROR:', error)

        return NextResponse.json(
            {
                success: false,
                message: 'Đã có lỗi xảy ra ở máy chủ',
            },
            { status: 500 }
        )
    }
}