// src/pages/DisputeReject.tsx
import { useState } from 'react';
import { useContract } from '../hooks/useContract';
import {
  isValidParcelId, formatTimestamp, type LandTitle, TitleStatus,
} from '../lib/contract';
import {
  PageHeader, TxFeedback, ConnectPrompt, RoleGuard,
  StatusBadge, InfoRow,
} from '../components/ui';

export default function DisputeReject() {
  const {
    wallet, connectWallet,
    verifyTitle, raiseDispute, rejectTitle,
    tx, resetTx,
  } = useContract();

  const [query,    setQuery]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [title,    setTitle]    = useState<LandTitle | null | 'not-found'>(null);
  const [fetchErr, setFetchErr] = useState('');
  const [confirm,  setConfirm]  = useState<'dispute' | 'reject' | null>(null);

  const canAccess = wallet.roles.isRegistrar || wallet.roles.isApprover;

  if (!wallet.isConnected) return <ConnectPrompt onConnect={connectWallet} />;
  if (!canAccess) return (
    <RoleGuard allowed={false} roleName="Registrar or Approver"><></></RoleGuard>
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = query.trim().toUpperCase();
    if (!id) return;
    setFetchErr('');
    setTitle(null);
    setConfirm(null);

    if (!isValidParcelId(id)) {
      setFetchErr('Invalid parcel ID format. Expected: CMR-XX-XXX-000');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyTitle(id);
      setTitle(result ?? 'not-found');
    } catch {
      setFetchErr('Failed to query the blockchain.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'dispute' | 'reject') {
    resetTx();
    setConfirm(null);
    const id = query.trim().toUpperCase();
    try {
      if (action === 'dispute') await raiseDispute(id);
      else                      await rejectTitle(id);
      const updated = await verifyTitle(id);
      setTitle(updated);
    } catch { /* handled by hook */ }
  }

  const found = title && title !== 'not-found' ? title as LandTitle : null;
  const actionable =
    found &&
    found.status !== TitleStatus.Disputed &&
    found.status !== TitleStatus.Rejected;

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        icon="⚑"
        title="Dispute / Reject"
        subtitle="Flag a fraudulent or erroneous land title submission"
      />

      {/* Warning banner */}
      <div
        className="rounded-lg p-4 mb-8 flex items-start gap-3 text-sm"
        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}
      >
        <span className="flex-shrink-0 text-base">⚑</span>
        <div>
          <p className="font-medium text-red-300 mb-1">Use with caution</p>
          <p className="text-xs">
            Disputing or rejecting a title flags it permanently on-chain.
            This action cannot be reversed without admin intervention.
            Only use this for confirmed cases of fraud or error.
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
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

      {title === 'not-found' && (
        <div className="card p-6 text-center">
          <p className="text-slate-400 text-sm">No parcel found for <span className="mono text-amber-400/70">{query}</span></p>
        </div>
      )}

      {found && (
        <div className="space-y-4 fade-up">

          {/* Title state */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <h2 className="display text-lg text-slate-100 mono">{found.parcelId}</h2>
              <StatusBadge status={found.status} />
            </div>
            <InfoRow label="Region"      value={found.region} />
            <InfoRow label="Registered"  value={formatTimestamp(found.registeredAt)} />
            <InfoRow label="Last Update" value={formatTimestamp(found.updatedAt)} />
          </div>

          {/* Already disputed/rejected */}
          {!actionable && (
            <div
              className="rounded-lg p-4 text-sm text-slate-400 flex items-center gap-2"
              style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}
            >
              <span>◈</span>
              This title is already{' '}
              <strong className="text-slate-300 ml-1">
                {found.status === TitleStatus.Disputed ? 'disputed' : 'rejected'}
              </strong>
              . No further action is available.
            </div>
          )}

          {/* Actions */}
          {actionable && (
            <div className="card p-5 space-y-4">
              <p className="text-slate-400 text-xs uppercase tracking-widest">
                Available Actions
              </p>

              {/* Dispute — registrar only */}
              {wallet.roles.isRegistrar && (
                <div>
                  {confirm !== 'dispute' ? (
                    <div
                      className="rounded-lg p-4 flex items-start justify-between gap-3 flex-wrap"
                      style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}
                    >
                      <div>
                        <p className="text-slate-200 text-sm font-medium">Raise Dispute</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Blocks all transfers. Status → Disputed. Registrar action.
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirm('dispute')}
                        className="btn-ghost text-xs px-4 py-2 flex-shrink-0"
                        style={{ borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24' }}
                      >
                        Raise Dispute
                      </button>
                    </div>
                  ) : (
                    <div
                      className="rounded-lg p-4 space-y-3"
                      style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}
                    >
                      <p className="text-amber-300 text-sm font-medium">Confirm: Raise Dispute?</p>
                      <p className="text-slate-400 text-xs">
                        This will set the title to <strong>Disputed</strong> and block all ownership transfers.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction('dispute')}
                          disabled={tx.loading}
                          className="btn-primary text-xs px-4 py-2"
                          style={{ background: '#f59e0b' }}
                        >
                          {tx.loading ? 'Broadcasting…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirm(null)}
                          className="btn-ghost text-xs px-4 py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reject — approver only, pending titles */}
              {wallet.roles.isApprover && found.status === TitleStatus.Pending && (
                <div>
                  {confirm !== 'reject' ? (
                    <div
                      className="rounded-lg p-4 flex items-start justify-between gap-3 flex-wrap"
                      style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}
                    >
                      <div>
                        <p className="text-slate-200 text-sm font-medium">Reject Title</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Permanently rejects this submission. Status → Rejected. Approver action.
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirm('reject')}
                        className="text-xs px-4 py-2 rounded-lg flex-shrink-0 transition-colors"
                        style={{
                          background: 'rgba(248,113,113,0.1)',
                          border: '1px solid rgba(248,113,113,0.3)',
                          color: '#f87171',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div
                      className="rounded-lg p-4 space-y-3"
                      style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
                    >
                      <p className="text-red-300 text-sm font-medium">Confirm: Reject this title?</p>
                      <p className="text-slate-400 text-xs">
                        This will permanently reject <span className="mono">{found.parcelId}</span>.
                        The submission will be archived as invalid on-chain.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction('reject')}
                          disabled={tx.loading}
                          className="text-xs px-4 py-2 rounded-lg transition-colors"
                          style={{ background: '#ef4444', color: '#fff' }}
                        >
                          {tx.loading ? 'Broadcasting…' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => setConfirm(null)}
                          className="btn-ghost text-xs px-4 py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <TxFeedback {...tx} onClose={resetTx} />
        </div>
      )}
    </div>
  );
}
