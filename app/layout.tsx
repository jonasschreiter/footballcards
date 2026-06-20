import type { Metadata, Viewport } from "next";
import { Geist_Mono, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

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
  title: "Cards-Vault",
  description: "Deine persönliche Karten-Sammlung",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang="de"
      className={`${appSans.variable} ${appDisplay.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen">
        <Navbar initialEmail={user?.email ?? null} />
        <main className="w-full px-3 sm:px-5 lg:px-8 xl:px-12 2xl:px-16 py-4 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
