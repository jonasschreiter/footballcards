import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fußball-Karten Katalog",
  description: "Deine persönliche Fußball-Sammelkarten-Sammlung",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
