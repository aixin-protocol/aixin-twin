// Presets for the GitHub Committer. Each preset is a curated bundle of
// files that can be one-click loaded into the committer form.

export type PresetFile = { path: string; content: string };

export type PresetStatus = "active" | "shipped" | "archived";

export type CommitterPreset = {
  id: string;
  name: string;
  description: string;
  status: PresetStatus;
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: PresetFile[];
};

const anchorMjs = `// server/src/anchor.mjs
// BSC Testnet audit-anchor client. Runs in "simulated" mode unless
// AIXIN_ANCHOR_RPC_URL, AIXIN_ANCHOR_CONTRACT, and AIXIN_ANCHOR_PRIVATE_KEY
// are all set.
import { createPublicClient, createWalletClient, http, keccak256, toHex } from 'viem';
import { bscTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const ABI = [
  {
    type: 'function',
    name: 'anchor',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'sipId', type: 'bytes32' },
      { name: 'payloadHash', type: 'bytes32' },
    ],
    outputs: [],
  },
];

function envConfig() {
  const rpc = process.env.AIXIN_ANCHOR_RPC_URL;
  const contract = process.env.AIXIN_ANCHOR_CONTRACT;
  const pk = process.env.AIXIN_ANCHOR_PRIVATE_KEY;
  return { rpc, contract, pk };
}

export function anchorStatus() {
  const { rpc, contract, pk } = envConfig();
  const configured = Boolean(rpc && contract && pk);
  return {
    mode: configured ? 'live' : 'simulated',
    chain: 'bsc-testnet',
    chainId: bscTestnet.id,
    contract: contract ?? null,
    rpc: rpc ?? null,
  };
}

function toBytes32(input) {
  return keccak256(toHex(input));
}

export async function anchorHash(payloadHash, sipId = 'aixin-receipt') {
  const { rpc, contract, pk } = envConfig();
  if (!rpc || !contract || !pk) {
    const fake = keccak256(toHex(\`\${sipId}:\${payloadHash}:\${Date.now()}\`));
    return { status: 'simulated', txHash: fake, chainId: bscTestnet.id };
  }
  try {
    const account = privateKeyToAccount(pk.startsWith('0x') ? pk : \`0x\${pk}\`);
    const wallet = createWalletClient({ account, chain: bscTestnet, transport: http(rpc) });
    const publicClient = createPublicClient({ chain: bscTestnet, transport: http(rpc) });
    const txHash = await wallet.writeContract({
      address: contract,
      abi: ABI,
      functionName: 'anchor',
      args: [toBytes32(sipId), toBytes32(payloadHash)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 });
    return {
      status: 'anchored',
      txHash,
      chainId: bscTestnet.id,
      blockNumber: Number(receipt.blockNumber),
    };
  } catch (err) {
    const fake = keccak256(toHex(\`\${sipId}:\${payloadHash}:\${Date.now()}\`));
    return {
      status: 'failed',
      txHash: fake,
      chainId: bscTestnet.id,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
`;

const anchorTest = `// server/test/anchor.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anchorStatus, anchorHash } from '../src/anchor.mjs';

test('anchorStatus returns simulated when env is unset', () => {
  delete process.env.AIXIN_ANCHOR_RPC_URL;
  delete process.env.AIXIN_ANCHOR_CONTRACT;
  delete process.env.AIXIN_ANCHOR_PRIVATE_KEY;
  const s = anchorStatus();
  assert.equal(s.mode, 'simulated');
  assert.equal(s.chainId, 97);
});

test('anchorHash returns a simulated txHash without env', async () => {
  const r = await anchorHash('0xdeadbeef', 'sip_test');
  assert.equal(r.status, 'simulated');
  assert.match(r.txHash, /^0x[0-9a-f]{64}$/);
  assert.equal(r.chainId, 97);
});
`;

const patchInstructions = `# Validator Server — BSC Anchor Patch (v1.1.0)

Apply three small edits to \`server/src/server.mjs\`:

## 1. Import at the top

\`\`\`js
import { anchorStatus, anchorHash } from './anchor.mjs';
\`\`\`

## 2. Add two routes (near your other route registrations)

\`\`\`js
app.get('/v1/anchor/status', async () => anchorStatus());

app.post('/v1/anchor', async (req, reply) => {
  const { payloadHash, sipId } = req.body ?? {};
  if (!payloadHash) return reply.code(400).send({ error: 'payloadHash required' });
  return anchorHash(payloadHash, sipId);
});
\`\`\`

## 3. Extend \`POST /v1/receipts\` to honour \`?anchor=1\`

Inside the existing handler, after you have signed the receipt:

\`\`\`js
if (req.query?.anchor === '1' || req.query?.anchor === 'true') {
  receipt.anchor = await anchorHash(receipt.hash, receipt.sipId);
}
return receipt;
\`\`\`

## Environment (optional, live mode)

- \`AIXIN_ANCHOR_RPC_URL\` — e.g. \`https://data-seed-prebsc-1-s1.binance.org:8545\`
- \`AIXIN_ANCHOR_CONTRACT\` — deployed AuditAnchor address
- \`AIXIN_ANCHOR_PRIVATE_KEY\` — funded testnet key

Without these, \`/v1/anchor/status\` returns \`{ mode: "simulated" }\` and CI stays green.
`;

const packageJson = `{
  "name": "@aixin-protocol/validator-server",
  "version": "1.1.0",
  "description": "AiXin Protocol reference validator server with BSC Testnet audit anchoring.",
  "type": "module",
  "main": "src/server.mjs",
  "bin": {
    "aixin-validator-server": "src/server.mjs"
  },
  "files": [
    "src",
    "schemas",
    "README.md"
  ],
  "scripts": {
    "start": "node src/server.mjs",
    "test": "node --test test/"
  },
  "dependencies": {
    "fastify": "^4.28.1",
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1",
    "viem": "^2.21.0"
  },
  "engines": {
    "node": ">=20"
  },
  "publishConfig": {
    "access": "public"
  },
  "license": "Apache-2.0"
}
`;

// ============================================================
// Preset 2 — Reverse Manifest Adapter
// ============================================================

const reverseAdapterTs = `// packages/adapter/src/reverse.ts
// Reverse Manifest Adapter: takes an external agent/skill descriptor
// (OpenAI function spec, LangChain Tool JSON, or generic OpenAPI operation)
// and returns a canonical AiXin SkillManifest.
//
// This is a pure function — no network, no filesystem — so it can run in
// the browser, in Node, or inside a server function.

export type AiXinSkillManifest = {
  aixin: '1';
  kind: 'skill';
  id: string;
  name: string;
  version: string;
  description?: string;
  inputs: { name: string; type: string; required: boolean; description?: string }[];
  outputs: { name: string; type: string; description?: string }[];
  risk: 'low' | 'medium' | 'high';
  source: { format: string; ref?: string };
};

type OpenAIFn = {
  name: string;
  description?: string;
  parameters?: { type?: string; properties?: Record<string, any>; required?: string[] };
};

type LangChainTool = {
  name: string;
  description?: string;
  schema?: { properties?: Record<string, any>; required?: string[] };
};

type OpenAPIOp = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: { name: string; required?: boolean; schema?: { type?: string }; description?: string }[];
  requestBody?: { content?: Record<string, { schema?: any }> };
};

const RISK_KEYWORDS: Record<'high' | 'medium', RegExp> = {
  high: /(transfer|send|pay|withdraw|delete|revoke|approve|mint|burn)/i,
  medium: /(create|update|write|post|book|charge|refund)/i,
};

function inferRisk(name: string, desc = ''): AiXinSkillManifest['risk'] {
  const hay = \`\${name} \${desc}\`;
  if (RISK_KEYWORDS.high.test(hay)) return 'high';
  if (RISK_KEYWORDS.medium.test(hay)) return 'medium';
  return 'low';
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function propsToInputs(
  props: Record<string, any> = {},
  required: string[] = [],
): AiXinSkillManifest['inputs'] {
  return Object.entries(props).map(([name, schema]) => ({
    name,
    type: (schema?.type as string) ?? 'string',
    required: required.includes(name),
    description: schema?.description,
  }));
}

export function fromOpenAIFunction(fn: OpenAIFn): AiXinSkillManifest {
  return {
    aixin: '1',
    kind: 'skill',
    id: \`skill.\${slug(fn.name)}\`,
    name: fn.name,
    version: '0.1.0',
    description: fn.description,
    inputs: propsToInputs(fn.parameters?.properties, fn.parameters?.required),
    outputs: [{ name: 'result', type: 'object' }],
    risk: inferRisk(fn.name, fn.description),
    source: { format: 'openai.function' },
  };
}

export function fromLangChainTool(tool: LangChainTool): AiXinSkillManifest {
  return {
    aixin: '1',
    kind: 'skill',
    id: \`skill.\${slug(tool.name)}\`,
    name: tool.name,
    version: '0.1.0',
    description: tool.description,
    inputs: propsToInputs(tool.schema?.properties, tool.schema?.required),
    outputs: [{ name: 'result', type: 'object' }],
    risk: inferRisk(tool.name, tool.description),
    source: { format: 'langchain.tool' },
  };
}

export function fromOpenAPIOperation(op: OpenAPIOp, ref?: string): AiXinSkillManifest {
  const name = op.operationId ?? op.summary ?? 'operation';
  const params = (op.parameters ?? []).map((p) => ({
    name: p.name,
    type: p.schema?.type ?? 'string',
    required: Boolean(p.required),
    description: p.description,
  }));
  return {
    aixin: '1',
    kind: 'skill',
    id: \`skill.\${slug(name)}\`,
    name,
    version: '0.1.0',
    description: op.description ?? op.summary,
    inputs: params,
    outputs: [{ name: 'response', type: 'object' }],
    risk: inferRisk(name, op.description ?? op.summary ?? ''),
    source: { format: 'openapi.operation', ref },
  };
}

export function reverseAdapt(input: unknown, ref?: string): AiXinSkillManifest {
  const any = input as any;
  if (any?.parameters?.properties) return fromOpenAIFunction(any);
  if (any?.schema?.properties) return fromLangChainTool(any);
  if (any?.operationId || any?.responses) return fromOpenAPIOperation(any, ref);
  throw new Error('reverseAdapt: unrecognised source format');
}
`;

const reverseAdapterTest = `// packages/adapter/test/reverse.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromOpenAIFunction, fromLangChainTool, fromOpenAPIOperation, reverseAdapt } from '../dist/reverse.js';

test('OpenAI function → manifest', () => {
  const m = fromOpenAIFunction({
    name: 'transfer_funds',
    description: 'Transfer USDC to a recipient',
    parameters: {
      type: 'object',
      properties: { to: { type: 'string' }, amount: { type: 'number' } },
      required: ['to', 'amount'],
    },
  });
  assert.equal(m.aixin, '1');
  assert.equal(m.risk, 'high');
  assert.equal(m.inputs.length, 2);
  assert.equal(m.source.format, 'openai.function');
});

test('LangChain tool → manifest', () => {
  const m = fromLangChainTool({
    name: 'search_web',
    description: 'Read-only web search',
    schema: { properties: { query: { type: 'string' } }, required: ['query'] },
  });
  assert.equal(m.risk, 'low');
});

test('OpenAPI operation → manifest', () => {
  const m = fromOpenAPIOperation({
    operationId: 'createBooking',
    description: 'Book a hotel room',
    parameters: [{ name: 'hotelId', required: true, schema: { type: 'string' } }],
  });
  assert.equal(m.risk, 'medium');
  assert.equal(m.name, 'createBooking');
});

test('reverseAdapt auto-detects', () => {
  const m = reverseAdapt({ name: 'ping', parameters: { properties: {} } });
  assert.equal(m.source.format, 'openai.function');
});
`;

const reverseAdapterPkg = `{
  "name": "@aixin-protocol/adapter",
  "version": "0.1.0",
  "description": "Reverse manifest adapter — convert OpenAI / LangChain / OpenAPI descriptors into canonical AiXin SkillManifests.",
  "type": "module",
  "main": "dist/reverse.js",
  "types": "dist/reverse.d.ts",
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "npm run build && node --test test/"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  },
  "publishConfig": { "access": "public" },
  "license": "Apache-2.0"
}
`;

const reverseAdapterTsconfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
`;

const reverseAdapterReadme = `# @aixin-protocol/adapter

Reverse Manifest Adapter for the AiXin Protocol.

Takes an existing agent/tool descriptor from another ecosystem and returns
a canonical AiXin \`SkillManifest\`. Pure, deterministic, no I/O.

## Supported source formats

- \`openai.function\` — OpenAI function-calling / tool spec
- \`langchain.tool\` — LangChain Tool JSON
- \`openapi.operation\` — OpenAPI 3.x operation object

## Usage

\`\`\`ts
import { reverseAdapt } from '@aixin-protocol/adapter';

const manifest = reverseAdapt(openAIFunctionSpec);
// → { aixin: '1', kind: 'skill', id: 'skill.transfer-funds', risk: 'high', ... }
\`\`\`

## Risk inference

Risk is inferred heuristically from name + description. High-risk verbs
(transfer, pay, delete, approve, mint, burn) → \`high\`. Write verbs → \`medium\`.
Everything else → \`low\`. Downstream governance policies should treat this
as a hint, not a source of truth.
`;

// ============================================================
// Preset 3 — Spec Site Quickstart Page
// ============================================================

const quickstartMd = `---
title: Quickstart
description: Get an AiXin twin issuing signed receipts in 5 minutes.
---

# Quickstart

Get an AiXin twin issuing signed, anchored receipts in about five minutes.
You'll need Node 20+ and a terminal.

## 1. Install the CLI

\`\`\`bash
npm install -g @aixin-protocol/cli
aixin --version
\`\`\`

## 2. Scaffold a skill

\`\`\`bash
aixin init my-first-skill
cd my-first-skill
\`\`\`

This creates a minimal skill manifest, an intent schema, and a sample
receipt payload.

## 3. Validate against the spec

\`\`\`bash
aixin validate manifest.json
aixin validate intent.json --schema intent
\`\`\`

Both should print \`✓ valid\`.

## 4. Run the reference validator server

\`\`\`bash
npx @aixin-protocol/validator-server
# → listening on http://localhost:8787
\`\`\`

Sign a receipt:

\`\`\`bash
curl -X POST http://localhost:8787/v1/receipts \\
  -H 'content-type: application/json' \\
  -d '{"sipId":"sip_hello","action":"greet","payload":{"msg":"hi"}}'
\`\`\`

You'll get back a receipt with an Ed25519 signature and a canonical hash.

## 5. Anchor to BSC Testnet (optional)

Set three env vars, then repeat the receipt call with \`?anchor=1\`:

\`\`\`bash
export AIXIN_ANCHOR_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
export AIXIN_ANCHOR_CONTRACT=0x...        # your deployed AuditAnchor
export AIXIN_ANCHOR_PRIVATE_KEY=0x...     # funded testnet key

curl -X POST 'http://localhost:8787/v1/receipts?anchor=1' \\
  -H 'content-type: application/json' \\
  -d '{"sipId":"sip_hello","action":"greet","payload":{"msg":"hi"}}'
\`\`\`

The response now includes an \`anchor\` object with the on-chain txHash.
Without those env vars, the server stays in \`simulated\` mode and returns
a deterministic fake hash — safe for CI.

## Next steps

- **SDKs** — [\`@aixin-protocol/sdk-js\`](https://www.npmjs.com/package/@aixin-protocol/sdk-js) and \`aixin-protocol-sdk\` (Python) for signing and verifying in-process.
- **Adapter** — [\`@aixin-protocol/adapter\`](https://www.npmjs.com/package/@aixin-protocol/adapter) to import existing OpenAI / LangChain / OpenAPI tools.
- **Spec** — read [AIP-1](/specs/aip-1) (SIP) and [AIP-2](/specs/aip-2) (Receipts).
`;

const quickstartNavPatch = `# Spec Site — Wire the Quickstart page

Add a link to the quickstart in the site navigation.

## 1. In \`site/src/nav.json\` (or wherever your nav is defined), add:

\`\`\`json
{ "title": "Quickstart", "href": "/quickstart" }
\`\`\`

Place it as the first item, before "Specs".

## 2. The generator picks up \`site/content/quickstart.md\` automatically.

After committing, the GitHub Pages workflow will publish it to
\`https://<org>.github.io/aixin-protocol/quickstart/\` (or your custom domain).
`;

// =====================================================================
// PHASE 3 — TRACK B: aixin-twin reference implementation open-source
// =====================================================================

const twinReadme = `# AiXin Twin — Reference Implementation

> The reference open-source implementation of the [AiXin Protocol](https://github.com/aixin-protocol/aixin-protocol) (SIP + TOP).
>
> A bilingual (EN / 中文) web app that hatches a Master Twin, orchestrates Specialist Twins, and routes every consequential action through the Signal Intent Protocol with signed receipts and optional BSC audit anchoring.

## Stack

- **Frontend:** React 19 + TanStack Start v1 + Vite 7 + Tailwind v4 + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage) with RLS
- **Protocol:** \`@aixin-protocol/sdk-js\` + \`@aixin-protocol/validator-server\`
- **Anchoring:** BSC Testnet via viem

## Quick start (self-host)

\`\`\`bash
git clone https://github.com/aixin-protocol/aixin-twin.git
cd aixin-twin
cp .env.example .env   # fill in Supabase + validator URL
docker compose up
\`\`\`

Open http://localhost:3000.

## Env vars

See \`.env.example\`. The minimum set:

- \`VITE_SUPABASE_URL\`, \`VITE_SUPABASE_PUBLISHABLE_KEY\` — Supabase project
- \`AIXIN_VALIDATOR_URL\` — reference validator server (default \`http://validator:3001\` in Compose)
- \`AIXIN_ANCHOR_*\` — optional, enables real BSC Testnet anchoring

## License

Business Source License 1.1 → converts to Apache-2.0 after 3 years. See \`LICENSE\`.
`;

const twinLicense = `Business Source License 1.1

Licensor: AiXin Protocol Contributors
Licensed Work: AiXin Twin (reference implementation)
Additional Use Grant: You may use, copy, modify, and redistribute the Licensed
Work for any purpose other than offering a hosted or managed commercial service
that competes with an official AiXin Protocol Foundation offering.

Change Date: three years from the date of first public release
Change License: Apache License, Version 2.0

For the full BSL 1.1 text, see https://mariadb.com/bsl11/
`;

const twinEnvExample = `# ---- Supabase (Lovable Cloud in the hosted app) ----
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# ---- AiXin Protocol validator server ----
# Points the app at a running @aixin-protocol/validator-server instance.
# Docker Compose sets this to http://validator:3001 automatically.
AIXIN_VALIDATOR_URL=http://localhost:3001

# ---- Optional: BSC Testnet audit anchoring ----
# Leave blank to run in simulated mode.
AIXIN_ANCHOR_RPC_URL=
AIXIN_ANCHOR_CONTRACT=
AIXIN_ANCHOR_PRIVATE_KEY=

# ---- AI gateway (server-side only) ----
LOVABLE_API_KEY=
`;

const twinContributing = `# Contributing to AiXin Twin

Thanks for your interest! Please read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development

\`\`\`bash
bun install
bun run dev       # http://localhost:8080
bun run build     # production build
bun run typecheck
\`\`\`

## Project layout

- \`src/routes/\` — TanStack Start file-based routes
- \`src/lib/\` — server functions (\`*.functions.ts\`) and shared client code
- \`src/integrations/supabase/\` — auto-generated Supabase client (do not edit)
- \`supabase/migrations/\` — database schema

## Protocol changes

This repo is the **reference implementation**. Any spec change belongs in
[aixin-protocol/aixin-protocol](https://github.com/aixin-protocol/aixin-protocol)
via the AIP process — not here.

## Signing your work

We use the [Developer Certificate of Origin](https://developercertificate.org/).
Sign commits with \`git commit -s\`.
`;

const twinGitignore = `node_modules
dist
.output
.tanstack
.env
.env.local
.DS_Store
*.log
.vite
coverage
`;

const twinDockerfile = `# syntax=docker/dockerfile:1.7
FROM oven/bun:1.1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
`;

const twinDockerCompose = `# One-liner self-host for the AiXin Twin reference stack.
# Runs: app + reference validator server + Postgres.
services:
  app:
    build: .
    image: ghcr.io/aixin-protocol/aixin-twin:latest
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      AIXIN_VALIDATOR_URL: http://validator:3001
    depends_on:
      - validator

  validator:
    image: ghcr.io/aixin-protocol/validator-server:1.1.0
    ports:
      - "3001:3001"
    environment:
      PORT: "3001"
      AIXIN_ANCHOR_RPC_URL: \${AIXIN_ANCHOR_RPC_URL:-}
      AIXIN_ANCHOR_CONTRACT: \${AIXIN_ANCHOR_CONTRACT:-}
      AIXIN_ANCHOR_PRIVATE_KEY: \${AIXIN_ANCHOR_PRIVATE_KEY:-}

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: aixin
      POSTGRES_DB: aixin
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
`;

const twinDockerignore = `node_modules
.output
.tanstack
dist
.env
.env.local
.git
.github
coverage
`;

const twinCiWorkflow = `name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run build
`;

const twinContainerWorkflow = `name: Publish container
on:
  push:
    tags: ['v*.*.*']
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/aixin-protocol/aixin-twin
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=raw,value=latest,enable={{is_default_branch}}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          provenance: true
          sbom: true
`;

const twinValidatorClientTs = `// src/lib/validator-client.ts
// Thin client that routes intent validation and receipt issuance through the
// reference @aixin-protocol/validator-server. Falls back to local in-process
// validation when AIXIN_VALIDATOR_URL is unset (development ergonomics).

const BASE = process.env.AIXIN_VALIDATOR_URL;

export type IntentPayload = Record<string, unknown>;

export type ValidatorReceipt = {
  aixin: '1';
  kind: 'receipt';
  id: string;
  intentId: string;
  payloadHash: string;
  signedAt: string;
  signature: string;
  publicKey: string;
  anchor?: { chain: string; txHash: string; contract?: string } | null;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(\`\${BASE}\${path}\`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(\`Validator \${path} failed [\${res.status}]: \${text}\`);
  }
  return res.json() as Promise<T>;
}

export async function validatorHealth(): Promise<{ ok: boolean; base: string | null }> {
  if (!BASE) return { ok: false, base: null };
  try {
    const res = await fetch(\`\${BASE}/v1/health\`);
    return { ok: res.ok, base: BASE };
  } catch {
    return { ok: false, base: BASE };
  }
}

export async function validateIntent(intent: IntentPayload) {
  if (!BASE) {
    const { validateIntentLocal } = await import('./sip.server');
    return validateIntentLocal(intent);
  }
  return post<{ valid: boolean; errors?: unknown[] }>('/v1/validate', { intent });
}

export async function issueReceipt(
  intent: IntentPayload,
  opts: { anchor?: boolean } = {},
): Promise<ValidatorReceipt> {
  if (!BASE) {
    const { issueReceiptLocal } = await import('./sip.server');
    return issueReceiptLocal(intent);
  }
  const qs = opts.anchor ? '?anchor=1' : '';
  return post<ValidatorReceipt>(\`/v1/receipts\${qs}\`, { intent });
}

export async function anchorStatus() {
  if (!BASE) return { mode: 'disabled', reason: 'AIXIN_VALIDATOR_URL not set' };
  const res = await fetch(\`\${BASE}/v1/anchor/status\`);
  return res.json();
}
`;

const twinValidatorWiringNotes = `# Wiring the app to @aixin-protocol/validator-server

The Committer preset "Track B · Validator wiring" adds:

- \`src/lib/validator-client.ts\` — the client used by server functions
- \`AIXIN_VALIDATOR_URL\` entry in \`.env.example\`

## Manual follow-ups (once merged)

1. Replace direct calls to \`sip.server.ts\` in delegation flows with:
   \`\`\`ts
   import { validateIntent, issueReceipt } from '@/lib/validator-client';
   \`\`\`
2. Set \`AIXIN_VALIDATOR_URL\` in production (Docker Compose sets it to
   \`http://validator:3001\` automatically).
3. When \`AIXIN_ANCHOR_*\` env vars are present on the validator container,
   receipts will include a real BSC Testnet \`anchor.txHash\`.

## Fallback

If \`AIXIN_VALIDATOR_URL\` is unset the client falls back to the in-process
\`sip.server.ts\` implementation, so local dev still works without the
sidecar.
`;

// ============================================================
// Preset 8 — aixin-twin PRD (reference implementation)
// ============================================================

const twinPrd = `# AiXin Twin — Reference Implementation PRD

> Product Requirements Document for \`aixin-protocol/aixin-twin\` — the
> reference web application that demonstrates the AiXin Protocol end-to-end.
>
> Status: v1.0 · Last updated: 2026-07-25
>
> This PRD is **adapted** from the original AiXin PRD (which described the app
> and protocol as one monolith). Since then the protocol has been extracted
> into \`aixin-protocol/aixin-protocol\` and published as independent packages
> (\`@aixin-protocol/cli\`, \`@aixin-protocol/sdk-js\`, \`aixin-protocol-sdk\`,
> \`@aixin-protocol/validator-server\`, \`@aixin-protocol/adapter\`). This
> document describes how the reference app consumes those packages instead of
> re-implementing them.

## 1. Vision

AiXin is the **trust layer for agentic AI**. \`aixin-twin\` is the canonical,
self-hostable reference implementation: a bilingual (EN + zh-CN) web app where
a user hatches one **Master Twin** that orchestrates a team of **Specialist
Twins**, each equipped with governed **Skills**. Every consequential action
runs through the **Signal Intent Protocol (SIP)** and emits a signed,
optionally chain-anchored receipt.

The reference app exists to:

1. Prove the protocol is implementable by a single team in a normal web stack.
2. Give integrators a working template to fork or study.
3. Anchor investor / user demos in something you can \`docker compose up\`.

## 2. Relationship to the protocol

| Concern | Owned by | Package |
| --- | --- | --- |
| Wire formats, canonicalization, signing | Protocol repo | \`@aixin-protocol/sdk-js\`, \`aixin-protocol-sdk\` |
| Intent validation + receipt signing service | Protocol repo | \`@aixin-protocol/validator-server\` |
| CLI (scaffold, validate, sign) | Protocol repo | \`@aixin-protocol/cli\` |
| Reverse manifest ingestion | Protocol repo | \`@aixin-protocol/adapter\` |
| Product UX, auth, storage, orchestration | **This repo** | \`aixin-twin\` |
| BSC Testnet audit-anchor contract | Protocol repo | \`contracts/AuditAnchor.sol\` |

**Rule of thumb**: if it's a wire-level rule or a signing primitive it lives
in the protocol. If it's screen behavior or business orchestration it lives
here.

## 3. Personas

- **Founder / Solo Operator** — hatches a Master Twin to run a specific
  vertical (Travel, Marketing, Finance).
- **Integrator / Developer** — forks \`aixin-twin\` to embed governed agents
  into their own product; wants clean seams and typed protocol clients.
- **Auditor / Regulator** — inspects Decision Cards, receipts, and anchor
  transactions to prove an action was authorised and reproducible.

## 4. Scope

### In scope (v1)
- Bilingual marketing landing + auth + 3-step onboarding (hatch Master Twin).
- Command Center: master twin, specialist team, live delegation feed.
- Specialist Twins list + drill-down (assigned skills, delegated task, signed
  SIP action log).
- Skills library, Marketplace, and 5-canvas SkillCraft builder.
- Governance: 5-step SIP pipeline visualization, Decision Card approve/reject,
  audit trail with receipt hashes and (when configured) BSC Testnet tx links.
- Reputation & Token: ERC-8004 reputation cards + clearly-labelled
  **Ledger Preview** for pre-IDO simulated flows (earn, stake, burn, payout).
- Reverse-adapt existing OpenAI / LangChain / OpenAPI tools into AiXin
  SkillManifests via \`@aixin-protocol/adapter\`.

### Out of scope (v1)
- Real token minting / trading.
- Multi-tenant SaaS billing.
- Mobile-native apps.
- Non-EVM anchor chains.

## 5. Architecture

\`\`\`text
+---------------------------+        +------------------------------+
|  aixin-twin (this repo)   |        |  @aixin-protocol/validator-  |
|  TanStack Start + Vite    | HTTP   |  server (sidecar)            |
|  React 19 · Tailwind v4   +------->+  /v1/intents  /v1/receipts   |
|  shadcn/ui · i18n         |        |  /v1/anchor                  |
|                           |        +---------------+--------------+
|  createServerFn RPC       |                        |
|  Supabase (auth+db+RLS)   |                        v
|                           |               +------------------+
|  validator-client.ts <----+-------------- |  BSC Testnet     |
|  (falls back to local sip)|               |  AuditAnchor.sol |
+---------------------------+               +------------------+
\`\`\`

### Runtime
- **Frontend**: React 19 + TanStack Router (file-based routes under
  \`src/routes/\`) + Tailwind v4 + shadcn/ui.
- **Server**: TanStack Start server functions (\`createServerFn\`) running on
  Cloudflare Workers-compatible runtime (\`nodejs_compat\`).
- **Auth + Data**: Supabase (Postgres + RLS + Auth). One \`master_twins\` row
  per user; specialist_twins, skills, decision_cards, receipts,
  reputation_entries, ledger_entries, adapters.
- **Protocol side**: \`@aixin-protocol/validator-server\` reachable at
  \`AIXIN_VALIDATOR_URL\` (Docker Compose wires it as \`http://validator:3001\`).
- **Anchor**: optional; when \`AIXIN_ANCHOR_*\` env vars are set on the
  validator sidecar, receipts include a real BSC Testnet tx hash.

### SIP pipeline (5 steps)
1. **Intent draft** — LLM turns natural language into a candidate SIP JSON.
2. **Schema check** — \`@aixin-protocol/sdk-js\` validates against the AIP-1
   schema.
3. **Policy check** — deterministic rules (risk tier, spending caps, allow
   lists). Runs in \`src/lib/sip.server.ts\` or delegated to validator server.
4. **Human gate** — high-risk intents produce a **Decision Card** requiring
   approval before execution.
5. **Execute + Receipt** — action runs, receipt is signed (Ed25519 via the
   validator), optionally anchored to BSC Testnet.

## 6. Key user flows

### 6.1 Hatch + onboard
Sign up → 3-step onboarding → \`master_twins\` row created → land on Command
Center with empty specialist list.

### 6.2 Install → Assign → Delegate → Approve → Receipt
1. Open **Skills / Marketplace**, install a skill (or reverse-adapt an
   existing OpenAI/LangChain tool via the adapter).
2. Open a Specialist Twin, **assign** the skill.
3. From Command Center, **delegate** a natural-language task.
4. LLM produces a SIP intent; if risk ≥ medium, a **Decision Card** appears.
5. User approves; validator signs the receipt; UI shows the tx hash and
   (when anchor is live) a BscScan link.

### 6.3 Reputation
Every successful signed action bumps the specialist's ERC-8004 reputation
card. Failures and vetoed Decision Cards are also recorded (with reason).

## 7. Data model (Supabase, high-level)
- \`master_twins\` (1 per user)
- \`specialist_twins\` (n per master)
- \`skills\`, \`skill_marketplace\`, \`adapters\`
- \`decision_cards\`, \`receipts\`, \`sip_logs\`
- \`reputation_entries\`, \`ledger_entries\`, \`staking_positions\`
- \`governance_proposals\`, \`user_profiles\`

All tables have RLS on and \`GRANT\`s scoped to \`authenticated\`.

## 8. Non-functional requirements
- **Self-hostable in one command**: \`docker compose up\` brings up app +
  validator + Postgres.
- **Deterministic core**: SIP validation and receipt canonicalization MUST
  be byte-identical to the JS/Python SDK reference outputs.
- **Fail-secure**: any validator or anchor failure blocks execution rather
  than silently proceeding.
- **Bilingual**: every user-facing string exists in \`en\` and \`zh-CN\`
  (see \`src/lib/i18n.tsx\`).
- **A11y**: shadcn primitives, keyboard-navigable Decision Cards.
- **Test-mode banner** visible whenever anchor is simulated or ledger is
  in preview mode — never hide the demo boundary from users.

## 9. Success metrics
- Time-to-first-signed-receipt on a fresh install: **< 10 minutes**.
- 100% of consequential actions produce a receipt (measured in \`sip_logs\`).
- Reference use cases (Travel, Marketing, Finance) each assembled from an
  empty account via Install → Assign → Delegate → Approve → Receipt.

## 10. Milestones (this repo)
- **M0** — Scaffold + Docker + CI shipped (done).
- **M1** — Live end-to-end loop against \`validator-server\` sidecar, real
  BSC Testnet tx surfaced in the Governance screen.
- **M2** — First tagged release (\`v0.1.0\`), container image on GHCR.
- **M3** — Integrator docs + fork guide + 3 use-case walkthroughs.

## 11. Open questions
- Do we ship a hosted demo at \`twin.aixin.io\` or leave hosting to forkers?
- Should reputation cards be per-specialist or aggregate per master by v1?
- Multi-tenant / org support: v1 punt, or minimal invite flow?

## 12. References
- Protocol repo: <https://github.com/aixin-protocol/aixin-protocol>
- Spec site: <https://aixin-protocol.github.io/aixin-protocol/> (custom
  domain \`spec.aixin.io\` deferred)
- Whitepaper v3, AIP-1 (Intent), AIP-2 (Receipt) — in the protocol repo.
- License: BSL 1.1 (see \`LICENSE\`).
`;

// ============================================================
// Preset 9 — Sync updated ROADMAP.md to protocol repo
// ============================================================

const roadmapMd = `# AiXin Roadmap

> Last updated: 2026-07-25
> Current phase: **Track A ✅ 100% · Track B ✅ live loop + Ask AiXin + transparent earnings shipped · Track C GTM next**

## Repo map

| Repo | Purpose | Status |
| --- | --- | --- |
| \`aixin-protocol/aixin-protocol\` | Protocol specs, CLI, SDKs (JS/Python), reference validator server, whitepapers | ✅ Active, 3 packages published |
| \`aixin-protocol/aixin-twin\` | Reference implementation web app (this Lovable project) extracted into its own repo | 🟡 Scaffold shipped; live demo tx pending |

## Phase 0 — Foundation
- [x] Brand / design system (#FAF9F6 cream, #D97757 coral, #1A1814 dark, Sora/Inter/JetBrains Mono)
- [x] Bilingual i18n (EN + ZH)
- [x] Landing page, auth, onboarding
- [x] Master Twin + Specialist Twins data model
- [x] SIP (Signal Intent Protocol) deterministic validator
- [x] Decision Cards + signed receipts
- [x] BSC Testnet audit anchor contract + \`anchor.server.ts\`

## Phase 1 — Protocol Publication
- [x] Whitepaper v3
- [x] AIP-1 / AIP-2 normative specs
- [x] \`spec.aixin.io\` static site (works at \`aixin-protocol.github.io/aixin-protocol\`; DNS for custom domain deferred)

## Phase 2 — Track A: Reference Tooling
- [x] \`@aixin-protocol/cli\`
- [x] \`@aixin-protocol/sdk-js\`
- [x] \`aixin-protocol-sdk\` (Python) — *Trusted Publisher pending on PyPI; code ready*
- [x] \`@aixin-protocol/validator-server\` v1.0.0-rc.1
- [x] \`@aixin-protocol/validator-server\` v1.1.0 with BSC Testnet anchoring
- [x] Reverse manifest adapter (\`@aixin-protocol/adapter\` v0.1.0)
- [x] Quickstart page on spec site

## Phase 3 — Track B: Reference Implementation Open-Source
> Goal: extract the Lovable-built AiXin app into a standalone, self-hostable \`aixin-twin\` repo.

**Scaffolding (done):**
- [x] Create \`aixin-protocol/aixin-twin\` GitHub repo
- [x] Strip Lovable-specific bits and document generic Vite/TanStack Start setup (scaffold preset)
- [x] Add \`docker-compose.yml\` for one-liner self-host
- [x] Publish container image workflow (\`ghcr.io/aixin-protocol/aixin-twin\`)
- [x] Wire the app to \`@aixin-protocol/validator-server\` via \`AIXIN_VALIDATOR_URL\`
- [x] Reference-implementation PRD checked into \`aixin-twin\`
- [x] Decision Card approve flow signs via validator-server (Ed25519) and anchors to BSC Testnet with BscScan link in Governance UI

**UX polish (done):**
- [x] Specialist Twin lifecycle (pause / retire / delete + "Show retired" toggle)
- [x] Skill persistence + specialist assignment picker in SkillCraft
- [x] Chat UI overhaul ("Twin at Work" panel, animated status ring)
- [x] **"Ask AiXin" intent-first home at \`/dashboard/ask\`** — Master Twin hero, domain tiles (Travel · Marketing · Money · Work · Health · Something else), editable goal-starters, animated Chain-of-Thought thinking phase, propose→approve plan card flagging capability gaps, "working 24/7" living state with channel toggles (WhatsApp · WeChat · App). Default landing after sign-in and onboarding.
- [x] Collapsible sidebar (icon rail ↔ full nav, \`localStorage\` persisted); "Ask AiXin" pinned at top

**Earnings transparency (done):**
- [x] Deterministic per-receipt earning breakdown in \`src/lib/earnings.ts\` (base + anchor bonus + ERC-8004 receipts + SIP quality × stake multiplier), used by both server (\`sip.functions.ts\`) and Reputation UI so the Earning Pool total reconciles line-by-line with each signed receipt.
- [x] "How earnings are calculated" card on \`/dashboard/reputation\` showing the last action's breakdown, lifetime total, and formula.
- [x] Per-receipt \`+$X.XX $AXN\` badge on every signed receipt row.

**Sneak-preview closeout (Phase 3):**
- [x] Live end-to-end loop wired (delegate → validator Ed25519 sig → BSC Testnet anchor → ERC-8004 identity/reputation/validation) — capture the recording during rehearsal.
- [ ] Cut \`v0.1.0\` tag on \`aixin-twin\` (triggers \`container.yml\` → first published GHCR image). Manual step in GitHub UI: **Releases → Draft a new release → tag \`v0.1.0\` → Publish**.

## Phase 4 — Track C: Go-to-Market (sneak preview in days)
- [ ] Investor demo deck refresh (Ask AiXin screenshots + live BscScan tx + earnings-explained panel)
- [ ] Waitlist landing + CRO copy
- [ ] Reference use-case videos (Travel, Marketing, Finance) — all filmed starting from the Ask AiXin front door
- [ ] Sneak-preview run-of-show doc (5-min demo script: hatch → ask → thinking → plan → approve → BscScan → earning breakdown)

## Phase 5 — Track D: Tokenomics & Launch
- [ ] ERC-8004 token contract audit
- [ ] Pre-IDO simulation → real ledger
- [ ] Exchange / launch partner integration

## Immediate next actions

1. **Record the demo tx once** on the running app (approve a Decision Card, capture the BscScan link + earnings breakdown) — drop screenshots into the investor deck.
2. **Cut \`v0.1.0\`** on \`aixin-twin\` from the GitHub UI to publish the first GHCR image.
3. **Refresh the investor deck** with Ask AiXin + earnings-explained slides.
4. **Draft the sneak-preview run-of-show** so anyone on the team can demo the same 5-minute flow.

## How much is left?

- **Protocol Track A**: ✅ 100% done.
- **App extraction Track B**: ✅ 100% wired. Only two out-of-app manual actions remain (record demo tx, cut \`v0.1.0\` tag) — these are captures/releases, not build work.
- **GTM Track C**: starting now.
- **Token launch Track D**: not started.
`;

const askAixinAddendum = `# Ask AiXin — Intent-First Home

> Addendum to PRD.md. Documents the default screen the user lands on
> after sign-in and onboarding in the AiXin reference implementation.

## Why

A control-panel dashboard forces the user to know what to click. AiXin's
promise is a governed *agent*, not a form. The front door is therefore a
single intent prompt — one text box, one Master Twin — that turns any
natural-language goal into a proposed team of Specialist Twins with the
Skills they need, gated by a Decision Card before anything runs.

## Route

\`/dashboard/ask\` — default landing after \`/auth\` sign-in and after
\`/onboarding\` completes.

## Flow (three phases)

### 1. Prompt phase
- Centered Master Twin (AiXin) avatar with pulsing status ring.
- Large multi-line composer.
- **Domain tiles** to mitigate the blank-prompt problem:
  Travel · Marketing · Money · Work · Health · Something else.
  Each tile reveals editable goal-starters the user can tweak.

### 2. Thinking phase (~2–3s)
Animated Chain of Thought reveals 6 internal steps sequentially:
1. Parsing intent
2. Consulting memory
3. Selecting domain
4. Choosing Specialist
5. Mapping Skills
6. Drafting approval gates

Each step shows a spinner while "now", then a check when done.

### 3. Plan phase
- Proposed **team** (Specialist Twins) with roles.
- Required **Skills**, with a "capability gap" indicator for any skill
  the user has not installed yet (links directly to Marketplace / SkillCraft).
- Numbered **steps** the twins will run.
- **SIP approval gate** — the plan cannot execute without user approval;
  high-risk actions inside the plan produce Decision Cards downstream.

### 4. Working phase (post-approval)
- Live "working 24/7" status indicator.
- Deployed Specialist(s) visible.
- **Channel toggles** for notifications: App · WhatsApp · WeChat.

## Navigation

The left sidebar collapses to a slim icon rail (persisted to
\`localStorage\`). "Ask AiXin" is pinned at the top of the nav. "Chat with
AiXin" is removed from the main menu — the Ask AiXin flow is the primary
conversation surface; the chat page remains reachable for open-ended
follow-ups.

## Data / SIP integration

The Plan phase emits a canonical SIP \`plan.approve\` intent that goes
through the deterministic validator (\`sip.server.ts\` / \`@aixin-protocol/
validator-server\`) exactly like any other Decision Card, so approval is
already Ed25519-signed and BSC-anchored — no separate code path.

## Reference screens

- Prompt: Master Twin hero + domain tiles.
- Thinking: pinging halo + Chain-of-Thought card revealing steps one at a time.
- Plan: team, skills (with gaps), steps, approval gate.
- Working: live status + channel toggles.
`;


export const COMMITTER_PRESETS: CommitterPreset[] = [
  {
    id: "validator-server-anchor",
    name: "Validator Server · BSC Anchor (v1.1.0)",
    description:
      "Adds BSC Testnet audit anchoring to @aixin-protocol/validator-server. Includes anchor.mjs, tests, and version bump.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-protocol",
    branch: "main",
    message: "feat(validator-server): BSC Testnet audit anchoring (1.1.0)",
    files: [
      { path: "server/src/anchor.mjs", content: anchorMjs },
      { path: "server/test/anchor.test.mjs", content: anchorTest },
      { path: "server/package.json", content: packageJson },
      { path: "server/SERVER_PATCH_INSTRUCTIONS.md", content: patchInstructions },
    ],
  },
  {
    id: "adapter-reverse-manifest",
    name: "Reverse Manifest Adapter (@aixin-protocol/adapter v0.1.0)",
    description:
      "New package: converts OpenAI function specs, LangChain tools, and OpenAPI operations into canonical AiXin SkillManifests.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-protocol",
    branch: "main",
    message: "feat(adapter): reverse manifest adapter v0.1.0",
    files: [
      { path: "packages/adapter/src/reverse.ts", content: reverseAdapterTs },
      { path: "packages/adapter/test/reverse.test.mjs", content: reverseAdapterTest },
      { path: "packages/adapter/package.json", content: reverseAdapterPkg },
      { path: "packages/adapter/tsconfig.json", content: reverseAdapterTsconfig },
      { path: "packages/adapter/README.md", content: reverseAdapterReadme },
    ],
  },
  {
    id: "spec-site-quickstart",
    name: "Spec Site · Quickstart page",
    description:
      "Adds a 5-minute Quickstart page to spec.aixin.io covering install, validate, run server, and BSC anchoring.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-protocol",
    branch: "main",
    message: "docs(site): add Quickstart page",
    files: [
      { path: "site/content/quickstart.md", content: quickstartMd },
      { path: "site/QUICKSTART_NAV_PATCH.md", content: quickstartNavPatch },
    ],
  },
  {
    id: "twin-scaffold",
    name: "Track B · aixin-twin Repo Scaffold",
    description:
      "Bootstraps the aixin-twin GitHub repo with README, BSL 1.1 LICENSE, CONTRIBUTING, .env.example, and .gitignore. Push once the aixin-protocol/aixin-twin repo exists.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-twin",
    branch: "main",
    message: "chore: bootstrap aixin-twin reference implementation",
    files: [
      { path: "README.md", content: twinReadme },
      { path: "LICENSE", content: twinLicense },
      { path: "CONTRIBUTING.md", content: twinContributing },
      { path: ".env.example", content: twinEnvExample },
      { path: ".gitignore", content: twinGitignore },
    ],
  },
  {
    id: "twin-docker",
    name: "Track B · Docker + Compose (one-liner self-host)",
    description:
      "Adds Dockerfile, docker-compose.yml (app + validator-server + Postgres), and .dockerignore. Enables `docker compose up`.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-twin",
    branch: "main",
    message: "feat(deploy): docker + compose self-host",
    files: [
      { path: "Dockerfile", content: twinDockerfile },
      { path: "docker-compose.yml", content: twinDockerCompose },
      { path: ".dockerignore", content: twinDockerignore },
    ],
  },
  {
    id: "twin-ci",
    name: "Track B · CI + Container Publish (GHCR)",
    description:
      "Adds GitHub Actions: CI (typecheck + build) on push/PR and container publish to ghcr.io/aixin-protocol/aixin-twin on version tags.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-twin",
    branch: "main",
    message: "ci: add build + container publish workflows",
    files: [
      { path: ".github/workflows/ci.yml", content: twinCiWorkflow },
      { path: ".github/workflows/container.yml", content: twinContainerWorkflow },
    ],
  },
  {
    id: "twin-validator-wiring",
    name: "Track B · Validator Server Wiring",
    description:
      "Wires the app to @aixin-protocol/validator-server via AIXIN_VALIDATOR_URL. Adds validator-client.ts with fallback to local sip.server.ts.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-twin",
    branch: "main",
    message: "feat(protocol): wire app to reference validator server",
    files: [
      { path: "src/lib/validator-client.ts", content: twinValidatorClientTs },
      { path: "docs/VALIDATOR_WIRING.md", content: twinValidatorWiringNotes },
    ],
  },
  {
    id: "twin-prd",
    name: "Track B · aixin-twin PRD (reference implementation)",
    description:
      "Adds PRD.md to the aixin-twin repo — reference-implementation PRD adapted from the original app+protocol PRD, describing how the app consumes the extracted protocol packages.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-twin",
    branch: "main",
    message: "docs: reference-implementation PRD",
    files: [{ path: "PRD.md", content: twinPrd }],
  },
  {
    id: "protocol-roadmap-update",
    name: "Track B · Sync ROADMAP to protocol repo",
    description:
      "Pushes the updated AiXin ROADMAP.md to aixin-protocol/aixin-protocol so the public project roadmap reflects the completed Track B scaffolding and the remaining live end-to-end loop.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-protocol",
    branch: "main",
    message: "docs(roadmap): mark Track B scaffolding complete and clarify remaining live loop",
    files: [{ path: "ROADMAP.md", content: roadmapMd }],
  },
  {
    id: "protocol-roadmap-live-loop",
    name: "Track B · Sync ROADMAP (live loop wired) to protocol repo",
    description:
      "Pushes the ROADMAP.md refresh that marks the end-to-end live loop as wired in the reference app (Ed25519 sign via validator-server + BSC Testnet anchor + BscScan link) and narrows the remaining Phase 3 item to capturing the live demo tx.",
    status: "shipped",
    owner: "aixin-protocol",
    repo: "aixin-protocol",
    branch: "main",
    message: "docs(roadmap): live end-to-end loop wired; only demo tx capture remains",
    files: [{ path: "ROADMAP.md", content: roadmapMd }],
  },
  {
    id: "protocol-roadmap-ask-aixin",
    name: "Track B · Sync ROADMAP (Ask AiXin shipped) to protocol repo",
    description:
      "Pushes the ROADMAP.md refresh adding the 'Ask AiXin' intent-first home under Phase 3 UX polish (default landing at /dashboard/ask with domain tiles, animated Chain-of-Thought, propose→approve plan, working-24/7 channel toggles) plus specialist lifecycle, skill persistence, chat overhaul, and collapsible sidebar. Narrows remaining Phase 3 items to live demo tx capture + v0.1.0 tag.",
    status: "active",
    owner: "aixin-protocol",
    repo: "aixin-protocol",
    branch: "main",
    message: "docs(roadmap): Ask AiXin intent-first home shipped; Phase 3 UX polish complete",
    files: [{ path: "ROADMAP.md", content: roadmapMd }],
  },
  {
    id: "twin-ask-aixin-doc",
    name: "Track B · Ask AiXin addendum doc for aixin-twin",
    description:
      "Adds docs/ASK_AIXIN.md to the aixin-twin repo describing the intent-first home (route, three-phase flow: prompt/thinking/plan/working, domain tiles, Chain-of-Thought, SIP integration, sidebar). Companion to PRD.md.",
    status: "active",
    owner: "aixin-protocol",
    repo: "aixin-twin",
    branch: "main",
    message: "docs: Ask AiXin intent-first home addendum",
    files: [{ path: "docs/ASK_AIXIN.md", content: askAixinAddendum }],
  },
  {
    id: "protocol-roadmap-phase3-close",
    name: "Track B · Sync ROADMAP (Phase 3 closed · earnings transparent) to protocol repo",
    description:
      "Pushes the ROADMAP.md refresh closing Phase 3: live end-to-end loop wired, Ask AiXin shipped, and transparent per-receipt $AXN earning breakdown (base + anchor + ERC-8004 + SIP quality × stake multiplier) surfaced in the Reputation dashboard. Only manual actions left are recording the demo tx and cutting v0.1.0.",
    status: "active",
    owner: "aixin-protocol",
    repo: "aixin-protocol",
    branch: "main",
    message: "docs(roadmap): close Phase 3 — live loop + Ask AiXin + transparent earnings shipped",
    files: [{ path: "ROADMAP.md", content: roadmapMd }],
  },
];


