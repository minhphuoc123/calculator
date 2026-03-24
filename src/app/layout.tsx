import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quản Lý Doanh Thu",
  description: "Ứng dụng quản lý doanh thu dịch vụ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}