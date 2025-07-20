import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://llytukvdaeeypqshqczo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseXR1a3ZkYWVleXBxc2hxY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzkyNjQsImV4cCI6MjA2ODU1NTI2NH0.bfxl0pptEHJ3DypkWTUJw4Y2yYJ9gi3FLbIEk-D_QFs'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export type User = {
  id: string
  email: string
  user_metadata: {
    display_name?: string
  }
}

export type AuthUser = {
  id: string
  email: string
  displayName: string
}