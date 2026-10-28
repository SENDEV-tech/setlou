import 'server-only';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// Liste des emails autorisés, séparés par des virgules dans ADMIN_EMAILS.
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

// Renvoie 404 à toute personne qui n'est pas administrateur de la plateforme.
export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();

  if (error || !email || !getAdminEmails().includes(email)) {
    notFound();
  }

  return { email };
}
