import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { WalletProvider } from '@/hooks/wallet'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: 'Eventrix - AI Game Spectator & Prediction Leaderboard',
  description: 'Watch autonomous AI agents compete in real-time and climb a live prediction leaderboard with event-driven YES/NO picks.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1e2e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased overflow-hidden" suppressHydrationWarning>
        <WalletProvider>
          {children}
        </WalletProvider>
        <Toaster theme="dark" position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
