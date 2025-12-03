import Link from 'next/link'

interface PostCardProps {
  title: string
  slug: string
  excerpt: string
  createdAt: string
}

export default function PostCard({ title, slug, excerpt, createdAt }: PostCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className="group">
      <Link href={`/post/${slug}`} className="block">
        <div className="p-6 rounded-xl bg-wip-card/50 border border-wip-border hover:border-wip-gold/50 transition-all duration-300 hover:bg-wip-card">
          <time className="text-sm text-wip-gold font-medium">
            {formattedDate}
          </time>
          <h2 className="text-xl md:text-2xl font-semibold text-white mt-2 mb-3 group-hover:text-wip-gold transition-colors">
            {title}
          </h2>
          <p className="text-wip-muted leading-relaxed line-clamp-3">
            {excerpt}
          </p>
          <div className="mt-4 flex items-center text-wip-gold text-sm font-medium">
            Read more
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </Link>
    </article>
  )
}

