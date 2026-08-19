import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "./product.css";
import MotionProvider from "@/components/motion/MotionProvider";

export const metadata: Metadata = {
  title: "Pearls Air Intelligence — 72-Hour Air Quality Forecast",
  description:
    "72-hour AQI forecasts for Karachi, Lahore, and Islamabad. Built on four years of continuous atmospheric telemetry and transparent machine-learning models.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://10-pearls-project.vercel.app"
  ),
  openGraph: {
    title: "Pearls Air Intelligence",
    description:
      "72-hour air quality forecasts for Karachi, Lahore, and Islamabad.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}