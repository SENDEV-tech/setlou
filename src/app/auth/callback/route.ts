import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const rawNext = searchParams.get('next') ?? '/confirmed'
  // Uniquement des chemins internes (évite une redirection vers un autre site).
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/confirmed'
  const isPasswordReset = next.startsWith('/reinitialiser-mot-de-passe')

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    if (!isPasswordReset) {
      return NextResponse.redirect(`${origin}/confirmed`)
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Lien de réinitialisation expiré, déjà utilisé ou ouvert dans un autre navigateur.
  if (isPasswordReset) {
    return NextResponse.redirect(`${origin}/mot-de-passe-oublie?expire=1`)
  }

  return NextResponse.redirect(`${origin}/confirmed`)
}
