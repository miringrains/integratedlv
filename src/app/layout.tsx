import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner'
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Integrated LV - Client Portal",
  description: "Low-voltage infrastructure support and management portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#f4f7f5',
              border: '2px solid #e8ebe9',
              color: '#1a1d1b',
            },
            className: 'text-sm',
          }}
        />
      </body>
    </html>
  );
}

