'use strict';
'use client';

import Link from 'next/link'
import * as motion from 'framer-motion/client'
import { Calendar, ArrowRight } from 'lucide-react'

interface PostCardProps {
  title: string
  slug: string
  excerpt: string
  createdAt: string
  index?: number
  isReadFirst?: boolean
}

export default function PostCard({ title, slug, excerpt, createdAt, index = 0, isReadFirst = false }: PostCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <Link href={`/post/${slug}`} className="block h-full">
        {/* LOAD-BEARING: Cards feel placed, not floating
            Reduced radius, directional shadow, strengthened borders */}
        <div className={`h-full p-8 rounded-lg border-2 transition-all duration-300 flex flex-col relative ${
          isReadFirst 
            ? 'bg-wip-card border-wip-gold/60 hover:border-wip-gold' 
            : 'bg-wip-card border-wip-border hover:border-wip-gold/50'
        } shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)]`}>
          {/* Read First Badge */}
          {isReadFirst && (
            <div className="absolute top-4 right-4">
              {/* Badge - firm, clear boundary */}
              <span className="text-xs font-bold text-wip-gold bg-wip-navy px-3 py-1.5 rounded border border-wip-gold/50 tracking-wide">
                READ FIRST
              </span>
            </div>
          )}
          
          {/* Date - reduced emphasis, clearly secondary metadata */}
          <div className="flex items-center gap-2 text-wip-muted text-xs font-medium w-fit mb-4">
            <Calendar className="w-3 h-3" />
            <time>{formattedDate}</time>
          </div>

          {/* Heading - charcoal for authority */}
          <h2 className="text-2xl font-bold text-wip-heading mb-3 group-hover:text-wip-gold transition-colors line-clamp-2 tracking-tight">
            {title}
          </h2>

          <p className="text-wip-muted leading-relaxed line-clamp-3 mb-6 flex-grow">
            {excerpt}
          </p>

          {/* CTA - deliberate and grounded, not soft */}
          <div className="flex items-center text-wip-gold text-sm font-bold tracking-wider group/link">
            READ ARTICLE
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

