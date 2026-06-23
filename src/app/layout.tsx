import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { SiteHeader } from "@/components/layout/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tracks — AI Safety Learning",
    template: "%s · Tracks",
  },
  description:
    "A modular, hands-on learning platform for AI safety: technical and governance tracks, interactive demos, real writing practice, and a curated resource hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <AuthKitProvider>
          <TooltipProvider delayDuration={200}>
            <SiteHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </TooltipProvider>
          <Toaster />
        </AuthKitProvider>
      </body>
    </html>
  );
}
