import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Integrated LV Client Portal",
  description: "Low-voltage infrastructure management and support portal",
  icons: {
    icon: '/integratedlvicon.png',
    shortcut: '/integratedlvicon.png',
    apple: '/integratedlvicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/integratedlvicon.png" />
      </head>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
