import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lytic - React SaaS Analytics Dashboard Template',
  description: 'Track revenue, MRR, traffic, campaigns, and users with Lytic.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
