"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

type ChangePasswordResponse = {
    success: boolean;
    message?: string;
};

export default function ChangePasswordPage() {
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        try {
            setIsSubmitting(true);

            const response = await apiFetch<ChangePasswordResponse>("/api/auth/change-password", {
                method: "POST",
                bodyJson: {
                    currentPassword,
                    newPassword,
                    confirmNewPassword,
                },
            });

            setIsSuccess(true);
            setMessage(response.message || "Đổi mật khẩu thành công.");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (error) {
            if (error instanceof ApiError) {
                if (error.status === 401) {
                    setMessage("Bạn cần đăng nhập để đổi mật khẩu.");

                    setTimeout(() => {
                        router.push("/login?redirect=/change-password");
                    }, 1000);

                    return;
                }

                setMessage(error.details?.join(", ") || error.message);
            } else {
                setMessage("Không thể đổi mật khẩu.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Đổi mật khẩu</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Nhập mật khẩu hiện tại và đặt mật khẩu mới cho tài khoản của bạn
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Mật khẩu hiện tại
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu hiện tại"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Mật khẩu mới
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
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
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
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

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Đang cập nhật..." : "Đổi mật khẩu"}
                        </button>

                        <Link
                            href="/"
                            className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Quay lại trang chủ
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}