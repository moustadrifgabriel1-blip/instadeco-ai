'use client';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, Pencil, Save, X, CheckCircle2, XCircle, FileDown, Trash2, AlertTriangle,
} from 'lucide-react';
import { useProfileSettings } from './useProfileSettings';
import { useAccountActions } from './useAccountActions';

interface AccountTabProps {
  user: User | null;
  supabase: SupabaseClient | null;
  credits: number;
  /** Abonné Pro/Agence illimité : on affiche « Illimité » au lieu d'un solde. */
  unlimited?: boolean;
  generationsCount: number;
  onAccountDeleted: () => void;
}

export function AccountTab({ user, supabase, credits, unlimited, generationsCount, onAccountDeleted }: AccountTabProps) {
  const profile = useProfileSettings(user, supabase);
  const account = useAccountActions(supabase, onAccountDeleted);

  return (
    <div className="space-y-6">
      <h1 className="prestige-display text-2xl font-semibold text-foreground mb-6">Mon compte</h1>

      {/* Profil Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Vos informations personnelles</CardDescription>
          </div>
          {!profile.isEditingProfile ? (
            <Button variant="outline" size="sm" onClick={() => profile.setIsEditingProfile(true)} className="gap-2">
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={profile.cancelEditing}>
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={profile.handleSaveProfile} disabled={profile.profileSaving} className="gap-2">
                {profile.profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Sauvegarder
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.profileSuccess && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              {profile.profileSuccess}
            </div>
          )}
          {profile.profileError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              <XCircle className="w-4 h-4" />
              {profile.profileError}
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Nom d&apos;affichage</label>
              {profile.isEditingProfile ? (
                <Input
                  value={profile.displayName}
                  onChange={(e) => profile.setDisplayName(e.target.value)}
                  placeholder="Votre nom"
                  className="max-w-sm"
                />
              ) : (
                <p className="text-foreground">
                  {user?.user_metadata?.display_name || user?.user_metadata?.full_name || (
                    <span className="text-muted-foreground italic">Non renseigné</span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
              <p className="text-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
          <CardDescription>Votre activité sur InstaDeco</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted border border-[var(--gold-line)] rounded-xl p-4 text-center">
              <div className="prestige-display text-2xl font-bold text-primary">
                {unlimited ? 'Illimité' : credits}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {unlimited ? 'Générations' : 'Crédits disponibles'}
              </div>
            </div>
            <div className="bg-muted border border-border rounded-xl p-4 text-center">
              <div className="prestige-display text-2xl font-bold text-foreground">{generationsCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Créations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mes données (RGPD) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Mes données personnelles
          </CardTitle>
          <CardDescription>Conformément au RGPD, vous pouvez exporter ou supprimer vos données</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={account.handleExportData} disabled={account.isExporting} className="flex-1 gap-2">
              {account.isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Exporter mes données
            </Button>
            <Button
              variant="outline"
              onClick={() => account.setShowDeleteModal(true)}
              className="flex-1 gap-2 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer mon compte
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            L&apos;export contient toutes vos données personnelles au format JSON.
          </p>
        </CardContent>
      </Card>

      {/* Modale de suppression */}
      {account.showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          onClick={() => { account.setShowDeleteModal(false); account.setDeleteConfirmText(''); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') { account.setShowDeleteModal(false); account.setDeleteConfirmText(''); } }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 id="delete-modal-title" className="prestige-display text-lg font-semibold text-foreground">Supprimer mon compte</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Cette action est <strong className="text-destructive">irréversible</strong>. Toutes vos données seront définitivement supprimées :
            </p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1 list-disc pl-5">
              <li>Votre profil et informations personnelles</li>
              <li>Toutes vos générations et images</li>
              <li>Votre historique de crédits et transactions</li>
            </ul>
            <p className="text-sm text-foreground font-medium mb-2">
              Tapez <code className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded text-xs">SUPPRIMER MON COMPTE</code> pour confirmer :
            </p>
            <Input
              value={account.deleteConfirmText}
              onChange={(e) => account.setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER MON COMPTE"
              className="mb-4 font-mono"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { account.setShowDeleteModal(false); account.setDeleteConfirmText(''); }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={account.handleDeleteAccount}
                disabled={account.deleteConfirmText !== 'SUPPRIMER MON COMPTE' || account.isDeleting}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {account.isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
