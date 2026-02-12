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
import { ShareButtons } from '@/components/features/share-buttons';
import { 
  Loader2, 
  Download, 
  Sparkles, 
  Check, 
  ImageIcon,
  CreditCard,
  Shield,
  LogOut,
  User,
  ChevronDown,
  Coins,
  Clock,
  AlertCircle,
  Filter,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  X,
  Gift,
  Copy,
  Share2,
  Users,
  Trash2,
  FileDown,
  AlertTriangle,
} from 'lucide-react';
import { useGenerations } from '@/src/presentation/hooks/useGenerations';
import { useCredits } from '@/src/presentation/hooks/useCredits';
import { useHDUnlock } from '@/src/presentation/hooks/useHDUnlock';
import { STYLES, ROOM_TYPES } from '@/src/shared/constants/styles';

// ============================================
// TYPES
// ============================================
type FilterStatus = 'all' | 'completed' | 'processing' | 'failed';
type ActiveTab = 'generations' | 'account' | 'security' | 'referral';

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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Referral state
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState({ totalReferred: 0, totalCreditsEarned: 0 });
  const [referralCopied, setReferralCopied] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    // Initialiser le nom
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || '');
      // Charger les infos de parrainage
      fetch(`/api/v2/referral?userId=${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.referralCode) setReferralCode(data.referralCode);
          setReferralStats({
            totalReferred: data.totalReferred || 0,
            totalCreditsEarned: data.totalCreditsEarned || 0,
          });
        })
        .catch(() => {});
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
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      console.error('Delete error:', err);
      setIsDeleting(false);
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
    
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Vérification complexité
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
    
    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        throw error;
      }
      
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

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          display_name: displayName.trim(),
          full_name: displayName.trim(),
        }
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

  // Password strength checker
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
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
  };

  const handleUnlock = async (generationId: string) => {
    try {
      // Utiliser l'endpoint avec crédits au lieu de Stripe
      const response = await fetch('/api/v2/hd-unlock/with-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Pas assez de crédits - rediriger vers pricing
          alert('Crédits insuffisants. Achetez des crédits pour débloquer la HD.');
          router.push('/pricing');
          return;
        }
        throw new Error(data.error || 'Erreur lors du déblocage HD');
      }

      if (data.success) {
        // Rafraîchir les données
        refetchGenerations();
        refetchCredits();
      }
    } catch (error) {
      console.error('Erreur unlock:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors du déblocage HD');
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

    // Téléchargement standard avec filigrane via API serveur
    // Utilise l'API qui applique le filigrane côté serveur (évite les problèmes CORS)
    try {
      const downloadUrl = `/api/v2/download?id=${generationId}`;
      
      // Faire un fetch pour vérifier que l'API répond correctement
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur de téléchargement');
      }
      
      // Télécharger le blob avec le filigrane
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `instadeco-${generationId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      // SÉCURITÉ: Ne jamais permettre le téléchargement sans filigrane
      alert('Erreur lors du téléchargement. Veuillez réessayer ou débloquer la version HD.');
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
  // LOADING STATE
  // ============================================
  if (authLoading || generationsState.isLoading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1d1d1f] mx-auto" />
          <p className="mt-4 text-[#636366]">Chargement...</p>
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
              <Coins className="w-4 h-4 text-[#636366]" />
              <span className="text-sm font-medium text-[#1d1d1f]">
                {creditsState.isLoading ? '...' : credits}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f7] rounded-full transition-colors"
              >
                <User className="w-5 h-5 text-[#636366]" />
                <ChevronDown className="w-4 h-4 text-[#636366]" />
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
              <button
                onClick={() => setActiveTab('referral')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'referral'
                    ? 'bg-[#1d1d1f] text-white'
                    : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                <Gift className="w-5 h-5" />
                Parrainage
                {referralStats.totalReferred > 0 && (
                  <span className="ml-auto bg-[#E07B54] text-white text-xs px-2 py-0.5 rounded-full">
                    {referralStats.totalReferred}
                  </span>
                )}
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
                    <Filter className="w-4 h-4 text-[#636366]" />
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
                      <p className="text-[#636366]">Aucune création pour le moment</p>
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
                         <div className="flex flex-col gap-2 mt-2 px-1">
                          {gen.status === 'completed' && gen.outputImageUrl && (
                            <>
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
                              <ShareButtons
                                url="https://instadeco.app/galerie"
                                title={`Ma transformation déco en style ${gen.styleSlug.replace(/-/g, ' ')} 🏠✨`}
                                description={`${gen.roomType.replace(/-/g, ' ')} transformé en style ${gen.styleSlug.replace(/-/g, ' ')} avec l'IA`}
                                imageUrl={gen.outputImageUrl}
                                referralCode={referralCode || undefined}
                                variant="compact"
                              />
                            </>
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
              <div className="space-y-6">
                <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-6">Mon compte</h1>
                
                {/* Profil Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Profil</CardTitle>
                      <CardDescription>Vos informations personnelles</CardDescription>
                    </div>
                    {!isEditingProfile ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingProfile(true)}
                        className="gap-2"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Modifier
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setIsEditingProfile(false);
                            setDisplayName(user?.user_metadata?.display_name || user?.user_metadata?.full_name || '');
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSaveProfile}
                          disabled={profileSaving}
                          className="gap-2"
                        >
                          {profileSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Sauvegarder
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profileSuccess && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        {profileSuccess}
                      </div>
                    )}
                    {profileError && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                        <XCircle className="w-4 h-4" />
                        {profileError}
                      </div>
                    )}
                    
                    <div className="grid gap-4">
                      <div>
                        <label className="text-sm font-medium text-[#636366] mb-1 block">Nom d&apos;affichage</label>
                        {isEditingProfile ? (
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Votre nom"
                            className="max-w-sm"
                          />
                        ) : (
                          <p className="text-[#1d1d1f]">
                            {user?.user_metadata?.display_name || user?.user_metadata?.full_name || <span className="text-[#636366] italic">Non renseigné</span>}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#636366] mb-1 block">Email</label>
                        <p className="text-[#1d1d1f]">{user?.email}</p>
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
                      <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FFF0EB] rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-[#E07B54]">{credits}</div>
                        <div className="text-sm text-[#6B6B6B] mt-1">Crédits disponibles</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#F0F7FF] to-[#E8F0FE] rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-[#0071e3]">{generations.length}</div>
                        <div className="text-sm text-[#6B6B6B] mt-1">Créations</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mes données (RGPD) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileDown className="w-5 h-5 text-[#0071e3]" />
                      Mes données personnelles
                    </CardTitle>
                    <CardDescription>Conformément au RGPD, vous pouvez exporter ou supprimer vos données</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        onClick={handleExportData}
                        disabled={isExporting}
                        className="flex-1 gap-2"
                      >
                        {isExporting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileDown className="w-4 h-4" />
                        )}
                        Exporter mes données
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteModal(true)}
                        className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer mon compte
                      </Button>
                    </div>
                    <p className="text-xs text-[#636366]">
                      L&apos;export contient toutes vos données personnelles au format JSON.
                    </p>
                  </CardContent>
                </Card>

                {/* Modale de suppression */}
                {showDeleteModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="delete-modal-title"
                      className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => { if (e.key === 'Escape') { setShowDeleteModal(false); setDeleteConfirmText(''); } }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 id="delete-modal-title" className="text-lg font-semibold text-[#1d1d1f]">Supprimer mon compte</h3>
                      </div>
                      <p className="text-sm text-[#6B6B6B] mb-4">
                        Cette action est <strong className="text-red-600">irréversible</strong>. Toutes vos données seront définitivement supprimées :
                      </p>
                      <ul className="text-sm text-[#6B6B6B] mb-4 space-y-1 list-disc pl-5">
                        <li>Votre profil et informations personnelles</li>
                        <li>Toutes vos générations et images</li>
                        <li>Votre historique de crédits et transactions</li>
                      </ul>
                      <p className="text-sm text-[#1d1d1f] font-medium mb-2">
                        Tapez <code className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-xs">SUPPRIMER MON COMPTE</code> pour confirmer :
                      </p>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="SUPPRIMER MON COMPTE"
                        className="mb-4 font-mono"
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== 'SUPPRIMER MON COMPTE' || isDeleting}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-6">Sécurité</h1>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#E07B54]" />
                      Changer le mot de passe
                    </CardTitle>
                    <CardDescription>
                      Choisissez un mot de passe fort pour protéger votre compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-5">
                      {/* New password */}
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-[#636366] mb-1.5">
                          Nouveau mot de passe
                        </label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 8 caractères"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#636366] hover:text-[#1d1d1f] transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                                    getPasswordStrength(newPassword).score >= level
                                      ? getPasswordStrength(newPassword).color
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className={`text-xs font-medium ${
                              getPasswordStrength(newPassword).score === 1 ? 'text-red-500' :
                              getPasswordStrength(newPassword).score === 2 ? 'text-amber-500' : 'text-green-500'
                            }`}>
                              Force : {getPasswordStrength(newPassword).label}
                            </p>
                            
                            {/* Critères */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                              <div className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-green-600' : 'text-[#636366]'}`}>
                                {newPassword.length >= 8 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                8 caractères min.
                              </div>
                              <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-[#636366]'}`}>
                                {/[A-Z]/.test(newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                1 majuscule
                              </div>
                              <div className={`flex items-center gap-1.5 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-[#636366]'}`}>
                                {/[a-z]/.test(newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                1 minuscule
                              </div>
                              <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-[#636366]'}`}>
                                {/[0-9]/.test(newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                1 chiffre
                              </div>
                              <div className={`flex items-center gap-1.5 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-600' : 'text-[#636366]'}`}>
                                {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                1 caractère spécial
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm password */}
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-[#636366] mb-1.5">
                          Confirmer le mot de passe
                        </label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Retapez le mot de passe"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#636366] hover:text-[#1d1d1f] transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Les mots de passe ne correspondent pas
                          </p>
                        )}
                        {confirmPassword.length > 0 && newPassword === confirmPassword && (
                          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Les mots de passe correspondent
                          </p>
                        )}
                      </div>

                      {passwordError && (
                        <div role="alert" className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                          <XCircle className="w-4 h-4 flex-shrink-0" />
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          {passwordSuccess}
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={isChangingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                        className="w-full"
                      >
                        {isChangingPassword ? (
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
            )}

            {/* Referral Tab */}
            {activeTab === 'referral' && (
              <div>
                <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-6">Parrainage</h1>
                
                {/* Referral value prop */}
                <div className="bg-gradient-to-r from-[#FFF8F5] to-[#FFF0EB] rounded-2xl p-6 border border-[#F5D5C8] mb-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#E07B54] flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#1d1d1f] mb-1">
                        Invitez vos amis, gagnez des crédits
                      </h2>
                      <p className="text-sm text-[#6B6B6B]">
                        Pour chaque ami qui s&apos;inscrit avec votre code, vous recevez tous les deux <span className="font-bold text-[#E07B54]">3 crédits gratuits</span>. 
                        Plus vous parrainez, plus vous créez !
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Code */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-[#E07B54]" />
                      Votre code de parrainage
                    </CardTitle>
                    <CardDescription>Partagez ce code avec vos amis pour qu&apos;ils l&apos;utilisent lors de leur inscription</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 bg-[#f5f5f7] rounded-xl px-4 py-3 font-mono text-base sm:text-lg font-bold text-[#1d1d1f] tracking-widest text-center">
                        {referralCode || '...'}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (referralCode) {
                            navigator.clipboard.writeText(referralCode);
                            setReferralCopied(true);
                            setTimeout(() => setReferralCopied(false), 2000);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        {referralCopied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copier
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Share link */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const text = `Essaie InstaDeco AI pour redécorer ton intérieur ! Utilise mon code ${referralCode} pour obtenir 3 crédits gratuits 🎁 https://instadeco.app/signup?ref=${referralCode}`;
                          if (navigator.share) {
                            navigator.share({ title: 'InstaDeco AI', text });
                          } else {
                            navigator.clipboard.writeText(text);
                            setReferralCopied(true);
                            setTimeout(() => setReferralCopied(false), 2000);
                          }
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager le lien
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const text = encodeURIComponent(`Essaie InstaDeco AI pour redécorer ton intérieur ! Utilise mon code ${referralCode} pour 3 crédits gratuits 🎁`);
                          const url = encodeURIComponent(`https://instadeco.app/signup?ref=${referralCode}`);
                          window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                        }}
                      >
                        💬 WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Referral Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="w-8 h-8 text-[#E07B54] mx-auto mb-2" />
                        <div className="text-3xl font-bold text-[#1d1d1f]">{referralStats.totalReferred}</div>
                        <p className="text-sm text-[#636366]">Amis parrainés</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Sparkles className="w-8 h-8 text-[#E07B54] mx-auto mb-2" />
                        <div className="text-3xl font-bold text-[#1d1d1f]">{referralStats.totalCreditsEarned}</div>
                        <p className="text-sm text-[#636366]">Crédits gagnés</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* How it works */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comment ça marche ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { step: '1', title: 'Partagez votre code', desc: 'Envoyez votre code unique à vos amis par message, email ou réseaux sociaux.' },
                        { step: '2', title: 'Ils s\'inscrivent', desc: 'Vos amis créent un compte et saisissent votre code lors de l\'inscription.' },
                        { step: '3', title: 'Vous gagnez tous les deux', desc: 'Vous recevez chacun 3 crédits gratuits instantanément !' },
                      ].map(item => (
                        <div key={item.step} className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#E07B54] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            {item.step}
                          </div>
                          <div>
                            <h4 className="font-medium text-[#1d1d1f]">{item.title}</h4>
                            <p className="text-sm text-[#636366]">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
