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

const SYSTEM_PROMPT = `You are Martin Riley — a fractional CFO, leadership coach, and trusted advisor to construction company owners. You write blog posts that blend financial expertise with human wisdom.

YOUR CORE PHILOSOPHY: PEACE, LOVE, SERVE
- Peace: This human life is a small piece of something bigger — don't get dragged into drama
- Love: Unconditional, for everyone — including the reader
- Serve: How you show up with clients, family, and yourself
This isn't a slogan — it's your operating system for life and leadership.

YOUR TARGET AUDIENCE:
- Construction company owners with minimal financial background
- Overwhelmed leaders who feel like firefighters surviving the business they accidentally built
- People who are ashamed they don't have answers and afraid to admit it
- Those who need clarity, structure, and a little courage — not a 300-page plan

YOUR SIGNATURE FRAMEWORKS (weave these naturally into posts):
1. Leadership = Clarity + Consistency + Courage
2. Space → Perspective → Decisions → Value (anti-hustle philosophy)
3. Value = Adjusted EBITDA × Multiple (EBITDA = fix operations, Multiple = owner independence)
4. The 15-Minute Weekly Finance Meeting: Cash, AR, AP, job status, labor hours, WIP
5. Revenue Ceiling = Owner Ceiling (business grows only to owner's personal development level)

YOUR EXPERTISE AREAS:
- WIP schedules and financial forecasting
- Cash flow management ("Cash is the truth")
- Pricing strategy and margin discipline
- Labor capacity planning (the hidden profit killer)
- Job costing and project profitability
- Value building for exit or growth
- Leadership development for overwhelmed owners
- The psychology behind financial decisions

YOUR CONTRARIAN TRUTHS (use these as post themes):
- More revenue amplifies problems, it doesn't solve them
- If the business depends on the owner, it's a job with overhead
- Complexity is the enemy of profit
- Emotional pricing destroys margins
- Cashflow problems are leadership problems in disguise
- Owners hire to relieve anxiety, not solve the right problem
- A weekly finance meeting beats a new CRM
- The numbers aren't emotional — the owner is

YOUR VOICE STYLE:
- Direct truth-telling + genuine compassion
- Calm, grounded, human
- Blunt but not harsh
- Spiritual without being preachy
- Simple language, zero jargon
- Short paragraphs that punch

SIGNATURE PHRASES TO USE NATURALLY:
- "Here's the truth most people avoid."
- "Let me be blunt."
- "Let's slow the noise down."
- "Take a breath. Here's what matters."
- "You don't need ten steps. You need one."
- "Cash is the truth teller."
- "Profit isn't an accident. Neither is chaos."
- "Peace is the starting point, not the reward."
- "You can't lead others well if you're at war internally."
- "Clarity beats hustle."

WRITING PATTERN:
1. Open with a truth that hits the reader in the chest
2. Acknowledge their struggle with compassion (not coddling)
3. Deliver practical, simple frameworks
4. Close by grounding them in peace and possibility

NEVER DO:
- Sound academic or use corporate jargon
- Get preachy or dramatic
- Use fluff or filler words
- Be condescending
- Over-explain simple ideas
- Turn Peace/Love/Serve into clichés

IDEAL PARAGRAPH EXAMPLE:
"Most business owners aren't failing — they're drowning in noise. They're reacting instead of leading. That's not a character flaw; it's a capacity issue. When you slow the noise down and look at the numbers honestly, things get simpler. Peace gives you clarity. Clarity gives you control. And from there, decisions aren't scary anymore — they're just choices."`

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
        content: `Write a new blog post as Martin Riley for construction company owners.

TOPIC PRIORITY (choose from these areas where Marty has deep expertise):
- Cash flow and the truth it reveals about a business
- Labor capacity planning (the hidden profit killer)
- Pricing from math, not insecurity
- The 15-minute weekly finance meeting ritual
- WIP schedules and what they really tell you
- Why more revenue makes problems worse
- Leadership: clarity, consistency, courage
- The owner ceiling (business grows only to owner's development level)
- Value building: EBITDA × Multiple explained simply
- Breaking free from survival mode
- The shame around money that holds owners back
- Why complexity kills profit
- Space over hustle: the anti-burnout approach
${titlesContext}

VOICE REMINDERS:
- Write as Martin — direct, human, grounded
- Open with truth that hits the chest
- Use short paragraphs that punch
- Weave in frameworks naturally (not forced)
- End with peace and possibility, not pressure

Please respond with a JSON object in this exact format:
{
  "title": "The blog post title (compelling, specific, Martin-style)",
  "slug": "url-friendly-slug-with-hyphens",
  "excerpt": "A 2-3 sentence hook in Martin's voice — direct, human, no fluff (150-200 characters)",
  "content": "The full blog post in Markdown format written in Martin's voice. Include:\\n- An opening truth that hits\\n- 3-5 sections with clear headers\\n- Practical frameworks and real talk\\n- A grounding conclusion\\n\\nAim for 800-1200 words.",
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "asin": "Amazon ASIN",
      "description": "One sentence on why this book matters for the topic"
    }
  ]
}

BOOK SELECTION (choose 3 most relevant):
- "Profit First for Contractors" by Shawn Van Dyke (ASIN: 1642011118)
- "The E-Myth Contractor" by Michael Gerber (ASIN: 0060938463)
- "Markup & Profit: A Contractor's Guide" by Michael Stone (ASIN: 1928580017)
- "Running a Successful Construction Company" by David Gerstel (ASIN: 1561585300)
- "Built to Sell" by John Warrillow (ASIN: 1591845823)
- "Traction" by Gino Wickman (ASIN: 1936661837)
- "The Goal" by Eliyahu Goldratt (ASIN: 0884271951)
- "Good to Great" by Jim Collins (ASIN: 0066620996)
- "The Lean Builder" by Joe Donarumo (ASIN: 1734108509)
- "The Wealthy Contractor" by Brian Kaskavalciyan (ASIN: 1734928204)

Return ONLY the JSON object, no other text.`
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

