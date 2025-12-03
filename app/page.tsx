import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PostCard from '@/components/PostCard'
import { getPosts } from '@/lib/supabase'

export const revalidate = 60 // Revalidate every minute

export default async function HomePage() {
  const posts = await getPosts()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wip-gold/10 border border-wip-gold/20 mb-6">
              <span className="w-2 h-2 bg-wip-gold rounded-full animate-pulse"></span>
              <span className="text-wip-gold text-sm font-medium">Clarity for Construction Leaders</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Build <span className="text-wip-gold">Better</span><br />
              Daily
            </h1>
            <p className="text-lg md:text-xl text-wip-muted max-w-2xl mx-auto leading-relaxed">
              Real talk about cash flow, leadership, and building a construction business that actually works. 
              No fluff. No jargon. Just clarity.
            </p>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-white">Latest Insights</h2>
              <span className="text-sm text-wip-muted">{posts.length} articles</span>
            </div>
            
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-wip-card rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-wip-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No posts yet</h3>
                <p className="text-wip-muted">
                  Check back soon! New insights are published daily.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt}
                    createdAt={post.created_at}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

