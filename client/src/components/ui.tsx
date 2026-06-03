import { statusClass, statusLabel, TitleStatus } from "../lib/contract";

// ─── TxFeedback ────
// Shows loading / error / success state after a contract write
interface TxFeedbackProps {
  loading: boolean;
  error: string | null;
  txHash: string | null;
  success: boolean;
  onClose?: () => void;
}

export function TxFeedback({
  loading,
  error,
  txHash,
  success,
  onClose,
}: TxFeedbackProps) {
  if (!loading && !error && !success) return null;

  return (
    <div
      className={`
      rounded-lg p-4 border text-sm flex items-start gap-3
      ${loading ? "bg-slate-800/60 border-slate-700 text-slate-300" : ""}
      ${error ? "bg-red-400/8 border-red-400/20 text-red-300" : ""}
      ${success ? "bg-emerald-400/8 border-emerald-400/20 text-emerald-300" : ""}
    `}
    >
      {loading && (
        <>
          <svg
            className="w-4 h-4 mt-0.5 animate-spin flex-shrink-0"
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
          <span>
            Broadcasting transaction… this takes ~15 seconds on Sepolia.
          </span>
        </>
      )}
      {error && (
        <>
          <span className="flex-shrink-0">✕</span>
          <div className="flex-1">
            <p className="font-medium">Transaction failed</p>
            <p className="text-red-400/70 text-xs mt-0.5 font-mono">{error}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-red-400/50 hover:text-red-400 ml-auto"
            >
              ✕
            </button>
          )}
        </>
      )}
      {success && txHash && (
        <>
          <span className="flex-shrink-0">✓</span>
          <div className="flex-1">
            <p className="font-medium">Transaction confirmed</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-xs text-emerald-400/70 hover:text-emerald-400 underline mt-0.5 block"
            >
              {txHash.slice(0, 18)}…{txHash.slice(-6)} ↗
            </a>
          </div>
        </>
      )}
    </div>
  );
}

// ─── StatusBadge ───────────────────────────────────────
export function StatusBadge({ status }: { status: TitleStatus }) {
  return (
    <span
      className={`${statusClass(status)} text-xs px-2.5 py-1 rounded-full font-medium`}
    >
      {statusLabel(status)}
    </span>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-amber-400 text-xl">{icon}</span>
        <h1 className="display text-2xl lg:text-3xl font-semibold text-slate-100">
          {title}
        </h1>
      </div>
      <p className="text-slate-500 text-sm ml-9">{subtitle}</p>
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-800/80 last:border-0">
      <span className="text-slate-500 text-sm flex-shrink-0">{label}</span>
      <span
        className={`text-slate-200 text-sm text-right ${mono ? "mono break-all" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  message,
}: {
  icon: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3 opacity-30">{icon}</span>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}

// ─── ConnectPrompt ────────────────────────────────────────────────────────────
export function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="card p-8 text-center max-w-md mx-auto mt-16">
      <p className="text-amber-400 text-3xl mb-4">⬡</p>
      <h2 className="display text-xl text-slate-200 mb-2">Wallet Required</h2>
      <p className="text-slate-500 text-sm mb-6">
        Connect your MetaMask wallet to perform any action.
      </p>
      <button onClick={onConnect} className="btn-primary px-6 py-2.5 text-sm">
        Connect MetaMask
      </button>
    </div>
  );
}

// ─── RoleGuard ────────────────────────────────────────────────────────────────
export function RoleGuard({
  allowed,
  roleName,
  children,
}: {
  allowed: boolean;
  roleName: string;
  children: React.ReactNode;
}) {
  if (allowed) return <>{children}</>;
  return (
    <div className="card p-8 text-center max-w-md mx-auto mt-16">
      <p className="text-red-400 text-3xl mb-4">⊗</p>
      <h2 className="display text-xl text-slate-200 mb-2">Access Restricted</h2>
      <p className="text-slate-500 text-sm">
        This page requires the{" "}
        <span className="text-amber-400 font-medium">{roleName}</span> role.
        Contact your system administrator to request access.
      </p>
    </div>
  );
}

// ─── ApprovalDots ─────────────────────────────────────────────────────────────
export function ApprovalDots({
  count,
  required = 3,
}: {
  count: number;
  required?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: required }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full transition-all"
          style={{
            background: i < count ? "#fbbf24" : "rgba(251,191,36,0.12)",
            border:
              i < count
                ? "1px solid #f59e0b"
                : "1px solid rgba(251,191,36,0.2)",
            boxShadow: i < count ? "0 0 6px rgba(251,191,36,0.4)" : "none",
          }}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">
        {count}/{required}
      </span>
    </div>
  );
}
