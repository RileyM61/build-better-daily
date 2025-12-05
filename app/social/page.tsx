import { getPosts, Post } from '@/lib/supabase'
import Header from '@/components/Header'
import SocialGenerator from '@/components/SocialGenerator'

// Mock data remains for fallback
const MOCK_POSTS: Post[] = [
    {
        id: '1',
        title: 'Stop Bidding Everything: The Art of Selective Tendering',
        content: 'In the construction industry, the urge to bid on every project that crosses your desk is a surefire way to kill your cash flow and burnout your team. Selective tendering isn\'t just about saying no; it\'s about strategically saying yes to the right projects...',
        slug: 'stop-bidding-everything',
        excerpt: '...',
        books: [],
        published: true,
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Cash Flow is King: Managing Retainage Effectively',
        content: 'Retainage can cripple a small subcontractor if not managed correctly. It represents your profit margin sitting in someone else\'s bank account. Here are strategies to negotiate better terms and account for that missing 10%...',
        slug: 'cash-flow-is-king',
        excerpt: '...',
        books: [],
        published: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: '3',
        title: 'Leadership on Site: Beyond the Hard Hat',
        content: 'True leadership on a construction site isn\'t about being the loudest voice. It\'s about clarity, safety, and respect. When your foreman respects the team, the team respects the schedule. It\'s that simple...',
        slug: 'leadership-on-site',
        excerpt: '...',
        books: [],
        published: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
    }
]

export default async function SocialDashboard() {
    let posts: Post[] = []

    try {
        posts = await getPosts()
    } catch {
        posts = MOCK_POSTS
    }

    if (posts.length === 0) posts = MOCK_POSTS

    return (
        <div className="min-h-screen bg-wip-dark text-wip-text font-sans selection:bg-wip-gold selection:text-wip-dark">
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-wip-navy via-wip-dark to-black pointer-events-none" />

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
                    <div className="flex items-end justify-between mb-12 border-b border-wip-border/50 pb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Social Media Center</h1>
                            <p className="text-wip-muted">Repurpose your high-value content for LinkedIn and X.</p>
                        </div>
                        <div className="px-4 py-2 bg-wip-card/50 rounded-lg border border-wip-border text-xs font-mono text-wip-gold">
                            {posts.length} Articles Available
                        </div>
                    </div>

                    <div className="space-y-8">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-wip-card/30 backdrop-blur-sm border border-wip-border rounded-2xl p-8 hover:border-wip-gold/20 transition-all"
                            >
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold text-white mb-2">{post.title}</h2>
                                    <p className="text-wip-muted line-clamp-2 text-sm max-w-3xl">{post.content}</p>
                                </div>

                                <SocialGenerator post={post} />
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
