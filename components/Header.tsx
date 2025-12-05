import Link from 'next/link'
import Image from 'next/image'

import { ExternalLink } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-wip-border bg-wip-dark/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="group relative">
            <div className="absolute -inset-2 bg-wip-gold/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <Image
              src="/images/logo.png"
              alt="Build Better Daily"
              width={1200}
              height={360}
              className="h-72 w-auto relative transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </Link>
          <a
            href="https://wip-insights.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-wip-muted hover:text-wip-gold transition-colors flex items-center gap-2 group"
          >
            Try WIP Insights
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </nav>
      </div>
    </header>
  )
}

