// File: src/components/dashboard/calculator-tabs.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCurrency, parseCurrencyInput } from "@/lib/format";
import Link from "next/link";
import type {
    CreateRecordPayload,
    FinancialRecordItem,
    PackageInput,
    PackageKey,
    PackageResult,
    PackageTypeItem,
} from "@/types/financial";

const packageLabels: Record<PackageKey, string> = {
    VSAT: "Dịch vụ VSAT",
    AIO: "Giải pháp AIO",
    CCTV: "Hệ thống CCTV",
    AV: "Thiết bị AV",
};

function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
    return String(new Date().getMonth() + 1);
}

function getCurrentYear() {
    return String(new Date().getFullYear());
}

function getMonthDateRange(month: number, year: number) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const from = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, "0")}-${String(firstDay.getDate()).padStart(2, "0")}`;
    const to = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

    return { from, to };
}

const initialInputs: Record<PackageKey, PackageInput> = {
    VSAT: { output: 0, input: 0, recordDate: getTodayString(), note: "" },
    AIO: { output: 0, input: 0, recordDate: getTodayString(), note: "" },
    CCTV: { output: 0, input: 0, recordDate: getTodayString(), note: "" },
    AV: { output: 0, input: 0, recordDate: getTodayString(), note: "" },
};

const initialResults: Record<PackageKey, PackageResult> = {
    VSAT: { output: 0, input: 0, grossProfit: 0, vat: 0, corporateTax: 0, netProfit: 0 },
    AIO: { output: 0, input: 0, grossProfit: 0, vat: 0, corporateTax: 0, netProfit: 0 },
    CCTV: { output: 0, input: 0, grossProfit: 0, vat: 0, corporateTax: 0, netProfit: 0 },
    AV: { output: 0, input: 0, grossProfit: 0, vat: 0, corporateTax: 0, netProfit: 0 },
};

type PackageTypesResponse = {
    success: boolean;
    data: PackageTypeItem[];
};

type RecordsResponse = {
    success: boolean;
    data: FinancialRecordItem[];
};

type DeleteRecordResponse = {
    success: boolean;
    message?: string;
};

function roundMoney(value: number) {
    return Math.round(value);
}

// Đã cập nhật để nhận tham số thuế động
function calculateValues(data: PackageInput, vatRate: number, citRate: number): PackageResult {
    const grossProfit = roundMoney(data.output - data.input);
    const vat = roundMoney(grossProfit * vatRate);
    const corporateTax = roundMoney(grossProfit * citRate);
    const netProfit = roundMoney(grossProfit - corporateTax);

    return {
        output: data.output,
        input: data.input,
        grossProfit,
        vat,
        corporateTax,
        netProfit,
    };
}

function formatDate(value: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function SummaryCard({
    title,
    value,
    subtitle,
    highlight = false,
}: {
    title: string;
    value: number;
    subtitle: string;
    highlight?: boolean;
}) {
    return (
        <div
            className={`rounded-2xl border p-6 shadow-sm ${highlight ? "border-blue-600 bg-blue-600 text-white" : "bg-white"
                }`}
        >
            <p
                className={`text-sm font-semibold uppercase tracking-wide ${highlight ? "text-blue-100" : "text-gray-500"
                    }`}
            >
                {title}
            </p>

            <p className={`mt-4 text-3xl font-bold ${highlight ? "text-white" : "text-black"}`}>
                {formatCurrency(value)}
            </p>

            <p className={`mt-2 text-sm ${highlight ? "text-blue-100" : "text-gray-500"}`}>
                {subtitle}
            </p>
        </div>
    );
}

export default function CalculatorTabs() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<PackageKey>("VSAT");
    const [formData, setFormData] = useState<Record<PackageKey, PackageInput>>(initialInputs);
    const [results, setResults] = useState<Record<PackageKey, PackageResult>>(initialResults);
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Thêm state lưu cấu hình thuế (mặc định 8% và 20%)
    const [settings, setSettings] = useState({ vatRate: 0.08, corporateTaxRate: 0.2 });

    const [packageTypes, setPackageTypes] = useState<PackageTypeItem[]>([]);
    const [records, setRecords] = useState<FinancialRecordItem[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const activeInput = formData[activeTab];
    const activeResult = results[activeTab];

    const [useMonthFilter, setUseMonthFilter] = useState(true);

    // Cập nhật load Initial Data (Package Types + Settings)
    useEffect(() => {
        async function loadInitialData() {
            try {
                const response = await apiFetch<PackageTypesResponse>("/api/package-types", {
                    method: "GET",
                });
                setPackageTypes(response.data || []);
            } catch (error) {
                console.error(error);
            }

            try {
                const settingsRes = await apiFetch<any>("/api/settings", { method: "GET" });
                if (settingsRes.data) {
                    setSettings({
                        vatRate: Number(settingsRes.data.vatRate),
                        corporateTaxRate: Number(settingsRes.data.corporateTaxRate)
                    });
                }
            } catch (error) {
                console.error("Chưa tải được cấu hình thuế, dùng mặc định");
            }
        }

        loadInitialData();
    }, []);

    useEffect(() => {
        if (!useMonthFilter) {
            setFromDate("");
            setToDate("");
            return;
        }

        const month = Number(selectedMonth);
        const year = Number(selectedYear);

        if (!month || !year) return;

        const { from, to } = getMonthDateRange(month, year);
        setFromDate(from);
        setToDate(to);
    }, [selectedMonth, selectedYear, useMonthFilter]);

    useEffect(() => {
        loadRecords();
    }, [fromDate, toDate]);

    async function loadRecords() {
        try {
            setIsLoadingRecords(true);

            const searchParams = new URLSearchParams();

            if (fromDate) {
                searchParams.set("fromDate", fromDate);
            }

            if (toDate) {
                searchParams.set("toDate", toDate);
            }

            const queryString = searchParams.toString();
            const url = queryString ? `/api/records?${queryString}` : "/api/records";

            const response = await apiFetch<RecordsResponse>(url, {
                method: "GET",
                cache: "no-store",
            });

            setRecords(response.data || []);
            setIsLoggedIn(true);
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                setIsLoggedIn(false);
                setRecords([]);
                return;
            }

            console.error(error);
        } finally {
            setIsLoadingRecords(false);
        }
    }

    const total = useMemo(() => {
        return records.reduce(
            (acc, item) => {
                acc.output += Number(item.revenueBeforeVat);
                acc.input += Number(item.costBeforeVat);
                acc.grossProfit += Number(item.grossProfit);
                acc.vat += Number(item.vatAmount);
                acc.corporateTax += Number(item.corporateTaxAmount);
                acc.netProfit += Number(item.netProfit);
                return acc;
            },
            {
                output: 0,
                input: 0,
                grossProfit: 0,
                vat: 0,
                corporateTax: 0,
                netProfit: 0,
            }
        );
    }, [records]);

    const activeRecords = useMemo(() => {
        return records.filter((record) => record.packageType?.code === activeTab);
    }, [records, activeTab]);

    const canCalculate =
        !!activeInput.recordDate && activeInput.output > 0 && activeInput.input > 0;

    function handleChange(field: "output" | "input", value: string) {
        const parsed = parseCurrencyInput(value);

        setFormData((prev) => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [field]: parsed,
            },
        }));

        setMessage("");
    }

    function handleDateChange(value: string) {
        setFormData((prev) => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                recordDate: value,
            },
        }));

        setMessage("");
    }

    function handleNoteChange(value: string) {
        setFormData((prev) => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                note: value,
            },
        }));
    }

    // Truyền settings vào hàm tính toán
    function handleCalculate() {
        if (!canCalculate) {
            setMessage("Bạn cần nhập đầy đủ đầu ra, đầu vào và ngày ghi nhận.");
            return;
        }

        const currentInput = formData[activeTab];
        const calculated = calculateValues(currentInput, settings.vatRate, settings.corporateTaxRate);

        setResults((prev) => ({
            ...prev,
            [activeTab]: calculated,
        }));

        setMessage(`Đã tính toán cho ${packageLabels[activeTab]}.`);
    }

    function findPackageTypeIdByCode(code: PackageKey) {
        const item = packageTypes.find((pkg) => pkg.code === code);
        return item?.id || "";
    }

    async function handleSaveRecord() {
        const currentInput = formData[activeTab];
        const currentResult = results[activeTab];

        if (!currentInput.recordDate) {
            setMessage("Bạn cần chọn ngày ghi nhận trước khi lưu record.");
            return;
        }

        if (!currentResult.output || currentResult.output <= 0) {
            setMessage("Bạn cần bấm Tính toán trước khi lưu record.");
            return;
        }

        const packageTypeId = findPackageTypeIdByCode(activeTab);

        if (!packageTypeId) {
            setMessage("Không tìm thấy gói dịch vụ phù hợp để lưu record.");
            return;
        }

        const payload: CreateRecordPayload = {
            packageTypeId,
            recordDate: currentInput.recordDate,
            revenueBeforeVat: currentResult.output,
            costBeforeVat: currentResult.input,
            note: currentInput.note || "",
        };

        try {
            setIsSaving(true);

            await apiFetch("/api/records", {
                method: "POST",
                bodyJson: payload,
            });

            setMessage(`Đã lưu record cho ${packageLabels[activeTab]}.`);
            setIsLoggedIn(true);
            await loadRecords();
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                setMessage("Bạn cần đăng nhập để lưu record. Đang chuyển đến trang đăng nhập...");

                setTimeout(() => {
                    router.push("/login?redirect=/");
                }, 1000);

                return;
            }

            setMessage(error instanceof Error ? error.message : "Lưu record thất bại.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteRecord(recordId: string) {
        const confirmed = window.confirm("Bạn có chắc muốn xóa record này không?");
        if (!confirmed) return;

        try {
            setDeletingId(recordId);

            await apiFetch<DeleteRecordResponse>(`/api/records/${recordId}`, {
                method: "DELETE",
            });

            setMessage("Đã xóa record thành công.");
            await loadRecords();
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                setMessage("Bạn cần đăng nhập để xóa record.");
                return;
            }

            setMessage(error instanceof Error ? error.message : "Xóa record thất bại.");
        } finally {
            setDeletingId(null);
        }
    }

    function handleClearFilter() {
        setUseMonthFilter(false);
        setFromDate("");
        setToDate("");
    }

    function handleCurrentMonthFilter() {
        setUseMonthFilter(true);
        setSelectedMonth(getCurrentMonth());
        setSelectedYear(getCurrentYear());
    }

    function handleExportPdf() {
        if (!isLoggedIn) {
            setMessage("Bạn cần đăng nhập để xuất PDF.");
            return;
        }

        const month = Number(selectedMonth);
        const year = Number(selectedYear);

        window.open(`/api/reports/monthly-pdf?month=${month}&year=${year}`, "_blank");
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <aside className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900">Tổng toàn bộ gói</h2>

                    {!isLoggedIn ? (
                        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                            Đăng nhập để xem tổng record đã lưu.
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            <div>
                                <p className="text-xs uppercase text-gray-500">Tổng đầu ra</p>
                                <p className="mt-1 text-lg font-semibold text-black">{formatCurrency(total.output)}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase text-gray-500">Tổng đầu vào</p>
                                <p className="mt-1 text-lg font-semibold text-black">{formatCurrency(total.input)}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase text-gray-500">Lợi nhuận gộp</p>
                                <p className="mt-1 text-lg font-semibold text-black">
                                    {formatCurrency(total.grossProfit)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase text-gray-500">VAT phải nộp</p>
                                <p className="mt-1 text-lg font-semibold text-black">{formatCurrency(total.vat)}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase text-gray-500">Thuế TNDN</p>
                                <p className="mt-1 text-lg font-semibold text-black">
                                    {formatCurrency(total.corporateTax)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase text-gray-500">Lợi nhuận ròng</p>
                                <p className="mt-1 text-lg font-semibold text-black">
                                    {formatCurrency(total.netProfit)}
                                </p>
                            </div>
                        </div>
                    )}
                </aside>

                <section className="space-y-6">
                    <div className="flex flex-wrap gap-3">
                        {(Object.keys(packageLabels) as PackageKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setActiveTab(key);
                                    setMessage("");
                                }}
                                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === key
                                    ? "bg-blue-600 text-white"
                                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                {packageLabels[key]}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Đầu ra (Doanh thu chưa VAT)
                            </label>
                            <input
                                type="text"
                                value={activeInput.output === 0 ? "" : formatCurrency(activeInput.output)}
                                onChange={(e) => handleChange("output", e.target.value)}
                                placeholder="Nhập doanh thu"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Đầu vào (Giá vốn chưa VAT)
                            </label>
                            <input
                                type="text"
                                value={activeInput.input === 0 ? "" : formatCurrency(activeInput.input)}
                                onChange={(e) => handleChange("input", e.target.value)}
                                placeholder="Nhập giá vốn"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Ngày ghi nhận
                            </label>
                            <input
                                type="date"
                                value={activeInput.recordDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-6 shadow-sm">
                        <label className="mb-2 block text-sm font-medium text-gray-700">Ghi chú</label>
                        <textarea
                            value={activeInput.note}
                            onChange={(e) => handleNoteChange(e.target.value)}
                            placeholder="Nhập ghi chú nếu có"
                            rows={3}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleCalculate}
                            disabled={!canCalculate}
                            className={`rounded-xl px-5 py-3 text-sm font-semibold text-white ${canCalculate
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "cursor-not-allowed bg-gray-300"
                                }`}
                        >
                            Tính toán
                        </button>

                        <button
                            onClick={handleSaveRecord}
                            disabled={isSaving}
                            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? "Đang lưu..." : "Lưu record"}
                        </button>

                        <Link
                            href="/settings"
                            className="rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                        >
                            Cài đặt thuế
                        </Link>
                    </div>

                    {message ? (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                            {message}
                        </div>
                    ) : null}

                    {/* Cập nhật nhãn động theo settings */}
                    <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                        <SummaryCard
                            title="Lợi nhuận gộp"
                            value={activeResult.grossProfit}
                            subtitle="Doanh thu chưa VAT - Giá vốn chưa VAT"
                        />
                        <SummaryCard
                            title={`VAT phải nộp ${settings.vatRate * 100}%`}
                            value={activeResult.vat}
                            subtitle={`${settings.vatRate * 100}% × Lợi nhuận gộp`}
                        />
                        <SummaryCard
                            title={`Thuế TNDN ${settings.corporateTaxRate * 100}%`}
                            value={activeResult.corporateTax}
                            subtitle={`${settings.corporateTaxRate * 100}% × Lợi nhuận gộp`}
                        />
                        <SummaryCard
                            title="Lợi nhuận ròng"
                            value={activeResult.netProfit}
                            subtitle="Lợi nhuận gộp - Thuế TNDN"
                            highlight
                        />
                    </div>
                </section>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Record của {packageLabels[activeTab]}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Hiển thị record đã lưu theo từng gói dịch vụ
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-sm text-gray-600">Tháng</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setUseMonthFilter(true);
                                    setSelectedMonth(e.target.value);
                                }}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-black outline-none focus:border-blue-500"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                    <option key={month} value={month}>
                                        Tháng {month}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm text-gray-600">Năm</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-black outline-none focus:border-blue-500"
                            >
                                {[2024, 2025, 2026, 2027, 2028].map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleClearFilter}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Xóa lọc
                            </button>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleCurrentMonthFilter}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Tháng hiện tại
                            </button>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleExportPdf}
                                className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Xuất PDF
                            </button>
                        </div>
                    </div>
                </div>

                {!isLoggedIn ? (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                        Bạn cần đăng nhập để xem record đã lưu.
                    </div>
                ) : isLoadingRecords ? (
                    <div className="text-sm text-gray-500">Đang tải record...</div>
                ) : activeRecords.length === 0 ? (
                    <div className="text-sm text-gray-500">Chưa có record nào cho gói này.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-gray-500">
                                    <th className="py-3 pr-4">Ngày</th>
                                    <th className="py-3 pr-4">Đầu ra</th>
                                    <th className="py-3 pr-4">Đầu vào</th>
                                    <th className="py-3 pr-4">Lợi nhuận gộp</th>
                                    <th className="py-3 pr-4">VAT</th>
                                    <th className="py-3 pr-4">Thuế TNDN</th>
                                    <th className="py-3 pr-4">Lợi nhuận ròng</th>
                                    <th className="py-3 pr-4">Ghi chú</th>
                                    <th className="py-3 pr-4">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="text-black">
                                {activeRecords.map((record) => (
                                    <tr key={record.id} className="border-b last:border-b-0">
                                        <td className="py-3 pr-4">{formatDate(record.recordDate)}</td>
                                        <td className="py-3 pr-4">{formatCurrency(Number(record.revenueBeforeVat))}</td>
                                        <td className="py-3 pr-4">{formatCurrency(Number(record.costBeforeVat))}</td>
                                        <td className="py-3 pr-4">{formatCurrency(Number(record.grossProfit))}</td>
                                        <td className="py-3 pr-4">{formatCurrency(Number(record.vatAmount))}</td>
                                        <td className="py-3 pr-4">{formatCurrency(Number(record.corporateTaxAmount))}</td>
                                        <td className="py-3 pr-4">{formatCurrency(Number(record.netProfit))}</td>
                                        <td className="py-3 pr-4 text-gray-600">{record.note || "-"}</td>
                                        <td className="py-3 pr-4">
                                            <button
                                                onClick={() => handleDeleteRecord(record.id)}
                                                disabled={deletingId === record.id}
                                                className="rounded-lg border border-red-300 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {deletingId === record.id ? "Đang xóa..." : "Xóa"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}