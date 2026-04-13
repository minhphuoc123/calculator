// File: src/app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type SettingsResponse = {
    success: boolean;
    data: { id: string; vatRate: number | string; corporateTaxRate: number | string; };
};

export default function SettingsPage() {
    const [vatRate, setVatRate] = useState<string>("8");
    const [citRate, setCitRate] = useState<string>("20");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    useEffect(() => {
        async function loadSettings() {
            try {
                const res = await apiFetch<SettingsResponse>("/api/settings", { method: "GET" });
                if (res.data) {
                    setVatRate((Number(res.data.vatRate) * 100).toString());
                    setCitRate((Number(res.data.corporateTaxRate) * 100).toString());
                }
            } catch (error) {
                console.error("Chưa tải được cấu hình, sử dụng mặc định 8% và 20%");
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, []);

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setMessage({ text: "", type: "" });
        setIsSaving(true);

        try {
            await apiFetch("/api/settings", {
                method: "PUT",
                bodyJson: {
                    vatRate: Number(vatRate) / 100,
                    corporateTaxRate: Number(citRate) / 100,
                },
            });
            setMessage({ text: "Lưu cấu hình hệ thống thành công!", type: "success" });
        } catch (error: any) {
            setMessage({ text: error.message || "Lưu thất bại", type: "error" });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="text-gray-500">Đang tải cấu hình hệ thống...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-3xl px-6 py-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cài đặt hệ thống</h1>
                        <p className="mt-2 text-sm text-gray-600">Thay đổi tỷ lệ thuế áp dụng cho các tính toán mới</p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Quay lại Dashboard
                    </Link>
                </div>

                <form onSubmit={handleSave} className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                        <strong>Lưu ý:</strong> Việc thay đổi tỷ lệ thuế ở đây chỉ áp dụng cho các bản ghi được tạo <strong>sau thời điểm này</strong>. Các bản ghi lịch sử đã lưu trước đó sẽ không bị ảnh hưởng.
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Thuế giá trị gia tăng - VAT (%)</label>
                            <input
                                type="number" step="0.1" min="0" max="100"
                                value={vatRate}
                                onChange={(e) => setVatRate(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-black"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Thuế thu nhập doanh nghiệp - TNDN (%)</label>
                            <input
                                type="number" step="0.1" min="0" max="100"
                                value={citRate}
                                onChange={(e) => setCitRate(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-black"
                            />
                        </div>
                    </div>

                    {message.text && (
                        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit" disabled={isSaving}
                            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}