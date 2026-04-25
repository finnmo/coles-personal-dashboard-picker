import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import '@fontsource-variable/inter'
import './globals.css'

export const metadata: Metadata = {
  title: 'Household Dashboard',
  description: 'Grocery shopping dashboard for Coles and IGA',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dashboard',
  },
}

export const viewport: Viewport = {
  themeColor: '#e2001a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
