import { createClient } from '@supabase/supabase-js'

// Types for our database
export interface Book {
  title: string
  author: string
  asin: string
  description: string
}

/**
 * Leadership Tool - embedded in each post
 * This is what makes the article usable in a leadership meeting.
 */
export interface LeadershipTool {
  question: string
  prompt: string
  action: string
}

/**
 * Content Pillar type for editorial categorization
 */
export type ContentPillar = 
  | 'Think Like an Investor (Operator Edition)'
  | 'Financial Clarity Without Accounting Theater'
  | 'Operational Discipline That Reduces Chaos'
  | 'Leadership Reality in Small Companies'
  | 'Building Value Without Burning Your Life Down'

/**
 * Article Archetype type for editorial structure
 */
export type ArticleArchetype =
  | 'Misconception Kill Shot'
  | 'Operator Reality Check'
  | 'Decision Framework'
  | 'Failure-Earned Insight'
  | 'Quiet Discipline Piece'
  | 'Value vs Life Tension Piece'

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  pillar?: ContentPillar           // Editorial pillar (weekly system)
  archetype?: ArticleArchetype     // Article archetype (weekly system)
  leadership_tool?: LeadershipTool // Leadership meeting tool (weekly system)
  books: Book[]
  infographic_url?: string
  created_at: string
  published: boolean
  is_read_first?: boolean          // Marks instructional/onboarding post (pinned, excluded from cadence)
}

/**
 * Weekly Email Companion - sent alongside the article
 */
export interface WeeklyEmail {
  id: string
  post_id: string                  // Links to the parent post
  subject: string
  preheader: string
  body: string
  leadership_prompt: string
  watch_for: string
  execution_nudge: string
  created_at: string
  sent: boolean
  sent_at?: string | null
  sent_count?: number
}

export interface Subscriber {
  id: string
  email: string
  leadership_meeting_day?: string | null  // e.g., "Monday", "Tuesday"
  delivery_window?: string | null         // "morning" | "before"
  unsubscribed: boolean
  unsubscribed_at?: string | null
  created_at: string
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Singleton client for browser
let browserClient: ReturnType<typeof createClient> | null = null

// Client for public/frontend operations
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  // Return existing client if available (for auth persistence)
  if (browserClient) return browserClient

  browserClient = createClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}

// Client for server operations (with service role key)
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Mock data for development
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'The Cash Flow Rollercoaster: How to Get Off',
    slug: 'cash-flow-rollercoaster',
    excerpt: 'Most construction businesses die because of cash flow, not lack of work. Here is the framework for stabilizing your finances.',
    content: 'Mock content...',
    books: [],
    created_at: new Date().toISOString(),
    published: true
  },
  {
    id: '2',
    title: 'Leadership in the Field vs. The Office',
    slug: 'leadership-field-vs-office',
    excerpt: 'Why your best foreman struggles when you promote him to project manager, and how to bridge the gap.',
    content: 'Mock content...',
    books: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    published: true
  },
  {
    id: '3',
    title: 'Stop Bidding on Everything',
    slug: 'stop-bidding-everything',
    excerpt: 'The power of niche. Why narrowing your focus actually increases your profit margins.',
    content: 'Mock content...',
    books: [],
    created_at: new Date(Date.now() - 172800000).toISOString(),
    published: true
  }
]

/**
 * Helper to get all published posts
 * 
 * SORTING LOGIC:
 * - Posts with is_read_first = true appear first (pinned instructional content)
 * - Then regular posts sorted by created_at DESC (newest first)
 * 
 * This ensures the "Read This First" instructional post is always visible to new readers
 * while maintaining chronological order for weekly articles.
 */
export async function getPosts(limit?: number): Promise<Post[]> {
  // Return mock data if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase not configured, returning mock data')
    return MOCK_POSTS
  }

  try {
    const supabase = createServerClient()

    // Fetch all published posts (don't apply limit yet - need to sort first)
    const query = supabase
      .from('posts')
      .select('*')
      .eq('published', true)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return []
    }

    // Sort: is_read_first posts first, then by created_at DESC
    const sorted = (data as Post[]).sort((a, b) => {
      // Pinned posts (is_read_first = true) always come first
      if (a.is_read_first && !b.is_read_first) return -1
      if (!a.is_read_first && b.is_read_first) return 1
      
      // Within same category, sort by date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Apply limit if specified
    if (limit) {
      return sorted.slice(0, limit)
    }

    return sorted
  } catch (error) {
    console.warn('Error connecting to Supabase, returning mock data:', error)
    return MOCK_POSTS
  }
}

// Helper to get a single post by slug
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const mock = MOCK_POSTS.find(p => p.slug === slug)
    return mock || null
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  return data as Post
}

// Helper to get recent post titles (for avoiding duplicate topics)
export async function getRecentPostTitles(count: number = 30): Promise<string[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return MOCK_POSTS.map(p => p.title).slice(0, count)
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('posts')
    .select('title')
    .order('created_at', { ascending: false })
    .limit(count)

  if (error) {
    console.error('Error fetching recent titles:', error)
    return []
  }

  return data.map(post => post.title)
}

// Helper to create a new post
export async function createPost(post: Omit<Post, 'id' | 'created_at'>): Promise<Post | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select()
    .single()

  if (error) {
    console.error('Error creating post:', error)
    // Throw error with details for better debugging
    throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
  }

  return data as Post
}

// Helper to create a weekly email companion
export async function createWeeklyEmail(email: Omit<WeeklyEmail, 'id' | 'created_at'>): Promise<WeeklyEmail | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('weekly_emails')
    .insert([email])
    .select()
    .single()

  if (error) {
    console.error('Error creating weekly email:', error)
    throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
  }

  return data as WeeklyEmail
}

// Helper to get the email companion for a post
export async function getWeeklyEmailByPostId(postId: string): Promise<WeeklyEmail | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('weekly_emails')
    .select('*')
    .eq('post_id', postId)
    .single()

  if (error) {
    console.error('Error fetching weekly email:', error)
    return null
  }

  return data as WeeklyEmail
}

// Helper to get all active subscribers
export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('unsubscribed', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching subscribers:', error)
    return []
  }

  return data as Subscriber[]
}

// Helper to update weekly email sent status
export async function updateWeeklyEmailSentStatus(
  emailId: string,
  sentCount: number
): Promise<void> {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('weekly_emails')
    .update({
      sent: true,
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
    })
    .eq('id', emailId)

  if (error) {
    console.error('Error updating email sent status:', error)
    throw new Error(`Failed to update email status: ${error.message}`)
  }
}

