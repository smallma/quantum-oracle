import type { Metadata } from "next";
import { Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const serif = Noto_Serif_TC({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "600"] });
const sans = Noto_Sans_TC({ subsets: ["latin"], variable: "--font-sans", weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  title: "Quantum Oracle | 大衍卜卦",
  description: "以大衍之數與當下干支，觀察問題中的變與不變。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className={`${serif.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
