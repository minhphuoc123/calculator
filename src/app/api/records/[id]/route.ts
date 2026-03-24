import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function DELETE(_: Request, context: RouteContext) {
    try {
        const user = await requireUser();
        const { id } = await context.params;

        const record = await prisma.financialRecord.findFirst({
            where: {
                id,
                userId: user.id,
            },
            select: {
                id: true,
            },
        });

        if (!record) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Không tìm thấy record",
                },
                { status: 404 }
            );
        }

        await prisma.financialRecord.delete({
            where: {
                id,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Xóa record thành công",
            },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Chưa đăng nhập",
                },
                { status: 401 }
            );
        }

        console.error("DELETE_RECORD_ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Đã có lỗi xảy ra ở máy chủ",
            },
            { status: 500 }
        );
    }
}