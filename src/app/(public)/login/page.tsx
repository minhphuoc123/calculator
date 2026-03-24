import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

function LoginFallback() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
                <p className="mt-2 text-sm text-gray-600">Đang tải...</p>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginPageClient />
        </Suspense>
    );
}