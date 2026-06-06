'use client';

import { useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

/** Évalue la force d'un mot de passe (3 niveaux). */
export function getPasswordStrength(pwd: string): PasswordStrength {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

  if (score <= 2) return { score: 1, label: 'Faible', color: 'bg-red-500' };
  if (score <= 4) return { score: 2, label: 'Moyen', color: 'bg-amber-500' };
  return { score: 3, label: 'Fort', color: 'bg-green-500' };
}

/**
 * Changement de mot de passe via Supabase Auth (avec validations).
 */
export function usePasswordChange(user: User | null, supabase: SupabaseClient | null) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setPasswordError('Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre');
      return;
    }

    if (!user?.email) {
      setPasswordError('Email non disponible');
      return;
    }

    if (!supabase) {
      setPasswordError('Configuration indisponible. Réessayez dans un instant.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordSuccess('Mot de passe modifié avec succès !');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const authError = error as { message?: string };
      setPasswordError(authError.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    passwordSuccess,
    isChangingPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleChangePassword,
  };
}
