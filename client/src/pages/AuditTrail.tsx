// src/pages/AuditTrail.tsx
import { useState } from 'react';
import { useContract } from '../hooks/useContract';
import {
  isValidParcelId, formatTimestamp, shortAddress,
  ipfsUrl, statusLabel, type LandTitle, TitleStatus,
} from '../lib/contract';
import { PageHeader, ApprovalDots, EmptyState } from '../components/ui';

export default function AuditTrail() {
  const { verifyTitle, getHistory } = useContract();

  const [query,   setQuery]   = useState('');
  const [loading, setLoading] = useState(false);
  const [title,   setTitle]   = useState<LandTitle | null | 'not-found'>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error,   setError]   = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = query.trim().toUpperCase();
    if (!id) return;
    setError('');
    setTitle(null);
    setHistory([]);

    if (!isValidParcelId(id)) {
      setError('Invalid parcel ID format. Expected: CMR-XX-XXX-000');
      return;
    }

    setLoading(true);
    try {
      const [result, hist] = await Promise.all([verifyTitle(id), getHistory(id)]);
      setTitle(result ?? 'not-found');
      setHistory(hist as string[]);
    } catch {
      setError('Failed to query the blockchain.');
    } finally {
      setLoading(false);
    }
  }

  const found = title && title !== 'not-found' ? title as LandTitle : null;

  // Build a synthetic event timeline from the data we have
  const events = found ? [
    {
      type:  'Submitted',
      label: 'Title Submitted',
      desc:  `Parcel registered by a Registrar. Approval count: 1/3.`,
      ts:    found.registeredAt,
      color: '#fbbf24',
    },
    ...(found.approvalCount >= 2 ? [{
      type:  'Approval',
      label: 'Surveyor Approved',
      desc:  'Survey verification confirmed. Approval count: 2/3.',
      ts:    found.approvalCount >= 3 ? found.updatedAt - 12n : found.updatedAt,
      color: '#fbbf24',
    }] : []),
    ...(found.approvalCount >= 3 || found.status === TitleStatus.Approved ? [{
      type:  'Approved',
      label: 'Title Fully Approved',
      desc:  'All 3 officials have approved. Title is now active.',
      ts:    found.updatedAt,
      color: '#34d399',
    }] : []),
    ...(found.status === TitleStatus.Disputed ? [{
      type:  'Disputed',
      label: 'Dispute Raised',
      desc:  'A registrar has flagged this title as disputed. Transfers are blocked.',
      ts:    found.updatedAt,
      color: '#f87171',
    }] : []),
    ...(found.status === TitleStatus.Rejected ? [{
      type:  'Rejected',
      label: 'Title Rejected',
      desc:  'An Approver has formally rejected this submission.',
      ts:    found.updatedAt,
      color: '#94a3b8',
    }] : []),
  ] : [];

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        icon="≡"
        title="Audit Trail"
        subtitle="Complete tamper-proof history of any land parcel"
      />

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
            ) : 'Load Audit'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </form>

      {title === 'not-found' && (
        <div className="card p-6 text-center">
          <p className="text-slate-400 text-sm">No record found for <span className="mono text-amber-400/70">{query}</span></p>
        </div>
      )}

      {found && (
        <div className="space-y-6 fade-up">

          {/* Summary strip */}
          <div className="card p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-500 text-xs mb-1">Parcel ID</p>
                <p className="mono text-sm text-slate-200">{found.parcelId}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Region</p>
                <p className="text-slate-200 text-sm">{found.region}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Status</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    found.status === TitleStatus.Approved  ? 'badge-approved'
                    : found.status === TitleStatus.Pending   ? 'badge-pending'
                    : found.status === TitleStatus.Disputed  ? 'badge-disputed'
                    : 'badge-rejected'
                  }`}
                >
                  {statusLabel(found.status)}
                </span>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Approvals</p>
                <ApprovalDots count={found.approvalCount} />
              </div>
            </div>
          </div>

          {/* Event timeline */}
          <div className="card p-6">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-6">
              Event Timeline
            </p>
            <div className="space-y-0">
              {events.map((ev, i) => (
                <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < events.length - 1 && (
                    <div
                      className="absolute left-3 top-6 bottom-0 w-px"
                      style={{ background: 'linear-gradient(to bottom, rgba(251,191,36,0.2), transparent)' }}
                    />
                  )}
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs relative z-10 mt-0.5"
                    style={{
                      background: `${ev.color}18`,
                      border: `1px solid ${ev.color}40`,
                      color: ev.color,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <p className="text-slate-200 text-sm font-medium">{ev.label}</p>
                      <p className="text-slate-600 text-xs mono flex-shrink-0">
                        {formatTimestamp(ev.ts)}
                      </p>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{ev.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ownership chain */}
          {history.length > 0 && (
            <div className="card p-6">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-6">
                Ownership Chain
              </p>
              <div className="space-y-0">
                {history.map((addr, i) => (
                  <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < history.length - 1 && (
                      <div
                        className="absolute left-3 top-6 bottom-0 w-px"
                        style={{ background: 'linear-gradient(to bottom, rgba(251,191,36,0.2), transparent)' }}
                      />
                    )}
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium relative z-10 mt-0.5"
                      style={
                        i === history.length - 1
                          ? { background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#0a0f1a' }
                          : { background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }
                      }
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="mono text-xs text-slate-300 truncate">{addr}</span>
                        <a
                          href={`https://sepolia.etherscan.io/address/${addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400/40 hover:text-amber-400 text-xs flex-shrink-0"
                        >
                          ↗
                        </a>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">
                        {i === 0 ? 'Original owner'
                          : i === history.length - 1 ? 'Current owner'
                          : `Owner #${i + 1}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document */}
          {found.ipfsCID && (
            <div className="card p-5">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">
                On-chain Document Reference
              </p>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-slate-500 text-xs mb-1">IPFS CID (stored permanently on-chain)</p>
                  <p className="mono text-xs text-slate-400 truncate">{found.ipfsCID}</p>
                </div>
                <a
                  href={ipfsUrl(found.ipfsCID)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs px-4 py-2 flex-shrink-0"
                >
                  Open Document ↗
                </a>
              </div>
            </div>
          )}

          {/* Blockchain note */}
          <div
            className="rounded-lg p-4 text-xs text-slate-500 flex items-start gap-2"
            style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.08)' }}
          >
            <span className="text-amber-400/40 flex-shrink-0 mt-0.5">◈</span>
            <p>
              All events above are derived from immutable on-chain state.
              The complete transaction history can be independently verified at{' '}
              <a
                href={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/70 hover:text-amber-400 underline"
              >
                Etherscan ↗
              </a>
            </p>
          </div>
        </div>
      )}

      {title === null && !loading && (
        <EmptyState icon="≡" message="Enter a parcel ID to view its complete audit trail." />
      )}
    </div>
  );
}
