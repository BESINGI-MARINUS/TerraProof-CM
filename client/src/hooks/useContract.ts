import { useState, useCallback, useEffect } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
} from "viem";
import { sepolia, hardhat } from "viem/chains";
import { LAND_TRANSFER_ABI } from "../abis/LandTransfer";
import { CONTRACT_ADDRESS, type LandTitle, TitleStatus } from "../lib/contract";

// ─── Types ─────────

export interface WalletState {
  address: Address | null;
  isConnected: boolean;
  chainId: number | null;
  roles: {
    isRegistrar: boolean;
    isSurveyor: boolean;
    isApprover: boolean;
    isAdmin: boolean;
  };
}

export interface TxState {
  loading: boolean;
  error: string | null;
  txHash: string | null;
  success: boolean;
}

const INITIAL_TX: TxState = {
  loading: false,
  error: null,
  txHash: null,
  success: false,
};

const INITIAL_WALLET: WalletState = {
  address: null,
  isConnected: false,
  chainId: null,
  roles: {
    isRegistrar: false,
    isSurveyor: false,
    isApprover: false,
    isAdmin: false,
  },
};

// ─── Network config ─────────
const IS_LOCAL = import.meta.env.VITE_NETWORK === "localhost";
const CHAIN = IS_LOCAL ? hardhat : sepolia;
const RPC_URL = IS_LOCAL ? "http://127.0.0.1:8545" : undefined;

// ─── Clients ───────────────
function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: CHAIN,
    transport: http(RPC_URL),
  });
}

async function getWalletClient(): Promise<WalletClient> {
  if (!window.ethereum)
    throw new Error("MetaMask not found. Please install MetaMask.");
  return createWalletClient({
    chain: CHAIN,
    transport: custom(window.ethereum),
  });
}

// ─── Main hook ───

export function useContract() {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET);
  const [tx, setTx] = useState<TxState>(INITIAL_TX);

  const publicClient = getPublicClient();

  // ── Wallet connection ────
  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum)
        throw new Error(
          "MetaMask not installed. Please insatll MetaMask on your browser to continue.",
        );
      const wc = await getWalletClient();
      const [addr] = await wc.requestAddresses();
      const chainId = await wc.getChainId();

      // Verify the contract exists at the configured address before doing anything
      const code = await publicClient.getCode({
        address: CONTRACT_ADDRESS,
      });

      if (!code || code === "0x") {
        console.error(
          `No contract found at ${CONTRACT_ADDRESS}. ` +
            `Seems like you're connected to the wrong network or forgot to deploy? `,
        );
        // Still set wallet as connected — just without roles
        setWallet({
          address: addr,
          isConnected: true,
          chainId,
          roles: {
            isRegistrar: false,
            isSurveyor: false,
            isApprover: false,
            isAdmin: false,
          },
        });
        return;
      }

      // Check which roles this address has
      const [REGISTRAR, SURVEYOR, APPROVER, ADMIN] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "REGISTRAR_ROLE",
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "SURVEYOR_ROLE",
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "APPROVER_ROLE",
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "DEFAULT_ADMIN_ROLE",
        }),
      ]);

      // Check roles in parallel
      const [isRegistrar, isSurveyor, isApprover, isAdmin] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "hasRole",
          args: [REGISTRAR as `0x${string}`, addr],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "hasRole",
          args: [SURVEYOR as `0x${string}`, addr],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "hasRole",
          args: [APPROVER as `0x${string}`, addr],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "hasRole",
          args: [ADMIN as `0x${string}`, addr],
        }),
      ]);

      setWallet({
        address: addr,
        isConnected: true,
        chainId,
        roles: {
          isRegistrar: isRegistrar as boolean,
          isSurveyor: isSurveyor as boolean,
          isApprover: isApprover as boolean,
          isAdmin: isAdmin as boolean,
        },
      });
    } catch (e: any) {
      console.error("Wallet connect error:", e);
    }
  }, []);

  // Auto-reconnect on load if already authorised
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) connectWallet();
        });
      window.ethereum.on("accountsChanged", () => connectWallet());
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  // ── Helpers ──────────
  const resetTx = () => setTx(INITIAL_TX);

  async function write(functionName: string, args: unknown[]) {
    setTx({ loading: true, error: null, txHash: null, success: false });
    try {
      //1. Create a wallet client and get the user's address
      const wc = await getWalletClient();
      const [addr] = await wc.getAddresses();

      // 2. Write to the contract
      const hash = await wc.writeContract({
        address: CONTRACT_ADDRESS,
        abi: LAND_TRANSFER_ABI,
        functionName: functionName as any,
        args: args as any,
        account: addr,
        chain: CHAIN,
      });

      //3. Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });
      setTx({ loading: false, error: null, txHash: hash, success: true });
      return hash;
    } catch (e: any) {
      const msg = e?.shortMessage ?? e?.message ?? "Transaction failed";
      setTx({ loading: false, error: msg, txHash: null, success: false });
      throw e;
    }
  }

  // ── Read functions ───────────────────────────────────────────
  const verifyTitle = useCallback(
    async (parcelId: string): Promise<LandTitle | null> => {
      try {
        const raw = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "verifyTitle",
          args: [parcelId],
        })) as any;

        if (!raw.parcelId || raw.parcelId === "") return null;
        return {
          parcelId: raw.parcelId,
          owner: raw.owner,
          ipfsCID: raw.ipfsCID,
          region: raw.region,
          registeredAt: raw.registeredAt,
          updatedAt: raw.updatedAt,
          status: raw.status as TitleStatus,
          approvalCount: raw.approvalCount,
        };
      } catch {
        return null;
      }
    },
    [],
  );

  const getHistory = useCallback(
    async (parcelId: string): Promise<Address[]> => {
      try {
        return (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "getHistory",
          args: [parcelId],
        })) as Address[];
      } catch {
        return [];
      }
    },
    [],
  );

  const getApprovalStatus = useCallback(
    async (parcelId: string, official: Address): Promise<boolean> => {
      try {
        return (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "getApprovalStatus",
          args: [parcelId, official],
        })) as boolean;
      } catch {
        return false;
      }
    },
    [],
  );

  const getPendingTransfer = useCallback(
    async (parcelId: string): Promise<Address | null> => {
      try {
        const addr = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LAND_TRANSFER_ABI,
          functionName: "pendingTransfers",
          args: [parcelId],
        })) as Address;
        return addr === "0x0000000000000000000000000000000000000000"
          ? null
          : addr;
      } catch {
        return null;
      }
    },
    [],
  );

  // ── Write functions ───────
  const registerLand = (
    parcelId: string,
    owner: Address,
    ipfsCID: string,
    region: string,
  ) => write("registerLand", [parcelId, owner, ipfsCID, region]);

  const approveLand = (parcelId: string) => write("approveLand", [parcelId]);
  const requestTransfer = (parcelId: string, newOwner: Address) =>
    write("requestTransfer", [parcelId, newOwner]);
  const confirmTransfer = (parcelId: string) =>
    write("confirmTransfer", [parcelId]);
  const raiseDispute = (parcelId: string) => write("raiseDispute", [parcelId]);
  const rejectTitle = (parcelId: string) => write("rejectTitle", [parcelId]);

  return {
    wallet,
    connectWallet,
    tx,
    resetTx,
    verifyTitle,
    getHistory,
    getApprovalStatus,
    getPendingTransfer,
    registerLand,
    approveLand,
    requestTransfer,
    confirmTransfer,
    raiseDispute,
    rejectTitle,
  };
}

// Extend window for MetaMask. Without this, TypeScript would flag an error that window.ethereum doesn't exist, even though it does at runtime. This is a common pattern in dApp development.
declare global {
  interface Window {
    ethereum?: any;
  }
}
