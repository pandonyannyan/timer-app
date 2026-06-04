import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../services/supabaseClient'
import { getCurrentProfile, type Profile } from '../services/profileService'
import { getCurrentSession, signInWithEmail, signOut } from '../services/authService'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    session: null,
    user: null,
    profile: null,
    isLoading: false,
    isInitialized: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.session && state.user),
    role: (state) => state.profile?.role ?? null,
    isAdmin: (state) => state.profile?.role === 'admin',
    isManager: (state) => state.profile?.role === 'manager',
    isMember: (state) => state.profile?.role === 'member',
    isActiveUser: (state) => state.profile?.isActive === true,
  },

  actions: {
    async initialize() {
      try {
        this.isLoading = true
        this.error = null

        const session = await getCurrentSession()

        this.session = session
        this.user = session?.user ?? null
        this.profile = session ? await getCurrentProfile() : null
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to initialize auth'
        this.session = null
        this.user = null
        this.profile = null
      } finally {
        this.isLoading = false
        this.isInitialized = true
      }
    },

    listenToAuthChanges() {
      return supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
          this.isLoading = true
          this.error = null

          this.session = session
          this.user = session?.user ?? null
          this.profile = session ? await getCurrentProfile() : null
        } catch (error) {
          this.error = error instanceof Error ? error.message : 'Failed to update auth state'
          this.session = null
          this.user = null
          this.profile = null
        } finally {
          this.isLoading = false
          this.isInitialized = true
        }
      })
    },

    async login(email: string, password: string) {
      try {
        this.isLoading = true
        this.error = null

        const data = await signInWithEmail(email, password)

        this.session = data.session
        this.user = data.user
        this.profile = await getCurrentProfile()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to sign in'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        this.isLoading = true
        this.error = null

        await signOut()

        this.session = null
        this.user = null
        this.profile = null
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to sign out'
        throw error
      } finally {
        this.isLoading = false
        this.isInitialized = true
      }
    },
  },
})