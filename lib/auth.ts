import { createBrowserClient } from './supabase'

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

