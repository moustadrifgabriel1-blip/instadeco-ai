'use client';

import { useEffect, useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Édition du profil (nom d'affichage) via Supabase Auth.
 */
export function useProfileSettings(user: User | null, supabase: SupabaseClient | null) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Initialise le nom depuis les métadonnées utilisateur.
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || '');
    }
  }, [user]);

  const cancelEditing = () => {
    setIsEditingProfile(false);
    setDisplayName(user?.user_metadata?.display_name || user?.user_metadata?.full_name || '');
  };

  const handleSaveProfile = async () => {
    if (!supabase) {
      setProfileError('Configuration indisponible. Réessayez dans un instant.');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          full_name: displayName.trim(),
        },
      });

      if (error) throw error;

      setProfileSuccess('Profil mis à jour !');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error: unknown) {
      const authError = error as { message?: string };
      setProfileError(authError.message || 'Erreur lors de la mise à jour');
    } finally {
      setProfileSaving(false);
    }
  };

  return {
    isEditingProfile,
    setIsEditingProfile,
    displayName,
    setDisplayName,
    profileSaving,
    profileSuccess,
    profileError,
    cancelEditing,
    handleSaveProfile,
  };
}
