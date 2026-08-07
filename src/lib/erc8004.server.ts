// Server-only ERC-8004 ("Trustless Agents") registry client for BSC Testnet.
// Three registries: Identity, Reputation, Validation.
// If any address is unset OR a call fails, returns { status: "simulated"|"failed" }
// with a deterministic hash so the UI still shows the receipt.
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toHex,
  parseEventLogs,
  type Hex,
} from "viem";
import { bscTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const IDENTITY_ABI = [
  {
    type: "function",
    name: "newAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentDomain", type: "string" },
      { name: "agentAddress", type: "address" },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "agentDomain", type: "string", indexed: false },
      { name: "agentAddress", type: "address", indexed: true },
    ],
  },
] as const;

const REPUTATION_ABI = [
  {
    type: "function",
    name: "giveFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentServerId", type: "uint256" },
      { name: "score", type: "uint8" },
      { name: "dataHash", type: "bytes32" },
      { name: "dataURI", type: "string" },
    ],
    outputs: [],
  },
] as const;

const VALIDATION_ABI = [
  {
    type: "function",
    name: "validationRequest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentValidatorId", type: "uint256" },
      { name: "agentServerId", type: "uint256" },
      { name: "dataHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "validationResponse",
    stateMutability: "nonpayable",
    inputs: [
      { name: "dataHash", type: "bytes32" },
      { name: "response", type: "uint8" },
    ],
    outputs: [],
  },
] as const;

export type Erc8004RegisterResult = {
  status: "registered" | "simulated" | "failed";
  txHash: string;
  agentId: bigint | null;
  reason?: string;
};

export type Erc8004WriteResult = {
  status: "written" | "simulated" | "failed";
  txHash: string;
  reason?: string;
};

function env() {
  return {
    pk: process.env.BSC_TESTNET_PRIVATE_KEY,
    rpc: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
    identity: process.env.ERC8004_IDENTITY_ADDRESS as `0x${string}` | undefined,
    reputation: process.env.ERC8004_REPUTATION_ADDRESS as `0x${string}` | undefined,
    validation: process.env.ERC8004_VALIDATION_ADDRESS as `0x${string}` | undefined,
  };
}

function clients() {
  const { pk, rpc } = env();
  if (!pk) return null;
  const account = privateKeyToAccount(pk.startsWith("0x") ? (pk as Hex) : (`0x${pk}` as Hex));
  const wallet = createWalletClient({ account, chain: bscTestnet, transport: http(rpc) });
  const publicClient = createPublicClient({ chain: bscTestnet, transport: http(rpc) });
  return { wallet, publicClient, account };
}

function simHash(seed: string): `0x${string}` {
  return keccak256(toHex(`${seed}:${Date.now()}:${Math.random()}`));
}

/** Registers an agent in the Identity Registry. Returns the new on-chain agentId. */
export async function registerAgentIdentity(
  agentDomain: string,
  agentAddress: `0x${string}`,
): Promise<Erc8004RegisterResult> {
  const { identity } = env();
  const c = clients();
  if (!identity || !c) {
    return { status: "simulated", txHash: simHash(agentDomain), agentId: null, reason: "ERC8004_IDENTITY_ADDRESS or key not set" };
  }
  try {
    const txHash = await c.wallet.writeContract({
      address: identity,
      abi: IDENTITY_ABI,
      functionName: "newAgent",
      args: [agentDomain, agentAddress],
    });
    const receipt = await c.publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 });
    let agentId: bigint | null = null;
    const logs = parseEventLogs({ abi: IDENTITY_ABI, eventName: "AgentRegistered", logs: receipt.logs });
    if (logs[0]) agentId = logs[0].args.agentId;
    return { status: "registered", txHash, agentId };
  } catch (err) {
    console.error("[erc8004.identity] failed", err);
    return { status: "failed", txHash: simHash(agentDomain), agentId: null, reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Client-side feedback about a server agent (score 0-100). */
export async function giveFeedback(
  agentServerId: bigint,
  score: number,
  dataHash: `0x${string}`,
  dataURI: string,
): Promise<Erc8004WriteResult> {
  const { reputation } = env();
  const c = clients();
  if (!reputation || !c) {
    return { status: "simulated", txHash: simHash(`fb:${agentServerId}`), reason: "ERC8004_REPUTATION_ADDRESS or key not set" };
  }
  try {
    const txHash = await c.wallet.writeContract({
      address: reputation,
      abi: REPUTATION_ABI,
      functionName: "giveFeedback",
      args: [agentServerId, Math.max(0, Math.min(100, Math.round(score))), dataHash, dataURI],
    });
    await c.publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 });
    return { status: "written", txHash };
  } catch (err) {
    console.error("[erc8004.reputation] failed", err);
    return { status: "failed", txHash: simHash(`fb:${agentServerId}`), reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Emit validationRequest + validationResponse in one round-trip. */
export async function requestAndRespondValidation(
  agentServerId: bigint,
  dataHash: `0x${string}`,
  response: number,
): Promise<Erc8004WriteResult & { response: number }> {
  const { validation } = env();
  const c = clients();
  const clamped = Math.max(0, Math.min(100, Math.round(response)));
  if (!validation || !c) {
    return { status: "simulated", txHash: simHash(`val:${agentServerId}`), response: clamped, reason: "ERC8004_VALIDATION_ADDRESS or key not set" };
  }
  try {
    // Self-validation for MVP: validator agent id = server agent id.
    // A real deployment would use a distinct validator agent registered in Identity.
    const reqHash = await c.wallet.writeContract({
      address: validation,
      abi: VALIDATION_ABI,
      functionName: "validationRequest",
      args: [agentServerId, agentServerId, dataHash],
    });
    await c.publicClient.waitForTransactionReceipt({ hash: reqHash, timeout: 30_000 });
    const respHash = await c.wallet.writeContract({
      address: validation,
      abi: VALIDATION_ABI,
      functionName: "validationResponse",
      args: [dataHash, clamped],
    });
    await c.publicClient.waitForTransactionReceipt({ hash: respHash, timeout: 30_000 });
    return { status: "written", txHash: respHash, response: clamped };
  } catch (err) {
    console.error("[erc8004.validation] failed", err);
    return { status: "failed", txHash: simHash(`val:${agentServerId}`), response: clamped, reason: err instanceof Error ? err.message : String(err) };
  }
}
