// src/pages/RegisterLand.tsx
import { useState, useRef } from 'react';
import { useContract } from '../hooks/useContract';
import { CAMEROON_REGIONS, isValidParcelId } from '../lib/contract';
import {
  PageHeader, TxFeedback, ConnectPrompt, RoleGuard,
} from '../components/ui';

interface FormState {
  parcelId:     string;
  ownerAddress: string;
  region:       string;
}

const EMPTY_FORM: FormState = { parcelId: '', ownerAddress: '', region: '' };

export default function RegisterLand() {
  const { wallet, connectWallet, registerLand, tx, resetTx } = useContract();

  const [form,     setForm]     = useState<FormState>(EMPTY_FORM);
  const [file,     setFile]     = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [formErr,  setFormErr]  = useState<Partial<FormState>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  if (!wallet.isConnected) return <ConnectPrompt onConnect={connectWallet} />;
  if (!wallet.roles.isRegistrar) return (
    <RoleGuard allowed={false} roleName="Registrar">
      <></>
    </RoleGuard>
  );

  function validate(): boolean {
    const errors: Partial<FormState> = {};
    if (!isValidParcelId(form.parcelId))
      errors.parcelId = 'Format: CMR-XX-XXX-000 (e.g. CMR-SW-BUEA-001)';
    if (!/^0x[0-9a-fA-F]{40}$/.test(form.ownerAddress))
      errors.ownerAddress = 'Must be a valid Ethereum address (0x...)';
    if (!form.region)
      errors.region = 'Select a region';
    setFormErr(errors);
    return Object.keys(errors).length === 0;
  }

  async function uploadToServer(f: File): Promise<string> {
    const body = new FormData();
    body.append('document', f);
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'}/api/upload`, {
      method: 'POST',
      body,
    });
    if (!res.ok) throw new Error('Upload failed');
    const { cid } = await res.json();
    return cid as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetTx();
    if (!validate()) return;
    if (!file) { setUploadErr('Please attach the scanned title document (PDF).'); return; }

    setUploadErr('');
    setUploading(true);
    let cid = '';

    try {
      cid = await uploadToServer(file);
    } catch {
      setUploadErr('Failed to upload document to IPFS. Is the server running?');
      setUploading(false);
      return;
    } finally {
      setUploading(false);
    }

    try {
      await registerLand(
        form.parcelId.toUpperCase(),
        form.ownerAddress as `0x${string}`,
        cid,
        form.region,
      );
      setForm(EMPTY_FORM);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      // tx state handled by hook
    }
  }

  const busy = uploading || tx.loading;

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        icon="⊕"
        title="Register Land"
        subtitle="Submit a new land parcel for the multi-official approval workflow"
      />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Parcel ID */}
        <div>
          <label className="block text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">
            Parcel ID <span className="text-red-400">*</span>
          </label>
          <input
            className="input-field mono"
            placeholder="CMR-SW-BUEA-001"
            value={form.parcelId}
            onChange={e => setForm(f => ({ ...f, parcelId: e.target.value.toUpperCase() }))}
            disabled={busy}
            spellCheck={false}
          />
          {formErr.parcelId && (
            <p className="text-red-400 text-xs mt-1">{formErr.parcelId}</p>
          )}
          <p className="text-slate-600 text-xs mt-1">
            Official MINDCAF parcel reference number
          </p>
        </div>

        {/* Owner address */}
        <div>
          <label className="block text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">
            Owner Wallet Address <span className="text-red-400">*</span>
          </label>
          <input
            className="input-field mono"
            placeholder="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            value={form.ownerAddress}
            onChange={e => setForm(f => ({ ...f, ownerAddress: e.target.value }))}
            disabled={busy}
            spellCheck={false}
          />
          {formErr.ownerAddress && (
            <p className="text-red-400 text-xs mt-1">{formErr.ownerAddress}</p>
          )}
          <p className="text-slate-600 text-xs mt-1">
            The landowner's Ethereum wallet address — provided by the owner at the office
          </p>
        </div>

        {/* Region */}
        <div>
          <label className="block text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">
            Region <span className="text-red-400">*</span>
          </label>
          <select
            className="input-field"
            value={form.region}
            onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
            disabled={busy}
            style={{ background: '#1e2a3a' }}
          >
            <option value="">Select a region…</option>
            {CAMEROON_REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {formErr.region && (
            <p className="text-red-400 text-xs mt-1">{formErr.region}</p>
          )}
        </div>

        {/* Document upload */}
        <div>
          <label className="block text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">
            Scanned Title Document (PDF) <span className="text-red-400">*</span>
          </label>
          <div
            className="relative border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
            style={{
              borderColor: file ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.2)',
              background:  file ? 'rgba(52,211,153,0.04)' : 'rgba(251,191,36,0.03)',
            }}
            onClick={() => !busy && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => {
                setUploadErr('');
                setFile(e.target.files?.[0] ?? null);
              }}
              disabled={busy}
            />
            {file ? (
              <div>
                <p className="text-emerald-400 text-sm font-medium">✓ {file.name}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {(file.size / 1024).toFixed(1)} KB · Click to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-slate-500 text-2xl mb-2">⊕</p>
                <p className="text-slate-400 text-sm">Click to attach PDF</p>
                <p className="text-slate-600 text-xs mt-1">
                  The scanned <em>titre foncier</em> — will be pinned to IPFS
                </p>
              </div>
            )}
          </div>
          {uploadErr && (
            <p className="text-red-400 text-xs mt-1">{uploadErr}</p>
          )}
        </div>

        {/* Workflow note */}
        <div
          className="rounded-lg p-4 text-xs text-slate-500 space-y-1"
          style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.08)' }}
        >
          <p className="text-amber-400/70 font-medium mb-2">What happens after you submit</p>
          <p>① Your submission counts as Approval #1 (Registrar).</p>
          <p>② A Surveyor must call Approve — counts as #2.</p>
          <p>③ An Approver must call Approve — counts as #3.</p>
          <p>④ Only then does the title reach <span className="text-emerald-400">Approved</span> status.</p>
        </div>

        {/* Upload progress */}
        {uploading && (
          <div className="rounded-lg p-3 bg-slate-800/60 border border-slate-700 text-sm text-slate-300 flex items-center gap-3">
            <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Uploading document to IPFS via Pinata…
          </div>
        )}

        <TxFeedback {...tx} onClose={resetTx} />

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full py-3 text-sm"
        >
          {uploading ? 'Uploading document…'
            : tx.loading ? 'Broadcasting to blockchain…'
            : 'Register Land Parcel'}
        </button>
      </form>
    </div>
  );
}
