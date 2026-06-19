import type { Metadata } from "next";
import { Geist_Mono, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const appSans = Manrope({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const appDisplay = Space_Grotesk({
  variable: "--font-app-display",
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
    <html
      lang="de"
      className={`${appSans.variable} ${appDisplay.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
