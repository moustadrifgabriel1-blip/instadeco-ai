'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SmartGenerationCard } from '@/components/features/smart-generation-card';
import { 
  Loader2, 
  Download, 
  Sparkles, 
  Check, 
  ImageIcon,
  LayoutDashboard,
  CreditCard,
  Shield,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Coins,
  Clock,
  AlertCircle,
  Filter,
  Lock
} from 'lucide-react';
import { useGenerations } from '@/src/presentation/hooks/useGenerations';
import { useCredits } from '@/src/presentation/hooks/useCredits';
import { useHDUnlock } from '@/src/presentation/hooks/useHDUnlock';
import { STYLES, ROOM_TYPES } from '@/src/shared/constants/styles';

// ============================================
// TYPES
// ============================================
type FilterStatus = 'all' | 'completed' | 'processing' | 'failed';
type ActiveTab = 'generations' | 'account' | 'security';

// ============================================
// MAIN COMPONENT
// ============================================
export default function DashboardPageV2() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Nouveaux hooks de la couche Presentation
  const { generations, state: generationsState, refetch: refetchGenerations } = useGenerations({ limit: 50 });
  const { credits, state: creditsState, refetch: refetchCredits } = useCredits();
  const { unlock, isLoading: isUnlocking, error: hdError } = useHDUnlock();
  
  // State local
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('generations');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // ============================================
  // HANDLERS
  // ============================================
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    if (!user?.email) {
      setPasswordError('Email non disponible');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        throw error;
      }
      
      setPasswordSuccess('Mot de passe modifié avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      setPasswordError('Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUnlock = async (generationId: string) => {
    try {
      const checkoutUrl = await unlock({ generationId });
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Erreur unlock:', error);
    }
  };

  const handleDownload = async (generationId: string, outputUrl: string, isHD: boolean = false) => {
    if (!outputUrl) return;
    
    if (isHD) {
      // Rediriger vers checkout HD
      const checkoutUrl = await unlock({ generationId });
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
      return;
    }

    // Téléchargement standard avec filigrane
    try {
      const link = document.createElement('a');
      link.href = outputUrl;
      link.download = `instadeco-${generationId}.jpg`;
      link.click();
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  // ============================================
  // FILTERING
  // ============================================
  const filteredGenerations = generations.filter((gen) => {
    if (filterStatus === 'all') return true;
    return gen.status === filterStatus;
  });

  // ============================================
  // RENDER HELPERS
  // ============================================
  const getStyleName = (slug: string) => {
    const style = STYLES.find(s => s.id === slug || s.slug === slug);
    return style?.name || slug;
  };

  const getRoomName = (slug: string) => {
    const room = ROOM_TYPES.find(r => r.id === slug || r.slug === slug);
    return room?.name || slug;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <Check className="w-3 h-3" />
            Terminé
          </span>
        );
      case 'processing':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            <Clock className="w-3 h-3" />
            En cours
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
            <AlertCircle className="w-3 h-3" />
            Échec
          </span>
        );
      default:
        return null;
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (authLoading || generationsState.isLoading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1d1d1f] mx-auto" />
          <p className="mt-4 text-[#86868b]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Header */}
      <header className="border-b border-[#d2d2d7] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="text-lg sm:text-[21px] font-semibold text-[#1d1d1f]">
            InstaDeco
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f5f7] rounded-full">
              <Coins className="w-4 h-4 text-[#86868b]" />
              <span className="text-sm font-medium text-[#1d1d1f]">
                {creditsState.isLoading ? '...' : credits}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f7] rounded-full transition-colors"
              >
                <User className="w-5 h-5 text-[#86868b]" />
                <ChevronDown className="w-4 h-4 text-[#86868b]" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#d2d2d7] py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('generations')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'generations'
                    ? 'bg-[#1d1d1f] text-white'
                    : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                Mes créations
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'account'
                    ? 'bg-[#1d1d1f] text-white'
                    : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                <User className="w-5 h-5" />
                Mon compte
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'security'
                    ? 'bg-[#1d1d1f] text-white'
                    : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                <Lock className="w-5 h-5" />
                Sécurité
              </button>
              <Link
                href="/pricing"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Acheter des crédits
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Generations Tab */}
            {activeTab === 'generations' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-semibold text-[#1d1d1f]">Mes créations</h1>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#86868b]" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                      className="bg-[#f5f5f7] border-none rounded-lg px-3 py-2 text-sm text-[#1d1d1f]"
                    >
                      <option value="all">Toutes</option>
                      <option value="completed">Terminées</option>
                      <option value="processing">En cours</option>
                      <option value="failed">Échouées</option>
                    </select>
                  </div>
                </div>

                {filteredGenerations.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <ImageIcon className="w-12 h-12 text-[#d2d2d7] mx-auto mb-4" />
                      <p className="text-[#86868b]">Aucune création pour le moment</p>
                      <Link
                        href="/generate"
                        className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-[#1d1d1f] text-white rounded-full hover:bg-black transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Créer ma première image
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGenerations.map((gen) => (
                      <div key={gen.id}>
                        <SmartGenerationCard 
                          generation={gen} 
                          onStatusChange={(updated) => {
                             if (updated.status === 'completed' || updated.status === 'failed') {
                                refetchGenerations();
                             }
                          }}
                        >
                         <div className="flex justify-end mt-2 px-1">
                          {gen.status === 'completed' && gen.outputImageUrl && (
                            <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownload(gen.id, gen.outputImageUrl!, false)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  SD
                                </Button>
                                {!gen.hdUnlocked ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUnlock(gen.id)}
                                    disabled={isUnlocking}
                                  >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    HD (1 crédit)
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-200 bg-green-50"
                                    onClick={() => handleDownload(gen.id, gen.outputImageUrl!, false)}
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    HD
                                  </Button>
                                )}
                            </div>
                          )}
                        </div>
                        </SmartGenerationCard>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div>
                <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-6">Mon compte</h1>
                <Card>
                  <CardHeader>
                    <CardTitle>Informations</CardTitle>
                    <CardDescription>Vos informations de compte</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#86868b]">Email</label>
                      <p className="text-[#1d1d1f]">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#86868b]">ID utilisateur</label>
                      <p className="text-[#1d1d1f] text-sm font-mono">{user.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#86868b]">Crédits disponibles</label>
                      <p className="text-[#1d1d1f]">{credits} crédits</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#86868b]">Nombre de créations</label>
                      <p className="text-[#1d1d1f]">{generations.length} images</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-6">Sécurité</h1>
                <Card>
                  <CardHeader>
                    <CardTitle>Changer le mot de passe</CardTitle>
                    <CardDescription>Mettez à jour votre mot de passe</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#86868b] mb-1">
                          Nouveau mot de passe
                        </label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#86868b] mb-1">
                          Confirmer le mot de passe
                        </label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      {passwordError && (
                        <p className="text-sm text-red-500">{passwordError}</p>
                      )}
                      {passwordSuccess && (
                        <p className="text-sm text-green-500">{passwordSuccess}</p>
                      )}
                      <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Modification...
                          </>
                        ) : (
                          'Changer le mot de passe'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#d2d2d7] py-6 px-6 bg-[#f5f5f7] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#86868b]">
            © 2026 InstaDeco. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-xs text-[#424245]">
            <a href="#" className="hover:text-[#1d1d1f] transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-[#1d1d1f] transition-colors">Conditions</a>
            <a href="#" className="hover:text-[#1d1d1f] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
