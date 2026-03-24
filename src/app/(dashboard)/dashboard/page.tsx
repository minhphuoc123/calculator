import CalculatorTabs from "@/components/dashboard/calculator-tabs";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                        Tính toán Doanh thu Dịch vụ
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Cập nhật và phân tích số liệu tài chính theo thời gian thực
                    </p>
                </div>

                <CalculatorTabs />
            </div>
        </div>
    );
}