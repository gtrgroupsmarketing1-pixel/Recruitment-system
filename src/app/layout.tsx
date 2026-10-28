import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { resolveLocale } from "@/core/i18n/resolve";
import { registerSubscribers } from "@/core/events/register-subscribers";
import { TooltipProvider } from "@/components/ui/tooltip";

registerSubscribers();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recruitment OS",
  description: "Recruitment & Mobilization Operating System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let locale: "en" | "ar" = "en";
  try {
    locale = await resolveLocale();
  } catch {
    locale = "en";
  }
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}