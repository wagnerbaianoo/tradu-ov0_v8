import { create } from 'zustand'
import { createClient } from '../lib/supabase/client'

interface User {
  id: string
  email: string
  name?: string
  role: 'USER' | 'TRANSLATOR' | 'ADMIN' | 'SUPER_ADMIN'
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  checkAuth: async () => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', authUser.id)
          .single()
        
        const user: User = {
          id: authUser.id,
          email: authUser.email!,
          name: userData?.name,
          role: userData?.role || 'USER'
        }
        
        set({ user, isAuthenticated: true, isLoading: false })
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  }
}))