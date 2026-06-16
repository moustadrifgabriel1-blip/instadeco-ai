'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Loader2, Trash2, Building2, ArrowRight, Mail } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  role: 'owner' | 'member';
  status: 'active' | 'pending' | 'removed';
}
interface OrgView {
  organization: { id: string; name: string; seats: number; status: string } | null;
  members: Member[];
  seatsUsed: number;
  seatsTotal: number;
}

export function TeamTab() {
  const [data, setData] = useState<OrgView | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v2/organization', { cache: 'no-store' });
      if (!res.ok) throw new Error('Chargement impossible');
      setData(await res.json());
    } catch {
      setError('Impossible de charger votre équipe.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v2/organization/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Invitation impossible');
      setInviteEmail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invitation impossible');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v2/organization/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Retrait impossible');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retrait impossible');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#1d1d1f]" />
      </div>
    );
  }

  // Pas d'organisation → l'utilisateur n'a pas l'offre Agence.
  if (!data || !data.organization) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e5e7] p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E07B54]/10 flex items-center justify-center mx-auto mb-5">
          <Building2 className="w-7 h-7 text-[#E07B54]" />
        </div>
        <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Gérez votre équipe avec l&apos;offre Agence</h2>
        <p className="text-[#636366] max-w-md mx-auto mb-6">
          Invitez jusqu&apos;à 3 collaborateurs, partagez les générations illimitées et
          centralisez la facturation.
        </p>
        <Link
          href="/pro"
          className="inline-flex items-center gap-2 bg-[#E07B54] hover:bg-[#D4603C] text-white px-6 py-3 rounded-full font-semibold transition-colors"
        >
          Découvrir l&apos;offre Agence <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const seatsFull = data.seatsUsed >= data.seatsTotal;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#e5e5e7] p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
            <Users className="w-5 h-5" /> {data.organization.name}
          </h2>
          <span className="text-sm text-[#636366]">
            {data.seatsUsed}/{data.seatsTotal} sièges utilisés
          </span>
        </div>
        <p className="text-sm text-[#636366]">
          Les membres partagent les générations illimitées de l&apos;abonnement Agence.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Inviter */}
      <form onSubmit={handleInvite} className="bg-white rounded-2xl border border-[#e5e5e7] p-6">
        <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Inviter un membre</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-[#8e8e93] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@agence.com"
              disabled={seatsFull || busy}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#e5e5e7] focus:border-[#1d1d1f] outline-none disabled:bg-[#f5f5f7]"
            />
          </div>
          <button
            type="submit"
            disabled={seatsFull || busy || !inviteEmail.trim()}
            className="inline-flex items-center justify-center gap-2 bg-[#1d1d1f] hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Inviter'}
          </button>
        </div>
        {seatsFull && (
          <p className="text-sm text-[#636366] mt-2">
            Tous les sièges sont occupés. Retirez un membre, ou{' '}
            <a href="mailto:contact@instadeco.app?subject=Sièges%20supplémentaires" className="text-[#E07B54] underline">
              demandez des sièges supplémentaires
            </a>.
          </p>
        )}
      </form>

      {/* Membres */}
      <div className="bg-white rounded-2xl border border-[#e5e5e7] divide-y divide-[#f0f0f2]">
        {data.members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-[#1d1d1f] font-medium">{m.email}</p>
              <p className="text-xs text-[#8e8e93]">
                {m.role === 'owner' ? 'Propriétaire' : 'Membre'}
                {m.status === 'pending' && ' · invitation en attente'}
              </p>
            </div>
            {m.role !== 'owner' && (
              <button
                onClick={() => handleRemove(m.id)}
                disabled={busy}
                className="text-[#8e8e93] hover:text-red-600 transition-colors disabled:opacity-50"
                aria-label="Retirer le membre"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
