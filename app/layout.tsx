import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WIP Wisdom | Construction Business Insights',
  description: 'Time-tested principles, frameworks, and solutions for building successful construction companies. Master your WIP schedule, cash flow, and project management.',
  keywords: ['construction', 'WIP', 'work in progress', 'construction management', 'cash flow', 'project management', 'contractor business'],
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

