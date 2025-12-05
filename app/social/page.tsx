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
        </div >
    )
}
