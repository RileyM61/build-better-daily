import Link from 'next/link'
import Image from 'next/image'
import { Button } from './Button'
import { ExternalLink } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-wip-border bg-wip-dark/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          <Link href="/" className="group relative">
            <div className="absolute -inset-2 bg-wip-gold/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <Image
              src="/images/logo.png"
              alt="Build Better Daily"
              width={1200}
              height={360}
              className="h-24 w-auto relative transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </Link>

          <a
            href="https://wip-insights.com"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            <Button variant="secondary" size="sm" className="gap-2 group shadow-lg border border-wip-border/50 bg-wip-card/80 hover:bg-wip-border">
              <div className="w-5 h-5 relative rounded overflow-hidden">
                <Image
                  src="/images/wip-insights-logo.png"
                  alt="WIP Insights"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="hidden sm:inline font-medium text-wip-text group-hover:text-white transition-colors">Try WIP Insights</span>
              <span className="sm:hidden font-medium text-wip-text group-hover:text-white transition-colors">Try App</span>
              <ExternalLink className="w-3 h-3 text-wip-muted group-hover:text-wip-gold transition-colors" />
            </Button>
          </a>
        </nav>
      </div>
    </header>
  )
}
