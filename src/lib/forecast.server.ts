// Deterministic price-forecast skill. Real market data (CoinGecko, no key),
// real arithmetic — the LLM is not in the numeric path.

const ASSETS: Array<{ id: string; symbol: string; name: string; match: RegExp }> = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", match: /\b(btc|bitcoin|比特币)\b/i },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", match: /\b(eth|ethereum|以太坊)\b/i },
  { id: "binancecoin", symbol: "BNB", name: "BNB", match: /\b(bnb|binance\s*coin|币安币)\b/i },
  { id: "solana", symbol: "SOL", name: "Solana", match: /\b(sol|solana)\b/i },
  { id: "ripple", symbol: "XRP", name: "XRP", match: /\b(xrp|ripple)\b/i },
];

export function detectAsset(text: string) {
  return ASSETS.find((a) => a.match.test(text)) ?? null;
}

export function detectHorizonDays(text: string): number {
  const t = text.toLowerCase();
  if (/\b(tomorrow|next\s*day|明天)\b/.test(t)) return 1;
  if (/\b(next\s*week|weekly|一周|下周)\b/.test(t)) return 7;
  if (/\b(next\s*month|monthly|一个月|下个月)\b/.test(t)) return 30;
  const m = t.match(/\b(\d{1,3})\s*(day|days|天)\b/);
  if (m) return Math.min(90, Math.max(1, Number(m[1])));
  return 7;
}

export function detectRecipientEmail(text: string): string | null {
  const m = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0].replace(/[.,;:)]+$/, "") : null;
}

export function isForecastIntent(text: string, intentJson: Record<string, unknown>): boolean {
  const action = String((intentJson.action as string | undefined) ?? "").toLowerCase();
  if (action === "forecast_price") return true;
  if (["issue_refund", "daily_briefing", "book_flight", "book_hotel", "execute_trade"].includes(action))
    return false;
  return (
    /\b(predict|forecast|price\s*target|outlook|预测|走势)\b/i.test(text) && detectAsset(text) !== null
  );
}

export type ForecastResult =
  | {
      ok: true;
      assetId: string;
      symbol: string;
      name: string;
      spot: number;
      horizonDays: number;
      sma7: number;
      sma30: number;
      change7d: number;
      change30d: number;
      annualisedVol: number;
      point: number;
      low: number;
      high: number;
      direction: "up" | "down" | "flat";
      samples: number;
      generatedAt: string;
      source: string;
    }
  | { ok: false; reason: string };

export async function runForecast(text: string, intentJson: Record<string, unknown>): Promise<ForecastResult> {
  const params = (intentJson.params ?? {}) as Record<string, unknown>;
  const assetHint = typeof params.asset === "string" ? (params.asset as string) : "";
  const asset = detectAsset(assetHint) ?? detectAsset(text);
  if (!asset) return { ok: false, reason: "No supported asset found in the request (BTC, ETH, BNB, SOL, XRP)." };
  const horizonDays =
    typeof params.horizon_days === "number" ? Math.max(1, Math.min(90, params.horizon_days)) : detectHorizonDays(text);

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${asset.id}/market_chart?vs_currency=usd&days=90&interval=daily`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) return { ok: false, reason: `CoinGecko market_chart ${res.status}` };
    const json = (await res.json()) as { prices?: Array<[number, number]> };
    const series = (json.prices ?? []).map((p) => p[1]).filter((n) => Number.isFinite(n));
    if (series.length < 31) return { ok: false, reason: "Not enough price history returned." };

    const spot = series[series.length - 1];
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const sma7 = avg(series.slice(-7));
    const sma30 = avg(series.slice(-30));
    const change7d = ((spot - series[series.length - 8]) / series[series.length - 8]) * 100;
    const change30d = ((spot - series[series.length - 31]) / series[series.length - 31]) * 100;

    // Daily log returns → drift + volatility.
    const rets: number[] = [];
    for (let i = 1; i < series.length; i++) rets.push(Math.log(series[i] / series[i - 1]));
    const mu = avg(rets);
    const variance = avg(rets.map((r) => (r - mu) ** 2));
    const sigma = Math.sqrt(variance);
    const annualisedVol = sigma * Math.sqrt(365) * 100;

    // Damped drift (momentum decays; avoids absurd extrapolation).
    const drift = mu * 0.5 * horizonDays;
    const point = spot * Math.exp(drift);
    const band = 1.645 * sigma * Math.sqrt(horizonDays); // ~90% interval
    const low = spot * Math.exp(drift - band);
    const high = spot * Math.exp(drift + band);
    const pct = ((point - spot) / spot) * 100;

    return {
      ok: true,
      assetId: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      spot,
      horizonDays,
      sma7,
      sma30,
      change7d,
      change30d,
      annualisedVol,
      point,
      low,
      high,
      direction: pct > 1 ? "up" : pct < -1 ? "down" : "flat",
      samples: series.length,
      generatedAt: new Date().toISOString(),
      source: "CoinGecko /coins/{id}/market_chart (90d daily)",
    };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export function forecastEmail(r: Extract<ForecastResult, { ok: true }>) {
  const money = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = ((r.point - r.spot) / r.spot) * 100;
  const subject = `${r.symbol} ${r.horizonDays}-day forecast · ${money(r.point)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`;
  const text = [
    `${r.name} (${r.symbol}) — ${r.horizonDays}-day price forecast`,
    ``,
    `Spot now:        ${money(r.spot)}`,
    `Point forecast:  ${money(r.point)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`,
    `90% range:       ${money(r.low)} – ${money(r.high)}`,
    ``,
    `7d change:       ${r.change7d >= 0 ? "+" : ""}${r.change7d.toFixed(2)}%`,
    `30d change:      ${r.change30d >= 0 ? "+" : ""}${r.change30d.toFixed(2)}%`,
    `SMA7 / SMA30:    ${money(r.sma7)} / ${money(r.sma30)}`,
    `Annualised vol:  ${r.annualisedVol.toFixed(1)}%`,
    ``,
    `Method: damped log-return drift with volatility band over ${r.samples} daily observations.`,
    `Source: ${r.source}. Generated ${new Date(r.generatedAt).toUTCString()}.`,
    ``,
    `Not financial advice. Delivered by your AiXin Specialist Twin under a signed, anchored receipt.`,
  ].join("\n");
  return { subject, text };
}
