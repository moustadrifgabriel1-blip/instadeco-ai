'use client';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { usePasswordChange, getPasswordStrength } from './usePasswordChange';

interface SecurityTabProps {
  user: User | null;
  supabase: SupabaseClient | null;
}

export function SecurityTab({ user, supabase }: SecurityTabProps) {
  const pwd = usePasswordChange(user, supabase);
  const { newPassword, confirmPassword } = pwd;
  const strength = getPasswordStrength(newPassword);

  return (
    <div>
      <h1 className="prestige-display text-2xl font-semibold text-foreground mb-6">Sécurité</h1>
      <Card>
        <CardHeader>
          <CardTitle className="prestige-display flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>Choisissez un mot de passe fort pour protéger votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={pwd.handleChangePassword} className="space-y-5">
            {/* New password */}
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={pwd.showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => pwd.setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => pwd.setShowNewPassword(!pwd.showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {pwd.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          strength.score >= level ? strength.color : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.score === 1 ? 'text-destructive' : strength.score === 2 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    Force : {strength.label}
                  </p>

                  {/* Critères */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {newPassword.length >= 8 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      8 caractères min.
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {/[A-Z]/.test(newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      1 majuscule
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[a-z]/.test(newPassword) ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {/[a-z]/.test(newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      1 minuscule
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {/[0-9]/.test(newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      1 chiffre
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      1 caractère spécial
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={pwd.showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => pwd.setConfirmPassword(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => pwd.setShowConfirmPassword(!pwd.showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {pwd.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Les mots de passe ne correspondent pas
                </p>
              )}
              {confirmPassword.length > 0 && newPassword === confirmPassword && (
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Les mots de passe correspondent
                </p>
              )}
            </div>

            {pwd.passwordError && (
              <div role="alert" className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {pwd.passwordError}
              </div>
            )}
            {pwd.passwordSuccess && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {pwd.passwordSuccess}
              </div>
            )}
            <Button
              type="submit"
              disabled={pwd.isChangingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full"
            >
              {pwd.isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Modification...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Changer le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
