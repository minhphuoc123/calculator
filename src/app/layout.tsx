import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calculator App",
  description: "Ứng dụng quản lý doanh thu và tính toán dịch vụ",
  applicationName: "Calculator App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Calculator App",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}