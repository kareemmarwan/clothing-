import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qejqsijsoeallzqtkmuw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlanFzaWpzb2VhbGx6cXRrbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NTQxMjQsImV4cCI6MjEwNDQzMDEyNH0.z7LxGWkoOilYPgl_fPs238GGicCGIAJvNg4y9R86A2Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlanFzaWpzb2VhbGx6cXRrbXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODg1NDEyNCwiZXhwIjoyMTA0NDMwMTI0fQ.FpUL5aLB1WKmX_MVKdE30IUKuGxJwN092pDVHe3L_sY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
