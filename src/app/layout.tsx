import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import 'flag-icons/css/flag-icons.min.css'

export const metadata: Metadata = {
  title: 'PollaGol',
  description: 'App de polla mundialista',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PollaGol',
  },
}

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        {/* In development, unregister any stale service workers from previous production builds */}
        {process.env.NODE_ENV === 'development' && (
          <Script id="sw-cleanup" strategy="afterInteractive">{`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(r => r.unregister());
              });
            }
          `}</Script>
        )}
      </body>
    </html>
  )
}
