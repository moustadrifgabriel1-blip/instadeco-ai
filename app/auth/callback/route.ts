import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/notifications/marketing-emails';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('[Auth Callback] Error exchanging code:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }

    // Envoyer l'email de bienvenue pour les nouveaux utilisateurs
    if (data?.user) {
      const user = data.user;
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const isNewUser = (now.getTime() - createdAt.getTime()) < 60 * 1000; // Inscrit il y a moins de 60s

      if (isNewUser && user.email) {
        // Récupérer le nom depuis les métadonnées
        const name = user.user_metadata?.full_name || user.user_metadata?.name || null;
        
        // Envoyer en arrière-plan (ne pas bloquer le redirect)
        sendWelcomeEmail(user.email, name).catch((err) => {
          console.error('[Auth Callback] Welcome email failed:', err);
        });
      }
    }
  }

  // URL to redirect to after sign in process completes
  const redirectPath = requestUrl.searchParams.get('redirect') || '/generate';
  // Sécurité : n'accepter que les chemins relatifs (pas de redirect externe)
  const safeRedirect = redirectPath.startsWith('/') ? redirectPath : '/generate';
  return NextResponse.redirect(`${origin}${safeRedirect}`);
}
