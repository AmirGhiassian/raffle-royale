import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
        title: "SCSC Raffle",
        description: "A free, open-source raffle app",
        icons: [
            {
                url: "/favicon.ico",
                sizes: "64x64 32x32 24x24 16x16",
                type: "image/x-icon"
            }
        ],
        openGraph: {
    title: 'SCSC Raffle',
    description: 'A free, open-source raffle app',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
