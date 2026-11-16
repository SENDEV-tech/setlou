import { NextResponse } from 'next/server'
import { type EmailOtpType, type User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { FREE_PLAN } from '@/server/data/plan'
import { generateUniqueShopSlug } from '@/app/actions/auth'

async function ensureShopAndProfileForUser(user: User) {
  const adminClient = createAdminClient()

  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, shop_id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile?.shop_id) {
    return
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Vendeur'

  let { data: shop } = await adminClient
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!shop) {
    const defaultShopName = `Boutique ${fullName}`.slice(0, 60)
    const slug = await generateUniqueShopSlug(adminClient, defaultShopName)
    const { data: createdShop } = await adminClient
      .from('shops')
      .insert({
        owner_id: user.id,
        name: defaultShopName,
        slug,
        whatsapp_number: '',
        subscription_plan: 'free',
        subscription_status: null,
        subscription_provider: null,
        paid_until: null,
        monthly_orders_limit: FREE_PLAN.monthlyOrders,
        max_assistants: FREE_PLAN.assistants,
      })
      .select('id')
      .single()

    shop = createdShop
  }

  if (shop) {
    await adminClient.from('profiles').upsert({
      id: user.id,
      shop_id: shop.id,
      role: 'owner',
      full_name: fullName,
      username: (user.email || 'vendeur').split('@')[0],
      whatsapp_number: '',
      is_active: true,
      must_change_password: false,
    })
  }
}

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      if (data.user && !isPasswordReset) {
        await ensureShopAndProfileForUser(data.user)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    if (!isPasswordReset) {
      return NextResponse.redirect(`${origin}/confirmed`)
    }
  }

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      if (data.user && !isPasswordReset) {
        await ensureShopAndProfileForUser(data.user)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Lien de réinitialisation expiré, déjà utilisé ou ouvert dans un autre navigateur.
  if (isPasswordReset) {
    return NextResponse.redirect(`${origin}/mot-de-passe-oublie?expire=1`)
  }

  return NextResponse.redirect(`${origin}/confirmed`)
}
