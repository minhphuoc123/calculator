"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

type RegisterResponse = {
    success: boolean;
    message?: string;
    data?: {
        id: string;
        name: string;
        email: string;
        createdAt: string;
    };
};

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        if (!name.trim()) {
            setMessage("Bạn cần nhập họ tên.");
            return;
        }

        if (!email.trim()) {
            setMessage("Bạn cần nhập email.");
            return;
        }

        if (!password.trim()) {
            setMessage("Bạn cần nhập mật khẩu.");
            return;
        }

        if (password.length < 8) {
            setMessage("Mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Mật khẩu xác nhận không khớp.");
            return;
        }

        try {
            setIsSubmitting(true);

            await apiFetch<RegisterResponse>("/api/auth/register", {
                method: "POST",
                bodyJson: {
                    name,
                    email,
                    password,
                    confirmPassword,
                },
            });

            setIsSuccess(true);
            setMessage("Đăng ký thành công. Đang chuyển sang trang đăng nhập...");

            setTimeout(() => {
                router.push("/login");
            }, 1200);
        } catch (error) {
            if (error instanceof ApiError) {
                if (error.details && error.details.length > 0) {
                    setMessage(error.details.join(", "));
                } else {
                    setMessage(error.message);
                }
            } else {
                setMessage("Đăng ký thất bại.");
            }
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Đăng ký</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Tạo tài khoản để lưu record và quản lý dữ liệu
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Họ tên
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập họ tên"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                        />
                    </div>

                    {message ? (
                        <div
                            className={`rounded-xl px-4 py-3 text-sm ${isSuccess
                                ? "border border-green-200 bg-green-50 text-green-700"
                                : "border border-red-200 bg-red-50 text-red-700"
                                }`}
                        >
                            {message}
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
                    </button>
                </form>

                <div className="mt-5 flex flex-col gap-3 text-center text-sm text-gray-600">
                    <p>
                        Đã có tài khoản?{" "}
                        <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                            Đăng nhập
                        </Link>
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Quay lại trang chủ
                    </Link>
                </div>
            </div>
        </main>
    );
}