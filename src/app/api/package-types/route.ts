import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const packageTypes = await prisma.packageType.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                code: true,
                name: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: packageTypes,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET_PACKAGE_TYPES_ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Không tải được danh sách gói dịch vụ",
            },
            { status: 500 }
        );
    }
}