import { supabase } from './supabaseClient'

export type UserRole = 'admin' | 'manager' | 'member'

export interface Profile {
  id: string
  email: string | null
  displayName: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ProfileRow {
  id: string
  email: string | null
  display_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (error) {
    throw error
  }

  return mapProfile(data)
}