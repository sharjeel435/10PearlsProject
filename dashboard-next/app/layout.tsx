import type { Metadata } from "next";
import "./globals.css";
import "./product.css";

export const metadata: Metadata = {
  title: "Pearls AQI Predictor — 72-Hour Air Quality Forecast",
  description: "ML-based air-quality forecasting for Karachi, Lahore and Islamabad using four years of hourly observations.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://pearls-aqi.vercel.app"),
  openGraph: { title: "Pearls AQI Predictor", description: "72-hour air-quality intelligence for Pakistan", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
