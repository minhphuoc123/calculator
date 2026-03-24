import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const packageTypes = [
        { code: 'VSAT', name: 'VSAT' },
        { code: 'AIO', name: 'AIO' },
        { code: 'CCTV', name: 'CCTV' },
        { code: 'AV', name: 'AV' },
    ]

    for (const item of packageTypes) {
        await prisma.packageType.upsert({
            where: { code: item.code },
            update: {
                name: item.name,
                isActive: true,
            },
            create: {
                code: item.code,
                name: item.name,
                isActive: true,
            },
        })
    }

    const existingSetting = await prisma.appSetting.findFirst()

    if (!existingSetting) {
        await prisma.appSetting.create({
            data: {
                vatRate: new Prisma.Decimal('0.08'),
                corporateTaxRate: new Prisma.Decimal('0.20'),
            },
        })
    } else {
        await prisma.appSetting.update({
            where: { id: existingSetting.id },
            data: {
                vatRate: new Prisma.Decimal('0.08'),
                corporateTaxRate: new Prisma.Decimal('0.20'),
            },
        })
    }

    console.log('Seed dữ liệu mặc định thành công')
}

main()
    .catch((error) => {
        console.error('Seed error:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })