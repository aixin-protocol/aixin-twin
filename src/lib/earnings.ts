// Transparent, deterministic earning breakdown for approved actions.
// Kept in one place so the server (sip.functions.ts) and the UI
// (dashboard.reputation.tsx) always agree on how simulated $AXN
// earnings are computed and explained.

export type EarningInputs = {
  anchored: boolean; // BSC Testnet audit-anchor tx confirmed
  ercIdentity: boolean; // ERC-8004 IdentityRegistry tx present
  ercFeedback: boolean; // ERC-8004 ReputationRegistry tx present
  ercValidation: boolean; // ERC-8004 ValidationRegistry tx present
  validationScore: number | null; // 0..100
  staked: number; // simulated $AXN staked
};

export type EarningBreakdown = {
  base: number;
  anchorBonus: number;
  ercBonus: number;
  qualityBonus: number;
  stakeMultiplier: number;
  subtotal: number;
  total: number;
  lines: { label: string; value: string; hint?: string }[];
};

// Base fee per verified action; supplements are all deterministic.
export const EARN_BASE = 8;
export const EARN_ANCHOR_BONUS = 2;
export const EARN_ERC_BONUS_PER_HASH = 0.5; // up to +1.5
export const EARN_QUALITY_MAX = 2; // validationScore/100 × 2
export const EARN_STAKE_MULT_PER_1000 = 0.05; // +5% per 1000 staked, cap 25%
export const EARN_STAKE_CAP = 0.25;

export function computeEarning(input: EarningInputs): EarningBreakdown {
  const base = EARN_BASE;
  const anchorBonus = input.anchored ? EARN_ANCHOR_BONUS : 0;
  const ercBonus =
    (input.ercIdentity ? EARN_ERC_BONUS_PER_HASH : 0) +
    (input.ercFeedback ? EARN_ERC_BONUS_PER_HASH : 0) +
    (input.ercValidation ? EARN_ERC_BONUS_PER_HASH : 0);
  const qualityBonus =
    input.validationScore != null
      ? Math.round((Math.max(0, Math.min(100, input.validationScore)) / 100) * EARN_QUALITY_MAX * 100) / 100
      : 0;
  const subtotal = base + anchorBonus + ercBonus + qualityBonus;
  const rawMult = (input.staked / 1000) * EARN_STAKE_MULT_PER_1000;
  const stakeMultiplier = Math.min(EARN_STAKE_CAP, Math.max(0, rawMult));
  const total = Math.round(subtotal * (1 + stakeMultiplier) * 100) / 100;
  return {
    base,
    anchorBonus,
    ercBonus,
    qualityBonus,
    stakeMultiplier,
    subtotal: Math.round(subtotal * 100) / 100,
    total,
    lines: [
      { label: "Base action fee", value: `+${base.toFixed(2)}`, hint: "Flat reward per verified action" },
      {
        label: "Anchor bonus",
        value: `${anchorBonus ? "+" : ""}${anchorBonus.toFixed(2)}`,
        hint: "BSC Testnet audit-anchor tx confirmed",
      },
      {
        label: "ERC-8004 receipts",
        value: `${ercBonus ? "+" : ""}${ercBonus.toFixed(2)}`,
        hint: "Identity + Reputation + Validation on-chain",
      },
      {
        label: "Quality (SIP)",
        value: `${qualityBonus ? "+" : ""}${qualityBonus.toFixed(2)}`,
        hint: "Scaled from validator score",
      },
      {
        label: "Stake multiplier",
        value: `×${(1 + stakeMultiplier).toFixed(2)}`,
        hint: `+${(stakeMultiplier * 100).toFixed(0)}% (5% per 1,000 $AXN, cap 25%)`,
      },
    ],
  };
}
