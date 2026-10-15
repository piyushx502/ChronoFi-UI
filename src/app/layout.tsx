import type { Metadata } from "next";
import localFont from "next/font/local";
import AnimatedBackground from "./components/AnimatedBackground";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ChronoFi — Autonomous Life Financial Planner",
  description: "Enterprise-grade multi-agent life financial planning, stochastic scenario forecasting, tax optimization, and balance sheet stress testing.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-zinc-950">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-zinc-950 text-zinc-100`}
      >
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
