import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "geneline-x · Sales & Onboarding CRM",
  description: "WhatsApp-automation sales & onboarding pipeline for geneline-x.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
