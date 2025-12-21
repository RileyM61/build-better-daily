import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BookRecommendation from '@/components/BookRecommendation'
import SubscriptionInvite from '@/components/SubscriptionInvite'
import EmailContent from '@/components/EmailContent'
import { getPostBySlug, getPosts } from '@/lib/supabase'

export const revalidate = 60

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found | Build Better Daily',
    }
  }

  return {
    title: `${post.title} | Build Better Daily`,
    description: post.excerpt,
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (post?.infographic_url) {
    console.log('Infographic URL:', post.infographic_url)
  }

  if (!post) {
    notFound()
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const affiliateTag = process.env.AMAZON_AFFILIATE_TAG || 'tag'

  // Split content for infographic injection
  const [firstParagraph, ...restContent] = post.content.split('\n\n')
  const remainingContent = restContent.join('\n\n')

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <article className="py-8 md:py-12">
          <div className="max-w-3xl mx-auto px-4">
            {/* Back link */}
            <Link
              href="/"
              className="inline-flex items-center text-wip-muted hover:text-wip-gold transition-colors mb-8"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all posts
            </Link>

            {/* Post header - authoritative typography */}
            <header className="mb-8">
              <time className="text-wip-muted font-medium text-sm">
                {formattedDate}
              </time>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-wip-heading mt-3 mb-4 leading-tight tracking-tight">
                {post.title}
              </h1>
              <p className="text-lg text-wip-text leading-relaxed">
                {post.excerpt}
              </p>
            </header>

            {/* LOAD-BEARING: Strengthened divider for clear section break */}
            <div className="w-full h-0.5 bg-wip-border mb-10" />

            {/* Post content */}
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.infographic_url ? firstParagraph : post.content}
              </ReactMarkdown>

              {post.infographic_url && (
                <div className="my-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.infographic_url!}
                    alt={`Infographic for ${post.title}`}
                    className="w-full rounded-xl border border-wip-border shadow-lg"
                  />
                </div>
              )}

              {post.infographic_url && remainingContent && (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {remainingContent}
                </ReactMarkdown>
              )}
            </div>

            {/* Book recommendations */}
            <BookRecommendation
              books={post.books}
              affiliateTag={affiliateTag}
            />

            {/* Email Content for Subscribers */}
            <EmailContent postId={post.id} postSlug={post.slug} />

            {/* LOAD-BEARING: Clear structural separation */}
            <div className="mt-16 pt-12 border-t-2 border-wip-border">
              <SubscriptionInvite />
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}

