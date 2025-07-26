import type { Metadata } from 'next'
import './globals.css'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'SymptoSeek',
  description: 'Seek the perfect doctor for your symptoms',
    icons: {
        icon: '/stethoscope.svg', // or '/favicon.png'
    },
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="en">
      <body>
      {children}
      <SpeedInsights />
      <Analytics />
      </body>
      </html>
  )
}

