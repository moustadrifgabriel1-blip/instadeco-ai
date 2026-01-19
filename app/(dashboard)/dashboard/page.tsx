'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase/config';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  ImageIcon, 
  Sparkles, 
  LogOut, 
  CreditCard, 
  Download, 
  Home,
  User,
  Lock,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Clock,
  Filter,
  Coins
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface Generation {
  id: string;
  styleSlug: string;
  roomTypeSlug: string;
  inputImageUrl: string;
  outputImageUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  errorMessage?: string;
  hdUnlocked?: boolean;
  stripeSessionId?: string;
}

type FilterStatus = 'all' | 'completed' | 'processing' | 'failed';
type ActiveTab = 'generations' | 'account' | 'security';

// ============================================
// STYLE NAMES MAPPING
// ============================================
const STYLE_NAMES: Record<string, string> = {
  moderne: 'Moderne',
  minimaliste: 'Minimaliste',
  boheme: 'Bohème',
  industriel: 'Industriel',
  classique: 'Classique',
  japandi: 'Japandi',
  midcentury: 'Mid-Century',
  coastal: 'Coastal',
  farmhouse: 'Farmhouse',
  artdeco: 'Art Déco',
};

const ROOM_NAMES: Record<string, string> = {
  salon: 'Salon',
  chambre: 'Chambre',
  cuisine: 'Cuisine',
  'salle-de-bain': 'Salle de bain',
  bureau: 'Bureau',
  'salle-a-manger': 'Salle à manger',
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function DashboardPage() {
  const { user, loading: authLoading, credits } = useAuth();
  const router = useRouter();
  
  // State
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
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
  // LOAD GENERATIONS
  // ============================================
  const loadGenerations = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      console.log('[Dashboard] Chargement des générations pour:', user.uid);
      const response = await fetch(`/api/generations?userId=${user.uid}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Dashboard] Générations reçues:', data.generations?.length || 0);
        setGenerations(data.generations || []);
      } else {
        const errorText = await response.text();
        console.error('[Dashboard] Erreur API:', response.status, errorText);
      }
    } catch (error) {
      console.error('[Dashboard] Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user) {
      loadGenerations();
    }
  }, [user, loadGenerations]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = async () => {
    try {
      await signOut(auth);
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
      // Ré-authentifier l'utilisateur
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Changer le mot de passe
      await updatePassword(user, newPassword);
      
      setPasswordSuccess('Mot de passe modifié avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/wrong-password') {
        setPasswordError('Mot de passe actuel incorrect');
      } else {
        setPasswordError('Erreur lors du changement de mot de passe');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownload = async (generation: Generation, isHD: boolean = false) => {
    if (!generation.outputImageUrl) return;
    
    if (isHD) {
      // Vérifier si déjà débloqué
      if (generation.hdUnlocked) {
        // Télécharger directement l'image HD
        try {
          const response = await fetch(generation.outputImageUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `instadeco-hd-${generation.id.slice(0, 8)}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Erreur téléchargement HD:', error);
          alert('Erreur lors du téléchargement');
        }
        return;
      }
      
      // Rediriger vers Stripe pour achat HD
      try {
        const response = await fetch('/api/hd-unlock/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            generationId: generation.id, 
            userId: user?.uid,
            userEmail: user?.email,
          }),
        });
        const data = await response.json();
        
        if (data.alreadyUnlocked) {
          // Recharger les générations pour mettre à jour l'état
          loadGenerations();
          alert('Cette image est déjà débloquée ! Vous pouvez la télécharger.');
          return;
        }
        
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert(data.error || 'Erreur lors de la création du paiement');
        }
      } catch {
        alert('Erreur lors de la redirection vers le paiement');
      }
    } else {
      // Téléchargement aperçu (avec filigrane potentiel)
      try {
        const response = await fetch(generation.outputImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `instadeco-apercu-${generation.id.slice(0, 8)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Erreur téléchargement:', error);
        alert('Erreur lors du téléchargement');
      }
    }
  };

  // ============================================
  // FILTERED DATA
  // ============================================
  const filteredGenerations = filterStatus === 'all' 
    ? generations 
    : generations.filter(g => {
        if (filterStatus === 'processing') {
          return g.status === 'pending' || g.status === 'processing';
        }
        return g.status === filterStatus;
      });

  // ============================================
  // LOADING STATE
  // ============================================
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ============================================ */}
      {/* NAVIGATION */}
      {/* ============================================ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                InstaDeco
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link 
                href="/" 
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                Accueil
              </Link>
              <Link 
                href="/generate" 
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <Sparkles className="h-4 w-4" />
                Générer
              </Link>
              <Link 
                href="/pricing" 
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <CreditCard className="h-4 w-4" />
                Tarifs
              </Link>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-4">
              {/* Credits Badge */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-3 py-1.5 rounded-full">
                <Coins className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">{credits}</span>
                <span className="text-xs text-purple-600">crédits</span>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.displayName || 'Utilisateur'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    
                    <button
                      onClick={() => { setActiveTab('account'); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Mon compte
                    </button>
                    
                    <button
                      onClick={() => { setActiveTab('security'); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Sécurité
                    </button>
                    
                    <Link
                      href="/pricing"
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Acheter des crédits
                    </Link>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('generations')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'generations'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Mes créations
            </div>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'account'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Mon compte
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Sécurité
            </div>
          </button>
        </div>

        {/* ============================================ */}
        {/* TAB: GENERATIONS */}
        {/* ============================================ */}
        {activeTab === 'generations' && (
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mes créations</h1>
                <p className="text-gray-600 mt-1">
                  {generations.length} génération{generations.length > 1 ? 's' : ''}
                </p>
              </div>
              <Button
                onClick={() => router.push('/generate')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Nouvelle génération
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : generations.length === 0 ? (
              <Card className="max-w-lg mx-auto text-center py-12">
                <CardContent>
                  <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune génération pour le moment
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Commencez par créer votre première décoration IA !
                  </p>
                  <Button
                    onClick={() => router.push('/generate')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Commencer maintenant
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Filters */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  <Filter className="h-4 w-4 text-gray-500" />
                  {(['all', 'completed', 'processing', 'failed'] as FilterStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        filterStatus === status
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {status === 'all' && `Tout (${generations.length})`}
                      {status === 'completed' && `Terminés (${generations.filter(g => g.status === 'completed').length})`}
                      {status === 'processing' && `En cours (${generations.filter(g => g.status === 'pending' || g.status === 'processing').length})`}
                      {status === 'failed' && `Échoués (${generations.filter(g => g.status === 'failed').length})`}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGenerations.map((gen) => (
                    <div 
                      key={gen.id} 
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-gray-100">
                        {gen.outputImageUrl ? (
                          <Image
                            src={gen.outputImageUrl}
                            alt={`${STYLE_NAMES[gen.styleSlug] || gen.styleSlug} - ${ROOM_NAMES[gen.roomTypeSlug] || gen.roomTypeSlug}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : gen.status === 'failed' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-red-500">
                            <AlertCircle className="h-12 w-12 mb-2" />
                            <p className="text-sm font-medium">Échec</p>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                            <p className="text-sm text-gray-500">En cours...</p>
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          {gen.status === 'completed' && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Terminé
                            </span>
                          )}
                          {gen.status === 'failed' && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                              <X className="h-3 w-3" />
                              Échoué
                            </span>
                          )}
                          {(gen.status === 'pending' || gen.status === 'processing') && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              En cours
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {STYLE_NAMES[gen.styleSlug] || gen.styleSlug}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {ROOM_NAMES[gen.roomTypeSlug] || gen.roomTypeSlug}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(gen.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        
                        {/* Actions */}
                        {gen.status === 'completed' && gen.outputImageUrl && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(gen, false)}
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Aperçu
                            </Button>
                            {gen.hdUnlocked ? (
                              <Button
                                size="sm"
                                onClick={() => handleDownload(gen, true)}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                HD ✓
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleDownload(gen, true)}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                HD 4,99€
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: ACCOUNT */}
        {/* ============================================ */}
        {activeTab === 'account' && (
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon compte</h1>
            
            <div className="space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations personnelles</CardTitle>
                  <CardDescription>Vos informations de compte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input 
                      value={user?.email || ''} 
                      disabled 
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nom</label>
                    <Input 
                      value={user?.displayName || 'Non défini'} 
                      disabled 
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Membre depuis</label>
                    <Input 
                      value={user?.metadata?.creationTime 
                        ? new Date(user.metadata.creationTime).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })
                        : 'Non disponible'
                      } 
                      disabled 
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Credits Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Crédits</CardTitle>
                  <CardDescription>Gérez vos crédits de génération</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <Coins className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{credits}</p>
                        <p className="text-sm text-gray-600">crédits disponibles</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/pricing')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Acheter des crédits
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistiques</CardTitle>
                  <CardDescription>Votre activité sur InstaDeco</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-gray-900">{generations.length}</p>
                      <p className="text-sm text-gray-600">Générations</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-green-600">
                        {generations.filter(g => g.status === 'completed').length}
                      </p>
                      <p className="text-sm text-gray-600">Réussies</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-purple-600">{credits}</p>
                      <p className="text-sm text-gray-600">Crédits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: SECURITY */}
        {/* ============================================ */}
        {activeTab === 'security' && (
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Sécurité</h1>
            
            <div className="space-y-6">
              {/* Change Password Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Changer le mot de passe</CardTitle>
                  <CardDescription>
                    Mettez à jour votre mot de passe pour sécuriser votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Mot de passe actuel
                      </label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Nouveau mot de passe
                      </label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Confirmer le nouveau mot de passe
                      </label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    {passwordError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {passwordError}
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {passwordSuccess}
                      </div>
                    )}
                    
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      {isChangingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      Modifier le mot de passe
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Sessions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sessions</CardTitle>
                  <CardDescription>Gérez vos connexions actives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Session actuelle</p>
                      <p className="text-sm text-gray-500">
                        Dernière connexion: {user?.metadata?.lastSignInTime 
                          ? new Date(user.metadata.lastSignInTime).toLocaleString('fr-FR')
                          : 'Non disponible'
                        }
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Se déconnecter de tous les appareils
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Zone de danger</CardTitle>
                  <CardDescription>Actions irréversibles</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    La suppression de votre compte est définitive et toutes vos données seront perdues.
                  </p>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled
                  >
                    Supprimer mon compte
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Contactez le support pour supprimer votre compte.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Close menu on click outside */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)} 
        />
      )}
    </div>
  );
}
