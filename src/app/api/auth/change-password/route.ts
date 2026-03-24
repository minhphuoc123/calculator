import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
    try {
        const currentUser = await requireUser();
        const body = await req.json();

        const parsed = changePasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Dữ liệu không hợp lệ",
                    errors: parsed.error.issues.map((issue) => issue.message),
                },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = parsed.data;

        const user = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: {
                id: true,
                passwordHash: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Người dùng không tồn tại",
                },
                { status: 404 }
            );
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isMatch) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Mật khẩu hiện tại không đúng",
                },
                { status: 400 }
            );
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Đổi mật khẩu thành công",
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

        console.error("CHANGE_PASSWORD_ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Đã có lỗi xảy ra ở máy chủ",
            },
            { status: 500 }
        );
    }
}