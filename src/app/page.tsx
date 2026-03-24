import AuthStatus from "@/components/auth-status";
import CalculatorTabs from "@/components/dashboard/calculator-tabs";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Tính toán Doanh thu
            </h1>
          </div>

          <AuthStatus />
        </div>

        <CalculatorTabs />
      </div>
    </main>
  );
}