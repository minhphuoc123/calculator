import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function seedPackageTypes() {
    const packageTypes = [
        { code: "VSAT", name: "Dịch vụ VSAT" },
        { code: "AIO", name: "Giải pháp AIO" },
        { code: "CCTV", name: "Hệ thống CCTV" },
        { code: "AV", name: "Thiết bị AV" },
    ];

    for (const item of packageTypes) {
        const result = await prisma.packageType.upsert({
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
        });

        console.log(`✓ PackageType: ${result.code} - ${result.name}`);
    }

    const count = await prisma.packageType.count();
    console.log(`→ Tổng số package types hiện có: ${count}`);
}

async function seedAppSettings() {
    const existingSetting = await prisma.appSetting.findFirst();

    if (!existingSetting) {
        const created = await prisma.appSetting.create({
            data: {
                vatRate: new Decimal("0.08"),
                corporateTaxRate: new Decimal("0.20"),
            },
        });

        console.log(`✓ AppSetting đã tạo mới: ${created.id}`);
        return;
    }

    const updated = await prisma.appSetting.update({
        where: { id: existingSetting.id },
        data: {
            vatRate: new Decimal("0.08"),
            corporateTaxRate: new Decimal("0.20"),
        },
    });

    console.log(`✓ AppSetting đã cập nhật: ${updated.id}`);
}

async function main() {
    console.log("=== BẮT ĐẦU SEED ===");
    console.log("DATABASE_URL loaded:", Boolean(process.env.DATABASE_URL));

    await seedPackageTypes();
    await seedAppSettings();

    console.log("=== SEED THÀNH CÔNG ===");
}

main()
    .catch((error) => {
        console.error("=== SEED ERROR ===");
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Đã ngắt kết nối Prisma");
    });