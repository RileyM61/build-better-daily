interface Book {
  title: string
  author: string
  asin: string
  description: string
}

interface BookRecommendationProps {
  books: Book[]
  affiliateTag: string
}

// Generate Amazon search URL for more reliable linking
function getAmazonUrl(book: Book, affiliateTag: string): string {
  const searchQuery = encodeURIComponent(`${book.title} ${book.author} book`)
  const tag = affiliateTag ? `&tag=${affiliateTag}` : ''
  return `https://www.amazon.com/s?k=${searchQuery}${tag}`
}

export default function BookRecommendation({ books, affiliateTag }: BookRecommendationProps) {
  if (!books || books.length === 0) return null

  // LOAD-BEARING: Strengthened section divider
  return (
    <section className="mt-12 pt-8 border-t-2 border-wip-border">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-6 h-6 text-wip-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="text-xl font-bold text-wip-heading">Recommended Reading</h3>
      </div>
      <p className="text-wip-muted text-sm mb-6">
        Deepen your knowledge with these handpicked books on the topics covered in this article.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {books.map((book, index) => (
          <a
            key={index}
            href={getAmazonUrl(book, affiliateTag)}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-4 rounded-lg bg-wip-card border-2 border-wip-border hover:border-wip-gold/50 shadow-[0_2px_6px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_10px_-2px_rgba(0,0,0,0.15)] transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-14 bg-gradient-to-br from-wip-gold/20 to-wip-gold/5 rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-wip-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-wip-heading text-sm leading-tight group-hover:text-wip-gold transition-colors line-clamp-2">
                  {book.title}
                </h4>
                <p className="text-wip-muted text-xs mt-1">by {book.author}</p>
              </div>
            </div>
            <p className="text-wip-muted text-xs mt-3 line-clamp-2">{book.description}</p>
            <div className="mt-3 flex items-center text-wip-gold text-xs font-medium">
              View on Amazon
              <svg className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        ))}
      </div>
      <p className="text-wip-muted/60 text-xs mt-4 text-center">
        As an Amazon Associate, we earn from qualifying purchases.
      </p>
    </section>
  )
}

