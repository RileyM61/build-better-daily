import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Build Better Daily | Construction Business Insights',
  description: 'Clarity for construction company owners. Time-tested principles, frameworks, and real talk about cash flow, leadership, and building a business that works.',
  keywords: ['construction', 'WIP', 'work in progress', 'construction management', 'cash flow', 'project management', 'contractor business', 'fractional CFO'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-wip-dark text-wip-text antialiased">
        {children}
      </body>
    </html>
  )
}

