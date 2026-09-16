import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "文山真人大富翁",
  description: "走進文山街區、完成學習關卡、蒐集旅點並兌換在地好禮。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant"><body>{children}</body></html>
  );
}
