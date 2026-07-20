import type { Metadata } from "next";
import "./globals.css";

const title = "Hunter电力指数 | Hunter Power Index";
const description = "追踪美国电力基础设施产业链表现的专业等权指数研究页面。";

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary", title, description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
