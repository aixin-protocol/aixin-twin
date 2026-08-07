// Server-only BSC Testnet anchor. Writes a payload hash to a minimal
// on-chain audit contract. It NEVER mints a fake transaction hash: if secrets
// are missing or the write fails, the result carries txHash: null so the UI
// can render an honest "not anchored" state.

import { createPublicClient, createWalletClient, http, keccak256, toHex } from "viem";
import { bscTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const AUDIT_ABI = [
  {
    type: "function",
    name: "anchor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sipId", type: "bytes32" },
      { name: "payloadHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

export type AnchorResult = {
  status: "anchored" | "simulated" | "failed";
  /** Real on-chain tx hash, or null when nothing was written to chain. */
  txHash: string | null;
  chainId: number;
  blockNumber?: bigint;
  reason?: string;
};

function toBytes32(input: string): `0x${string}` {
  // input may be "sip_xxx" or a 0x-hash; normalize to bytes32 via keccak.
  return keccak256(toHex(input));
}

export async function anchorReceipt(sipId: string, payloadHash: string): Promise<AnchorResult> {
  const pk = process.env.BSC_TESTNET_PRIVATE_KEY;
  const contract = process.env.AUDIT_ANCHOR_CONTRACT_ADDRESS;
  const rpc = process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545";

  if (!pk || !contract) {
    // Not anchored: no chain credentials configured. Never mint a fake hash.
    return {
      status: "simulated",
      txHash: null,
      chainId: bscTestnet.id,
      reason: "BSC_TESTNET_PRIVATE_KEY or AUDIT_ANCHOR_CONTRACT_ADDRESS not set",
    };
  }

  try {
    const account = privateKeyToAccount(pk.startsWith("0x") ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`));
    const wallet = createWalletClient({ account, chain: bscTestnet, transport: http(rpc) });
    const publicClient = createPublicClient({ chain: bscTestnet, transport: http(rpc) });

    const txHash = await wallet.writeContract({
      address: contract as `0x${string}`,
      abi: AUDIT_ABI,
      functionName: "anchor",
      args: [toBytes32(sipId), toBytes32(payloadHash)],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 });
    return {
      status: "anchored",
      txHash,
      chainId: bscTestnet.id,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    console.error("[anchor] failed", err);
    return {
      status: "failed",
      txHash: null,
      chainId: bscTestnet.id,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
