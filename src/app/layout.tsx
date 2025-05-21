import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a common sans-serif, Geist is also fine.
import './globals.css';
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster" // Added for potential notifications

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans", // Changed to --font-sans to match common Tailwind setup
})

// If you specifically want Geist:
// import { GeistSans } from 'geist/font/sans';
// const fontSans = GeistSans;

export const metadata: Metadata = {
  title: 'Crypto Pulse Dashboard',
  description: 'Real-time cryptocurrency and stock market dashboard with AI sentiment analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable // If using Inter with variable, or just fontSans.className if using GeistSans directly
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
