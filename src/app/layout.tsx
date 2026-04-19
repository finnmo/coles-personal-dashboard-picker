import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Household Dashboard',
  description: 'Grocery shopping dashboard for Coles and IGA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
