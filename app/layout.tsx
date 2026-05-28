import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/lib/uploadthing";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SwiftJobs",
  description: "Capture your work. Invoice instantly. Get paid.",
  // PWA manifest — we'll create this file later
  manifest: "/manifest.json",
  // iOS-specific meta tags for "Add to Home Screen" PWA behavior
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SwiftJobs",
  },
};

export const viewport: Viewport = {
  // Prevents zooming on input focus (important for mobile forms)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Lets the app use the full screen on phones with notches
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        {children}
      </body>
    </html>
  );
}
