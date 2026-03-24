import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { forgotPasswordCodeSchema } from "@/lib/validations/auth";
import { sendResetPasswordCodeEmail } from "@/lib/mail";

function hashCode(code: string) {
    return crypto.createHash("sha256").update(code).digest("hex");
}

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = forgotPasswordCodeSchema.safeParse(body);

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

        const { email } = parsed.data;

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
            },
        });

        // Luôn trả message chung
        if (!user || !user.isActive) {
            return NextResponse.json(
                {
                    success: true,
                    message: "Nếu email tồn tại, mã xác nhận đã được gửi.",
                },
                { status: 200 }
            );
        }

        const code = generateCode();
        const codeHash = hashCode(code);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordCodeHash: codeHash,
                resetPasswordExpiresAt: expiresAt,
            },
        });

        await sendResetPasswordCodeEmail({
            to: user.email,
            name: user.name,
            code,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Nếu email tồn tại, mã xác nhận đã được gửi.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("FORGOT_PASSWORD_ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Đã có lỗi xảy ra ở máy chủ",
            },
            { status: 500 }
        );
    }
}