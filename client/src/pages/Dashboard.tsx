// src/pages/Dashboard.tsx
import { useContract } from '../hooks/useContract';
import { shortAddress, CONTRACT_ADDRESS } from '../lib/contract';

const QUICK_LINKS = [
  { to: '/search',   icon: '⊹', label: 'Search Title',      desc: 'Look up any parcel by ID'             },
  { to: '/register', icon: '⊕', label: 'Register Land',     desc: 'Submit a new title for approval'      },
  { to: '/approve',  icon: '◎', label: 'Approve Titles',    desc: 'Cast your approval vote'               },
  { to: '/transfer', icon: '⇄', label: 'Request Transfer',  desc: 'Initiate an ownership transfer'       },
  { to: '/audit',    icon: '≡', label: 'Audit Trail',       desc: 'View full ownership history'          },
  { to: '/dispute',  icon: '⚑', label: 'Dispute / Reject',  desc: 'Flag a fraudulent registration'      },
];

export default function Dashboard() {
  const { wallet, connectWallet } = useContract();

  const roleDescription =
    wallet.roles.isAdmin      ? 'You have full administrative access to the TerraProof system.'
    : wallet.roles.isRegistrar ? 'You can register new land parcels and confirm ownership transfers.'
    : wallet.roles.isSurveyor  ? 'You can verify physical survey data and cast approval votes.'
    : wallet.roles.isApprover  ? 'You can give final approval to pending land title submissions.'
    : wallet.isConnected       ? 'Your wallet is connected in read-only mode. You can search and view titles.'
    : 'Connect your MetaMask wallet to interact with the TerraProof registry.';

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-amber-400/60 text-xs font-medium tracking-widest uppercase mb-2">
              Cameroon Land Registry
            </p>
            <h1 className="display text-3xl lg:text-4xl text-slate-100 font-semibold leading-tight">
              TerraProof
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-lg">
              Tamper-proof land title verification on the Ethereum blockchain.
              Every registration is permanent, transparent, and requires three
              independent government officials to approve.
            </p>
          </div>

          {!wallet.isConnected && (
            <button
              onClick={connectWallet}
              className="btn-primary px-6 py-2.5 text-sm flex-shrink-0"
            >
              Connect MetaMask
            </button>
          )}
        </div>
      </div>

      {/* ── Wallet status card ────────────────────────────────── */}
      <div
        className="card p-5 mb-8 flex items-start gap-4"
        style={{ borderColor: wallet.isConnected ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.12)' }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
          style={{
            background: wallet.isConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
          }}
        >
          {wallet.isConnected ? '◉' : '◯'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-slate-200 font-medium text-sm">
              {wallet.isConnected ? 'Wallet Connected' : 'No Wallet Connected'}
            </p>
            {wallet.isConnected && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
              >
                {wallet.roles.isAdmin ? 'Admin' : wallet.roles.isRegistrar ? 'Registrar' : wallet.roles.isSurveyor ? 'Surveyor' : wallet.roles.isApprover ? 'Approver' : 'Viewer'}
              </span>
            )}
          </div>
          {wallet.address && (
            <p className="mono text-xs text-slate-500 truncate mb-1">{wallet.address}</p>
          )}
          <p className="text-slate-500 text-xs">{roleDescription}</p>
        </div>
      </div>

      {/* ── Quick links grid ──────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-slate-400 text-xs font-medium tracking-widest uppercase mb-4">
          System Functions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ to, icon, label, desc }) => (
            <a
              key={to}
              href={to}
              className="card card-hover p-4 flex items-start gap-3 group no-underline"
            >
              <span
                className="text-lg mt-0.5 transition-colors"
                style={{ color: 'rgba(251,191,36,0.4)' }}
              >
                {icon}
              </span>
              <div>
                <p className="text-slate-200 text-sm font-medium group-hover:text-amber-300 transition-colors">
                  {label}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Contract info ─────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-slate-400 text-xs font-medium tracking-widest uppercase mb-4">
          Contract Details
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-slate-500 text-sm">Contract Address</span>
            <div className="flex items-center gap-2">
              <span className="mono text-xs text-slate-300">{shortAddress(CONTRACT_ADDRESS)}</span>
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-400/60 hover:text-amber-400 transition-colors"
              >
                Etherscan ↗
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-slate-500 text-sm">Network</span>
            <span className="text-slate-300 text-sm">Ethereum Sepolia Testnet</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-slate-500 text-sm">Required Approvals</span>
            <span className="text-slate-300 text-sm">3 of 3 officials</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-slate-500 text-sm">Roles</span>
            <span className="text-slate-300 text-sm">Registrar · Surveyor · Approver</span>
          </div>
        </div>
      </div>
    </div>
  );
}
