// src/components/Layout.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContract } from '../hooks/useContract';
import { shortAddress } from '../lib/contract';

const NAV = [
  { to: '/',          icon: '◈', label: 'Dashboard'        },
  { to: '/search',    icon: '⊹', label: 'Search Title'     },
  { to: '/register',  icon: '⊕', label: 'Register Land'    },
  { to: '/approve',   icon: '◎', label: 'Approve Titles'   },
  { to: '/transfer',  icon: '⇄', label: 'Request Transfer' },
  { to: '/audit',     icon: '≡', label: 'Audit Trail'      },
  { to: '/dispute',   icon: '⚑', label: 'Dispute / Reject' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { wallet, connectWallet } = useContract();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleTag = wallet.roles.isAdmin      ? 'Admin'
                : wallet.roles.isRegistrar  ? 'Registrar'
                : wallet.roles.isSurveyor   ? 'Surveyor'
                : wallet.roles.isApprover   ? 'Approver'
                : wallet.isConnected        ? 'Viewer'
                : null;

  return (
    <div className="flex min-h-screen bg-grid" style={{ background: '#0a0f1a' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          border-r border-amber-400/10 bg-slate-900/95 backdrop-blur-sm
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 border-b border-amber-400/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-950 font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}
            >
              TP
            </div>
            <div>
              <p className="display font-semibold text-amber-300 text-lg leading-none">TerraProof</p>
              <p className="text-slate-500 text-xs mt-0.5">Land Title Registry</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 group
                  ${active
                    ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                `}
              >
                <span className={`text-base ${active ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                  {icon}
                </span>
                {label}
                {active && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full pulse-amber"
                    style={{ background: '#fbbf24' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Wallet panel */}
        <div className="px-4 pb-6 pt-4 border-t border-amber-400/10">
          {wallet.isConnected ? (
            <div className="card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Connected</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: 'rgba(251,191,36,0.12)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251,191,36,0.2)',
                  }}
                >
                  {roleTag}
                </span>
              </div>
              <p className="mono text-xs text-slate-300 truncate">
                {wallet.address}
              </p>
              <div
                className="w-2 h-2 rounded-full mt-1"
                style={{ background: '#34d399', boxShadow: '0 0 6px #34d399' }}
              />
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="btn-primary w-full py-2.5 text-sm"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile overlay ───────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-amber-400/10 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-amber-400 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="display font-semibold text-amber-300 text-base">TerraProof</span>
          {!wallet.isConnected && (
            <button onClick={connectWallet} className="btn-primary text-xs px-3 py-1.5">
              Connect
            </button>
          )}
          {wallet.isConnected && (
            <span className="mono text-xs text-slate-400">{shortAddress(wallet.address ?? '')}</span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 fade-up">
          {children}
        </main>
      </div>
    </div>
  );
}
