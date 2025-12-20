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
        <div className={`h-full p-8 rounded-2xl border transition-all duration-300 flex flex-col relative ${
          isReadFirst 
            ? 'bg-wip-card/50 border-wip-gold/30 hover:border-wip-gold/50 hover:bg-wip-card/70' 
            : 'bg-wip-card/40 border-wip-border/50 hover:border-wip-gold/30 hover:bg-wip-card/60'
        } hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)]`}>
          {/* Read First Badge */}
          {isReadFirst && (
            <div className="absolute top-4 right-4">
              <span className="text-xs font-medium text-wip-gold bg-wip-gold/10 px-2 py-1 rounded border border-wip-gold/20">
                Read First
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-wip-gold/80 text-xs font-medium bg-wip-gold/5 w-fit px-3 py-1 rounded-full mb-4 border border-wip-gold/10">
            <Calendar className="w-3 h-3" />
            <time>{formattedDate}</time>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-wip-gold transition-colors line-clamp-2">
            {title}
          </h2>

          <p className="text-wip-muted leading-relaxed line-clamp-3 mb-6 flex-grow">
            {excerpt}
          </p>

          <div className="flex items-center text-wip-gold text-sm font-bold tracking-wide group/link">
            READ ARTICLE
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

