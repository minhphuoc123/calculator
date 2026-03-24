"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

type LoginResponse = {
    success: boolean;
    message?: string;
    data?: {
        id: string;
        name: string;
        email: string;
    };
};

export default function LoginPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const redirectTo = searchParams.get("redirect") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");

        if (!email.trim()) {
            setMessage("Bạn cần nhập email.");
            return;
        }

        if (!password.trim()) {
            setMessage("Bạn cần nhập mật khẩu.");
            return;
        }

        try {
            setIsSubmitting(true);

            await apiFetch<LoginResponse>("/api/auth/login", {
                method: "POST",
                bodyJson: {
                    email,
                    password,
                },
            });

            router.push(redirectTo);
            router.refresh();
        } catch (error) {
            if (error instanceof ApiError) {
                setMessage(error.message);
            } else {
                setMessage("Đăng nhập thất bại.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Đăng nhập để lưu record và sử dụng dữ liệu cá nhân
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

                    <div className="text-right">
                        <a
                            href="/forgot-password"
                            className="text-sm font-medium text-blue-600 hover:underline"
                        >
                            Quên mật khẩu?
                        </a>
                    </div>

                    {message ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {message}
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>

                <div className="mt-5 flex flex-col gap-3 text-center text-sm text-gray-600">
                    <p>
                        Chưa có tài khoản?{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-blue-600 hover:underline"
                        >
                            Đăng ký
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