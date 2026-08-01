import { useState } from "react";
import { useContract } from "../hooks/useContract";
import {
  formatTimestamp,
  isValidParcelId,
  type LandTitle,
  TitleStatus,
} from "../lib/contract";
import {
  PageHeader,
  TxFeedback,
  ConnectPrompt,
  RoleGuard,
  StatusBadge,
  ApprovalDots,
  InfoRow,
} from "../components/ui";

export default function ApproveLand() {
  const {
    wallet,
    connectWallet,
    verifyTitle,
    getApprovalStatus,
    approveLand,
    tx,
    resetTx,
  } = useContract();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState<LandTitle | null | "not-found">(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [fetchErr, setFetchErr] = useState("");

  const canApprove =
    wallet.roles.isRegistrar ||
    wallet.roles.isSurveyor ||
    wallet.roles.isApprover;

  if (!wallet.isConnected) return <ConnectPrompt onConnect={connectWallet} />;
  if (!canApprove)
    return (
      <RoleGuard roleName="Registrar, Surveyor, or Approver">
        <></>
      </RoleGuard>
    );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = query.trim().toUpperCase();
    if (!id) return;
    setFetchErr("");
    setTitle(null);

    if (!isValidParcelId(id)) {
      setFetchErr("Invalid parcel ID format. Expected: CMR-XX-XXX-000");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyTitle(id);
      if (!result) {
        setTitle("not-found");
        return;
      }
      setTitle(result);

      if (wallet.address) {
        const voted = await getApprovalStatus(id, wallet.address);
        setAlreadyVoted(voted);
      }
    } catch {
      setFetchErr("Failed to query the blockchain.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    const id = query.trim().toUpperCase();
    resetTx();
    try {
      await approveLand(id);
      // Refresh
      const updated = await verifyTitle(id);
      setTitle(updated);
      setAlreadyVoted(true);
    } catch {
      /* tx state handled by hook */
    }
  }

  const found = title && title !== "not-found" ? (title as LandTitle) : null;

  const canVote =
    found &&
    found.status === TitleStatus.Pending &&
    !alreadyVoted &&
    !tx.loading;

  const roleLabel = wallet.roles.isApprover
    ? "Senior Approver"
    : wallet.roles.isSurveyor
      ? "Surveyor"
      : "Registrar";

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        icon="◎"
        title="Approve Title"
        subtitle="Approve land parcel. Your vote is crucial in validating legitimate land claims and ensuring the integrity of our land registry. Please review the parcel details carefully before approving."
      />

      {/* Role chip */}
      <div
        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6"
        style={{
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.2)",
          color: "#fbbf24",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#fbbf24", boxShadow: "0 0 4px #fbbf24" }}
        />
        You are voting as: {roleLabel}
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
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary px-5 py-2.5 text-sm flex-shrink-0"
          >
            {loading ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            ) : (
              "Load"
            )}
          </button>
        </div>
        {fetchErr && <p className="text-red-400 text-xs mt-1">{fetchErr}</p>}
      </form>

      {/* Not found */}
      {title === "not-found" && (
        <div className="card p-6 text-center">
          <p className="text-slate-400 text-sm">
            No parcel found for{" "}
            <span className="mono text-amber-400/70">{query}</span>
          </p>
        </div>
      )}

      {/* Result */}
      {found && (
        <div className="space-y-4 fade-up">
          {/* Title info */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
              <h2 className="display text-lg text-slate-100 font-semibold mono">
                {found.parcelId}
              </h2>
              <StatusBadge status={found.status} />
            </div>
            <InfoRow label="Region" value={found.region} />
            <InfoRow
              label="Registered"
              value={formatTimestamp(found.registeredAt)}
            />
            <InfoRow
              label="Approvals"
              value={<ApprovalDots count={found.approvalCount} />}
            />
          </div>

          {/* Approval action */}
          <div className="card p-6">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">
              Your Vote
            </p>

            {found.status !== TitleStatus.Pending && (
              <div
                className="rounded-lg p-4 text-sm text-slate-400 flex items-center gap-2"
                style={{
                  background: "rgba(100,116,139,0.1)",
                  border: "1px solid rgba(100,116,139,0.2)",
                }}
              >
                <span>◈</span>
                This parcel is{" "}
                <strong className="text-slate-300 ml-1">
                  {found.status === TitleStatus.Approved
                    ? "already fully approved"
                    : found.status === TitleStatus.Disputed
                      ? "under dispute"
                      : "rejected"}
                </strong>{" "}
                — voting is closed.
              </div>
            )}

            {found.status === TitleStatus.Pending && alreadyVoted && (
              <div
                className="rounded-lg p-4 text-sm flex items-center gap-2"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  color: "#34d399",
                }}
              >
                <span>✓</span>
                You have already given your approval vote for this parcel.
              </div>
            )}

            {found.status === TitleStatus.Pending && !alreadyVoted && (
              <>
                <p className="text-slate-400 text-sm mb-4">
                  By approving, you confirm that you have independently verified
                  this land parcel and found the submission to be legitimate.
                  This action is{" "}
                  <strong className="text-slate-200">
                    permanent and cannot be undone
                  </strong>
                  .
                </p>
                <TxFeedback {...tx} onClose={resetTx} />
                <button
                  onClick={handleApprove}
                  disabled={!canVote}
                  className="btn-primary w-full py-3 text-sm mt-4"
                >
                  {tx.loading
                    ? "Broadcasting vote…"
                    : `Approve as ${roleLabel}`}
                </button>
              </>
            )}
          </div>

          <TxFeedback {...tx} onClose={resetTx} />
        </div>
      )}
    </div>
  );
}
