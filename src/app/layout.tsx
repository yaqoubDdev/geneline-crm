import type { Metadata, Viewport } from "next";
import "./globals.css";
import OfflineProvider from "@/components/OfflineProvider";

export const metadata: Metadata = {
  title: "geneline-x · Sales & Onboarding CRM",
  description: "WhatsApp-automation sales & onboarding pipeline for geneline-x.",
  appleWebApp: { capable: true, title: "GenelineX", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#128C7E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <OfflineProvider />
      </body>
    </html>
  );
}
