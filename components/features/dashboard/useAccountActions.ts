'use client';

import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Actions RGPD du compte : export des données + suppression de compte.
 */
export function useAccountActions(
  supabase: SupabaseClient | null,
  onAccountDeleted: () => void,
) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/v2/user/export');
      if (!response.ok) throw new Error('Erreur export');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `instadeco-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER MON COMPTE') return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/v2/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'SUPPRIMER MON COMPTE' }),
      });
      if (!response.ok) throw new Error('Erreur suppression');
      if (supabase) {
        await supabase.auth.signOut();
      }
      onAccountDeleted();
    } catch (err) {
      console.error('Delete error:', err);
      setIsDeleting(false);
    }
  };

  return {
    showDeleteModal,
    setShowDeleteModal,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeleting,
    isExporting,
    handleExportData,
    handleDeleteAccount,
  };
}
