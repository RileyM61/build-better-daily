import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PostCard from '@/components/PostCard'
import Hero from '@/components/Hero'
import SubscriptionInvite from '@/components/SubscriptionInvite'
import { getPosts } from '@/lib/supabase'

export const revalidate = 60 // Revalidate every minute

export default async function HomePage() {
  const posts = await getPosts()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Hero />

        {/* Blog Posts */}
        <section id="posts" className="pb-24 relative z-10">
          <div className="max-w-4xl mx-auto px-4">
            {/* LOAD-BEARING: Section header with strengthened divider */}
            <div className="flex items-end justify-between mb-12 border-b-2 border-wip-border pb-4">
              <h2 className="text-3xl font-bold text-wip-heading tracking-tight">Latest Insights</h2>
              <span className="text-sm font-medium text-wip-muted">
                {posts.length} articles
              </span>
            </div>

            {/* GROUNDED: Empty state with visible container */}
            {posts.length === 0 ? (
              <div className="text-center py-20 bg-wip-card rounded-xl border border-wip-border shadow-sm">
                <div className="w-16 h-16 bg-wip-card rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-wip-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-wip-text mb-2">No posts yet</h3>
                <p className="text-wip-muted">
                  Check back soon! New insights are published daily.
                </p>
              </div>
            ) : (
              // Posts are sorted: is_read_first posts first (pinned instructional content),
              // then regular posts by date. This ensures "Read This First" is always visible.
              <div className="grid gap-6">
                {posts.map((post, index) => {
                  const isFirstReadFirst = index === 0 && post.is_read_first
                  return (
                    <div key={post.id}>
                      <PostCard
                        title={post.title}
                        slug={post.slug}
                        excerpt={post.excerpt}
                        createdAt={post.created_at}
                        index={index}
                        isReadFirst={post.is_read_first || false}
                      />
                      {/* Subscription invite appears after "Read First" post - 
                          positioned after understanding, not before */}
                      {isFirstReadFirst && <SubscriptionInvite />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

