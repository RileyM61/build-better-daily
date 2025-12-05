import { createClient } from '@supabase/supabase-js'

// Types for our database
export interface Book {
  title: string
  author: string
  asin: string
  description: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  books: Book[]
  created_at: string
  published: boolean
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

// Helper to get all published posts
export async function getPosts(limit?: number): Promise<Post[]> {
  // Return mock data if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase not configured, returning mock data')
    return MOCK_POSTS
  }

  try {
    const supabase = createServerClient()

    let query = supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return []
    }

    return data as Post[]
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

