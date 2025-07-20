'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type AuthUser } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 확인
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(transformUser(session.user))
      }
      setLoading(false)
    }

    getSession()

    // 인증 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(transformUser(session.user))
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const transformUser = (user: User): AuthUser => ({
    id: user.id,
    email: user.email || '',
    displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || ''
  })

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error: getErrorMessage(error.message) }
      }

      return { data }
    } catch (err) {
      console.error('Sign in exception:', err)
      return { error: '로그인 중 오류가 발생했습니다' }
    }
  }

  const getErrorMessage = (message: string): string => {
    if (message.includes('Invalid login credentials')) {
      return '이메일 또는 비밀번호가 올바르지 않습니다'
    }
    if (message.includes('User already registered')) {
      return '이미 등록된 이메일입니다'
    }
    if (message.includes('Password should be at least')) {
      return '비밀번호는 최소 6자 이상이어야 합니다'
    }
    if (message.includes('Unable to validate email address')) {
      return '올바른 이메일 주소를 입력해주세요'
    }
    return message
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim()
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        return { error: getErrorMessage(error.message) }
      }

      // 이메일 확인이 필요한 경우
      if (data.user && !data.session) {
        return { error: '이메일 확인이 필요합니다. 이메일을 확인해주세요.' }
      }

      return { data }
    } catch (err) {
      console.error('Sign up exception:', err)
      return { error: '회원가입 중 오류가 발생했습니다' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}