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

// Helper to get all published posts
export async function getPosts(limit?: number): Promise<Post[]> {
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
}

// Helper to get a single post by slug
export async function getPostBySlug(slug: string): Promise<Post | null> {
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

