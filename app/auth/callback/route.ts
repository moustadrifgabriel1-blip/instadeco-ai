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

    // Email de bienvenue, une seule fois par compte.
    // Avant : condition « compte créé il y a moins de 60 s », presque toujours
    // fausse avec la confirmation par email (l'utilisateur clique plus tard).
    // On se fonde désormais sur profiles.welcome_sent_at, posé AVANT l'envoi
    // pour qu'un double callback ne produise pas deux emails.
    if (data?.user?.email) {
      const user = data.user;
      const email = user.email as string;
      const { data: profil } = await supabase
        .from('profiles')
        .select('welcome_sent_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profil && !profil.welcome_sent_at) {
        const { error: markErr } = await supabase
          .from('profiles')
          .update({ welcome_sent_at: new Date().toISOString() })
          .eq('id', user.id)
          .is('welcome_sent_at', null);

        if (!markErr) {
          const name = user.user_metadata?.full_name || user.user_metadata?.name || null;
          // Envoyer en arrière-plan (ne pas bloquer le redirect)
          sendWelcomeEmail(email, name).catch((err) => {
            console.error('[Auth Callback] Welcome email failed:', err);
          });
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  const redirectPath = requestUrl.searchParams.get('redirect') || '/generate';
  // Sécurité : n'accepter que les chemins relatifs (pas de redirect externe)
  const safeRedirect = redirectPath.startsWith('/') ? redirectPath : '/generate';
  return NextResponse.redirect(`${origin}${safeRedirect}`);
}
