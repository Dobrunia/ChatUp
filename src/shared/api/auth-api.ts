import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase-client'

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    throw error ?? new Error('Sign in failed')
  }
  return data.session
}

export async function signUp(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) {
    throw error ?? new Error('Sign up failed')
  }
  return data.user
}

export async function restoreSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw error
  }
  return data.session
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) {
    throw error
  }
}
