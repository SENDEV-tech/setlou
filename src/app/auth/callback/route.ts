import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/tableau-de-bord'
  // Uniquement des chemins internes (évite une redirection vers un autre site).
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/tableau-de-bord'
  const isPasswordReset = next.startsWith('/reinitialiser-mot-de-passe')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Lien de réinitialisation expiré, déjà utilisé ou ouvert dans un autre navigateur.
  if (isPasswordReset) {
    return NextResponse.redirect(`${origin}/mot-de-passe-oublie?expire=1`)
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=Impossible de se connecter avec Google`)
}
