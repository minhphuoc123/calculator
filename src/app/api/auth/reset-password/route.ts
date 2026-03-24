import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { resetPasswordWithCodeSchema } from "@/lib/validations/auth";

function hashCode(code: string) {
    return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = resetPasswordWithCodeSchema.safeParse(body);

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

        const { email, code, password } = parsed.data;
        const codeHash = hashCode(code);

        const user = await prisma.user.findFirst({
            where: {
                email,
                isActive: true,
                resetPasswordCodeHash: codeHash,
                resetPasswordExpiresAt: {
                    gt: new Date(),
                },
            },
            select: {
                id: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Mã xác nhận không đúng hoặc đã hết hạn",
                },
                { status: 400 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetPasswordCodeHash: null,
                resetPasswordExpiresAt: null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Đặt lại mật khẩu thành công",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("RESET_PASSWORD_ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Đã có lỗi xảy ra ở máy chủ",
            },
            { status: 500 }
        );
    }
}