// src/pages/RequestTransfer.tsx
import { useState } from 'react';
import { useContract } from '../hooks/useContract';
import {
  isValidParcelId, shortAddress, type LandTitle, TitleStatus,
} from '../lib/contract';
import {
  PageHeader, TxFeedback, ConnectPrompt,
  StatusBadge, InfoRow,
} from '../components/ui';

type Mode = 'request' | 'confirm';

export default function RequestTransfer() {
  const {
    wallet, connectWallet,
    verifyTitle, getPendingTransfer,
    requestTransfer, confirmTransfer,
    tx, resetTx,
  } = useContract();

  const [mode,       setMode]       = useState<Mode>('request');
  const [query,      setQuery]      = useState('');
  const [newOwner,   setNewOwner]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [title,      setTitle]      = useState<LandTitle | null | 'not-found'>(null);
  const [pending,    setPending]    = useState<string | null>(null);
  const [fetchErr,   setFetchErr]   = useState('');
  const [fieldErr,   setFieldErr]   = useState('');

  if (!wallet.isConnected) return <ConnectPrompt onConnect={connectWallet} />;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = query.trim().toUpperCase();
    if (!id) return;
    setFetchErr('');
    setTitle(null);
    setPending(null);

    if (!isValidParcelId(id)) {
      setFetchErr('Invalid parcel ID format. Expected: CMR-XX-XXX-000');
      return;
    }

    setLoading(true);
    try {
      const [result, pend] = await Promise.all([
        verifyTitle(id),
        getPendingTransfer(id),
      ]);
      setTitle(result ?? 'not-found');
      setPending(pend);
    } catch {
      setFetchErr('Failed to query the blockchain.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest() {
    setFieldErr('');
    if (!/^0x[0-9a-fA-F]{40}$/.test(newOwner)) {
      setFieldErr('Enter a valid Ethereum address (0x...)');
      return;
    }
    resetTx();
    try {
      await requestTransfer(query.toUpperCase(), newOwner as `0x${string}`);
      setPending(newOwner);
      setNewOwner('');
    } catch { /* handled */ }
  }

  async function handleConfirm() {
    resetTx();
    try {
      await confirmTransfer(query.toUpperCase());
      const updated = await verifyTitle(query.toUpperCase());
      setTitle(updated);
      setPending(null);
    } catch { /* handled */ }
  }

  const found = title && title !== 'not-found' ? title as LandTitle : null;
  const isOwner = found && wallet.address?.toLowerCase() === found.owner.toLowerCase();

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        icon="⇄"
        title="Ownership Transfer"
        subtitle="Two-step transfer: owner requests, registrar confirms"
      />

      {/* Mode toggle */}
      <div
        className="flex rounded-lg p-1 mb-8"
        style={{ background: 'rgba(30,42,58,0.8)', border: '1px solid rgba(251,191,36,0.1)' }}
      >
        {(['request', 'confirm'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setTitle(null); setPending(null); setQuery(''); resetTx(); }}
            className={`flex-1 py-2 text-sm rounded-md font-medium transition-all ${
              mode === m
                ? 'text-slate-950'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={mode === m ? { background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' } : {}}
          >
            {m === 'request' ? '① Request Transfer' : '② Confirm Transfer'}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <label className="block text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">
          Parcel ID
        </label>
        <div className="flex gap-2">
          <input
            className="input-field mono flex-1"
            placeholder="CMR-SW-BUEA-001"
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary px-5 py-2.5 text-sm flex-shrink-0"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : 'Load'}
          </button>
        </div>
        {fetchErr && <p className="text-red-400 text-xs mt-1">{fetchErr}</p>}
      </form>

      {/* Not found */}
      {title === 'not-found' && (
        <div className="card p-6 text-center">
          <p className="text-slate-400 text-sm">No parcel found for <span className="mono text-amber-400/70">{query}</span></p>
        </div>
      )}

      {/* Result */}
      {found && (
        <div className="space-y-4 fade-up">

          {/* Current state */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <h2 className="display text-lg text-slate-100 mono">{found.parcelId}</h2>
              <StatusBadge status={found.status} />
            </div>
            <InfoRow label="Current Owner" value={<span className="mono">{shortAddress(found.owner)}</span>} />
            {pending && (
              <InfoRow
                label="Pending Transfer To"
                value={
                  <span className="mono text-amber-400">{shortAddress(pending)}</span>
                }
              />
            )}
          </div>

          {/* ── Request mode ───────────────────────────────────── */}
          {mode === 'request' && (
            <div className="card p-5">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">
                Request Transfer (Owner only)
              </p>

              {found.status !== TitleStatus.Approved && (
                <div className="rounded-lg p-3 text-sm text-slate-400" style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}>
                  This title must be <strong className="text-emerald-400">Approved</strong> before it can be transferred.
                </div>
              )}

              {found.status === TitleStatus.Approved && !isOwner && (
                <div className="rounded-lg p-3 text-sm text-slate-400" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}>
                  Only the registered owner can request a transfer. Your connected wallet does not match the owner address.
                </div>
              )}

              {found.status === TitleStatus.Approved && isOwner && (
                <>
                  {pending ? (
                    <div className="rounded-lg p-3 text-sm flex items-center gap-2" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                      <span>◎</span>
                      Transfer to <span className="mono ml-1">{shortAddress(pending)}</span> is pending registrar confirmation.
                    </div>
                  ) : (
                    <>
                      <label className="block text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">
                        New Owner Address
                      </label>
                      <input
                        className="input-field mono mb-2"
                        placeholder="0x..."
                        value={newOwner}
                        onChange={e => setNewOwner(e.target.value)}
                        disabled={tx.loading}
                        spellCheck={false}
                      />
                      {fieldErr && <p className="text-red-400 text-xs mb-2">{fieldErr}</p>}
                      <p className="text-slate-600 text-xs mb-4">
                        The buyer's Ethereum wallet address. The registrar must then confirm this transfer.
                      </p>
                      <TxFeedback {...tx} onClose={resetTx} />
                      <button
                        onClick={handleRequest}
                        disabled={tx.loading || !newOwner}
                        className="btn-primary w-full py-2.5 text-sm mt-2"
                      >
                        {tx.loading ? 'Broadcasting…' : 'Request Transfer'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Confirm mode ───────────────────────────────────── */}
          {mode === 'confirm' && (
            <div className="card p-5">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">
                Confirm Transfer (Registrar only)
              </p>

              {!wallet.roles.isRegistrar && (
                <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}>
                  Only a Registrar can confirm transfers.
                </div>
              )}

              {wallet.roles.isRegistrar && !pending && (
                <div className="rounded-lg p-3 text-sm text-slate-400" style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}>
                  No pending transfer for this parcel.
                </div>
              )}

              {wallet.roles.isRegistrar && pending && (
                <>
                  <p className="text-slate-400 text-sm mb-2">
                    Confirming this transfer will permanently change the registered owner on-chain.
                  </p>
                  <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                    <p className="text-xs text-slate-500 mb-1">Transferring to</p>
                    <p className="mono text-sm text-amber-300">{pending}</p>
                  </div>
                  <TxFeedback {...tx} onClose={resetTx} />
                  <button
                    onClick={handleConfirm}
                    disabled={tx.loading}
                    className="btn-primary w-full py-2.5 text-sm mt-2"
                  >
                    {tx.loading ? 'Broadcasting…' : 'Confirm Transfer'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
