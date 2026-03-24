"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

type ForgotPasswordResponse = {
    success: boolean;
    message?: string;
};

type ResetPasswordResponse = {
    success: boolean;
    message?: string;
};

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<1 | 2>(1);

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSendCode(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        try {
            setIsSubmitting(true);

            const response = await apiFetch<ForgotPasswordResponse>("/api/auth/forgot-password", {
                method: "POST",
                bodyJson: { email },
            });

            setIsSuccess(true);
            setMessage(response.message || "Mã xác nhận đã được gửi.");
            setStep(2);
        } catch (error) {
            if (error instanceof ApiError) {
                setMessage(error.details?.join(", ") || error.message);
            } else {
                setMessage("Không thể gửi mã xác nhận.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        try {
            setIsSubmitting(true);

            const response = await apiFetch<ResetPasswordResponse>("/api/auth/reset-password", {
                method: "POST",
                bodyJson: {
                    email,
                    code,
                    password,
                    confirmPassword,
                },
            });

            setIsSuccess(true);
            setMessage(response.message || "Đặt lại mật khẩu thành công.");
        } catch (error) {
            if (error instanceof ApiError) {
                setMessage(error.details?.join(", ") || error.message);
            } else {
                setMessage("Không thể đặt lại mật khẩu.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
                <p className="mt-2 text-sm text-gray-600">
                    {step === 1
                        ? "Nhập email để nhận mã xác nhận"
                        : "Nhập mã đã gửi về email và đặt mật khẩu mới"}
                </p>

                {step === 1 ? (
                    <form onSubmit={handleSendCode} className="mt-6 space-y-4">
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
                            {isSubmitting ? "Đang gửi..." : "Gửi mã xác nhận"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                readOnly
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-black outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Mã xác nhận
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Nhập mã 6 số"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
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

                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setMessage("");
                                    setIsSuccess(false);
                                    setCode("");
                                    setPassword("");
                                    setConfirmPassword("");
                                }}
                                className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Gửi lại mã
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                            </button>
                        </div>
                    </form>
                )}

                <p className="mt-5 text-center text-sm text-gray-600">
                    <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                        Quay lại đăng nhập
                    </Link>
                </p>
            </div>
        </main>
    );
}