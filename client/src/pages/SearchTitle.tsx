// src/pages/SearchTitle.tsx
import { useState } from 'react';
import { useContract } from '../hooks/useContract';
import {
  formatTimestamp, ipfsUrl, shortAddress,
  isValidParcelId, type LandTitle,
} from '../lib/contract';
import { PageHeader, StatusBadge, InfoRow, ApprovalDots, EmptyState } from '../components/ui';

export default function SearchTitle() {
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
      setError('Invalid parcel ID format. Expected format: CMR-XX-XXX-000');
      return;
    }

    setLoading(true);
    try {
      const [result, hist] = await Promise.all([
        verifyTitle(id),
        getHistory(id),
      ]);
      setTitle(result ?? 'not-found');
      setHistory(hist as string[]);
    } catch {
      setError('Failed to query the blockchain. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const found = title && title !== 'not-found' ? (title as LandTitle) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        icon="⊹"
        title="Search Title"
        subtitle="Look up any land parcel by its official parcel ID"
      />

      {/* ── Search form ───────────────────────────────────────── */}
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
            ) : 'Search'}
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2">
          Format: CMR-[Region Code]-[City Code]-[Number] &nbsp;·&nbsp; Example: CMR-SW-BUEA-001
        </p>
        {error && (
          <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
            <span>✕</span> {error}
          </p>
        )}
      </form>

      {/* ── No result ─────────────────────────────────────────── */}
      {title === 'not-found' && (
        <div className="card p-8 text-center">
          <p className="text-slate-500 text-3xl mb-3">◯</p>
          <p className="text-slate-300 font-medium mb-1">No title found</p>
          <p className="text-slate-500 text-sm">
            No land title registered under <span className="mono text-amber-400/70">{query}</span>.
            Check the parcel ID and try again.
          </p>
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────── */}
      {found && (
        <div className="space-y-4 fade-up">

          {/* Title card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Land Title</p>
                <h2 className="display text-xl text-slate-100 font-semibold mono">
                  {found.parcelId}
                </h2>
              </div>
              <StatusBadge status={found.status} />
            </div>

            <div>
              <InfoRow label="Region"   value={found.region} />
              <InfoRow
                label="Owner"
                value={
                  <span className="flex items-center gap-2 justify-end flex-wrap">
                    <span className="mono">{shortAddress(found.owner)}</span>
                    <a
                      href={`https://sepolia.etherscan.io/address/${found.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400/60 hover:text-amber-400 text-xs"
                    >
                      ↗
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(found.owner)}
                      className="text-slate-600 hover:text-slate-400 text-xs"
                      title="Copy full address"
                    >
                      ⧉
                    </button>
                  </span>
                }
              />
              <InfoRow
                label="Approvals"
                value={<ApprovalDots count={found.approvalCount} />}
              />
              <InfoRow label="Registered" value={formatTimestamp(found.registeredAt)} />
              <InfoRow label="Last Updated" value={formatTimestamp(found.updatedAt)} />
            </div>
          </div>

          {/* Document card */}
          {found.ipfsCID && (
            <div className="card p-5">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">
                Title Document
              </p>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-slate-500 text-xs mb-1">IPFS Content Hash</p>
                  <p className="mono text-xs text-slate-400 truncate">{found.ipfsCID}</p>
                </div>
                <a
                  href={ipfsUrl(found.ipfsCID)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs px-4 py-2 flex-shrink-0"
                >
                  View Document ↗
                </a>
              </div>
              <p className="text-slate-600 text-xs mt-3">
                This hash is stored permanently on-chain. Any tampering with the document
                will produce a different hash, making fraud immediately detectable.
              </p>
            </div>
          )}

          {/* Ownership history */}
          {history.length > 0 && (
            <div className="card p-5">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">
                Ownership History
              </p>
              <div className="space-y-0">
                {history.map((addr, i) => (
                  <div key={i} className="relative flex items-start gap-3 pb-4">
                    {i < history.length - 1 && (
                      <div className="timeline-line" />
                    )}
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium relative z-10"
                      style={{
                        background: i === history.length - 1
                          ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                          : 'rgba(251,191,36,0.1)',
                        color: i === history.length - 1 ? '#0a0f1a' : '#fbbf24',
                        border: '1px solid rgba(251,191,36,0.25)',
                      }}
                    >
                      {history.length - i}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="mono text-xs text-slate-300 truncate">{addr}</p>
                      <p className="text-slate-600 text-xs mt-0.5">
                        {i === 0 ? 'Original owner' : i === history.length - 1 ? 'Current owner' : `Previous owner`}
                      </p>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/address/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400/40 hover:text-amber-400 text-xs flex-shrink-0 pt-0.5"
                    >
                      ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification note */}
          <div
            className="rounded-lg p-4 text-xs text-slate-500 flex items-start gap-2"
            style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.08)' }}
          >
            <span className="text-amber-400/40 flex-shrink-0 mt-0.5">◈</span>
            <p>
              This data is read directly from the Ethereum Sepolia blockchain and cannot
              be altered by any party. The ownership record above is the canonical truth
              as recognised by the TerraProof smart contract.
            </p>
          </div>
        </div>
      )}

      {/* ── Idle state ────────────────────────────────────────── */}
      {title === null && !loading && (
        <EmptyState
          icon="⊹"
          message="Enter a parcel ID above to look up its title, owner, approval status and document."
        />
      )}
    </div>
  );
}
