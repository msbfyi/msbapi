import { signal, computed } from '@preact/signals-core'
import { supabase } from '../lib/supabase.js'

// Auth state
export const authState = signal({
  user: null,
  session: null,
  loading: true,
  error: null,
})

// Computed values
export const isAuthenticated = computed(() => !!authState.value.user)
export const isLoading = computed(() => authState.value.loading)

// Auth service
class AuthService {
  constructor() {
    this.initializeAuth()
  }

  async initializeAuth() {
    try {
      // Get initial session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      authState.value = {
        user: session?.user || null,
        session,
        loading: false,
        error: error?.message || null,
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        authState.value = {
          user: session?.user || null,
          session,
          loading: false,
          error: null,
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      authState.value = {
        user: null,
        session: null,
        loading: false,
        error: error.message,
      }
    }
  }

  async signIn(email, password) {
    authState.value = { ...authState.value, loading: true, error: null }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        authState.value = {
          ...authState.value,
          loading: false,
          error: error.message,
        }
      }

      return { data, error }
    } catch (error) {
      authState.value = {
        ...authState.value,
        loading: false,
        error: error.message,
      }
      return { data: null, error }
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error) {
      return { error }
    }
  }
}

export const authService = new AuthService()
