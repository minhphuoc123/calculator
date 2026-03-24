"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

type MeResponse = {
    success: boolean;
    message?: string;
    data?: {
        id: string;
        name: string;
        email: string;
        isActive?: boolean;
        lastLoginAt?: string | null;
        createdAt?: string;
        updatedAt?: string;
    };
};

type LogoutResponse = {
    success: boolean;
    message?: string;
};

export default function AuthStatus() {
    const router = useRouter();

    const [user, setUser] = useState<MeResponse["data"] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        async function loadMe() {
            try {
                setIsLoading(true);

                const response = await apiFetch<MeResponse>("/api/auth/me", {
                    method: "GET",
                    cache: "no-store",
                });

                setUser(response.data ?? null);
            } catch (error) {
                if (error instanceof ApiError && error.status === 401) {
                    setUser(null);
                } else {
                    console.error(error);
                    setUser(null);
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadMe();
    }, []);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);

            await apiFetch<LogoutResponse>("/api/auth/logout", {
                method: "POST",
            });

            setUser(null);
            router.replace("/");

            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoggingOut(false);
        }
    }

    if (isLoading) {
        return (
            <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                Đang tải thông tin tài khoản...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-wrap items-center gap-3">
                <Link
                    href="/login"
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Đăng nhập
                </Link>

                <Link
                    href="/register"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Đăng ký
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
            </div>

            <Link
                href="/change-password"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                Đổi mật khẩu
            </Link>

            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
        </div>
    );
}