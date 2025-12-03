import Anthropic from '@anthropic-ai/sdk'
import type { Book } from './supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface GeneratedPost {
  title: string
  slug: string
  content: string
  excerpt: string
  books: Book[]
}

const SYSTEM_PROMPT = `You are an expert construction business consultant and financial advisor who writes educational blog posts for construction company owners and their leadership teams.

Your target audience:
- Construction company owners with minimal financial background
- Project managers and operations leaders
- People who want to use simple tools (especially the WIP schedule) to solve operational issues
- Those building sustainable, profitable, and enjoyable construction businesses

Your writing style:
- Clear, practical, and actionable
- Use real-world examples from construction
- Explain financial concepts in simple terms
- Focus on frameworks and principles that work
- Avoid jargon unless you explain it
- Be encouraging but realistic

Topics you cover include:
- WIP (Work in Progress) schedule management and analysis
- Cash flow management and forecasting
- Project profitability and job costing
- Over/under billing management
- Financial statements for contractors
- Estimating and bidding strategies
- Change order management
- Subcontractor relationships
- Bonding and insurance
- Growth strategies for construction companies
- Building effective teams
- Owner succession planning
- Common financial mistakes and how to avoid them`

export async function generateBlogPost(existingTitles: string[]): Promise<GeneratedPost> {
  const titlesContext = existingTitles.length > 0
    ? `\n\nIMPORTANT: Avoid these topics that have already been covered:\n${existingTitles.map(t => `- ${t}`).join('\n')}`
    : ''

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Write a new blog post for construction company owners about managing their business more effectively.
${titlesContext}

Please respond with a JSON object in this exact format:
{
  "title": "The blog post title (compelling and specific)",
  "slug": "url-friendly-slug-with-hyphens",
  "excerpt": "A 2-3 sentence summary that hooks the reader (150-200 characters)",
  "content": "The full blog post in Markdown format. Include:\n- An engaging introduction\n- 3-5 main sections with headers\n- Practical tips and examples\n- A conclusion with actionable takeaways\n\nAim for 800-1200 words.",
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "asin": "Amazon ASIN (10-character code like B08XYZ1234 or 0123456789)",
      "description": "One sentence explaining why this book is relevant to the post topic"
    },
    // Include exactly 3 books that are real, relevant construction/business books
  ]
}

IMPORTANT RULES:
1. Choose 3 books from this verified list that are MOST relevant to your topic:
   - "Profit First for Contractors" by Shawn Van Dyke (ASIN: 1642011118)
   - "Construction Accounting & Financial Management" by Steven Peterson (ASIN: 0135232996)
   - "The E-Myth Contractor" by Michael Gerber (ASIN: 0060938463)
   - "Markup & Profit: A Contractor's Guide" by Michael Stone (ASIN: 1928580017)
   - "Running a Successful Construction Company" by David Gerstel (ASIN: 1561585300)
   - "The Contractor's Guide to QuickBooks" by Karen Mitchell (ASIN: 1572182091)
   - "Construction Management JumpStart" by Barbara Jackson (ASIN: 1119451000)
   - "Built to Sell" by John Warrillow (ASIN: 1591845823)
   - "Traction" by Gino Wickman (ASIN: 1936661837)
   - "The Goal" by Eliyahu Goldratt (ASIN: 0884271951)
   - "Good to Great" by Jim Collins (ASIN: 0066620996)
   - "The Lean Builder" by Joe Donarumo (ASIN: 1734108509)
   - "Managing the Profitable Construction Business" by Thomas Schleifer (ASIN: 0470932961)
   - "Financial Management and Accounting Fundamentals for Construction" by Daniel Halpin (ASIN: 0470182717)
   - "The Wealthy Contractor" by Brian Kaskavalciyan (ASIN: 1734928204)
2. Select the 3 books most relevant to the specific topic of your blog post
3. The content should be genuinely helpful and educational
4. Return ONLY the JSON object, no other text`
      }
    ],
    system: SYSTEM_PROMPT,
  })

  // Extract the text content
  const textContent = response.content.find(block => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response')
  }

  // Parse the JSON response
  try {
    // Clean up the response - remove any markdown code blocks if present
    let jsonString = textContent.text.trim()
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7)
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3)
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3)
    }
    jsonString = jsonString.trim()

    const post = JSON.parse(jsonString) as GeneratedPost
    
    // Validate required fields
    if (!post.title || !post.slug || !post.content || !post.excerpt || !post.books) {
      throw new Error('Missing required fields in generated post')
    }
    
    // Ensure we have exactly 3 books
    if (!Array.isArray(post.books) || post.books.length !== 3) {
      throw new Error('Expected exactly 3 book recommendations')
    }
    
    return post
  } catch (parseError) {
    console.error('Failed to parse Claude response:', textContent.text)
    throw new Error(`Failed to parse generated post: ${parseError}`)
  }
}

