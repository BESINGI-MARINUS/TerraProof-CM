// src/lib/contract.ts
// Shared contract config, types, and helpers

// ─── Types ────────────────────────────────────────────────────────────────────

export enum TitleStatus {
  Pending = 0,
  Approved = 1,
  Disputed = 2,
  Rejected = 3,
}

export interface LandTitle {
  parcelId: string;
  owner: `0x${string}`;
  ipfsCID: string;
  region: string;
  registeredAt: bigint;
  updatedAt: bigint;
  status: TitleStatus;
  approvalCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export const CAMEROON_REGIONS = [
  "Adamawa",
  "Centre",
  "East",
  "Far North",
  "Littoral",
  "North",
  "North West",
  "South",
  "South West",
  "West",
] as const;

// ─── Helpers ──────

export function statusLabel(status: TitleStatus): string {
  return ["Pending", "Approved", "Disputed", "Rejected"][status] ?? "Unknown";
}

export function statusClass(status: TitleStatus): string {
  return (
    ["badge-pending", "badge-approved", "badge-disputed", "badge-rejected"][
      status
    ] ?? "badge-pending"
  );
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatTimestamp(ts: bigint): string {
  if (!ts || ts === 0n) return "—";
  return new Date(Number(ts) * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ipfsUrl(cid: string): string {
  if (!cid) return "";
  return `${IPFS_GATEWAY}${cid}`;
}

// Validate a Cameroon parcel ID format: CMR-XX-XXX-000
export function isValidParcelId(id: string): boolean {
  return /^CMR-[A-Z]{2}-[A-Z]{2,6}-\d{3,4}$/.test(id.toUpperCase());
}
