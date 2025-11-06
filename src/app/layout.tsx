import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/navigation";
import { PageTransitionProvider } from "@/components/layout/page-transition";
import { ScrollProgress } from "@/components/ui/micro-interactions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exvoria",
  description: "Strategy management platform for tactical teams",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  other: {
    'preload': '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{
          background: 'var(--color-surface-dark)',
          color: 'var(--color-text-primary)'
        }}
      >
        <ScrollProgress color="#FFFFFF" />
        <Navigation />
        <PageTransitionProvider>
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </PageTransitionProvider>
      </body>
    </html>
  );
}
