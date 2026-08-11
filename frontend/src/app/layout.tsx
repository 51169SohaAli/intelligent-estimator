// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext'; // 👈 Import here
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Intelligent Agile Estimator',
  description: 'Real-time AI task forecasting engine',
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
      <body className="min-h-full flex flex-col">
        {/* AuthProvider MUST be first so SocketProvider can access the user */}
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}