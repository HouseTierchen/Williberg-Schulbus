import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PWAInstall } from "@/components/PWAInstall";

export const metadata: Metadata = {
  title: {
    default: "Schulbus Wiliberg",
    template: "%s · Schulbus Wiliberg",
  },
  description:
    "Schulbus-Portal der Gemeinde Wiliberg – Fahrplan, Krankmeldungen und KI-gestützte Auswertung der Schulpläne. Eifach schön unterwegs.",
  applicationName: "Schulbus Wiliberg",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Schulbus Wiliberg",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/wappen.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a5ea8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de-CH">
      <body className="min-h-screen flex flex-col bg-white">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <PWAInstall />
      </body>
    </html>
  );
}
