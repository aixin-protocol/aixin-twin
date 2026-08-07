"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";

export type SkillTag = "deterministic" | "autonomous";

export type Skill = {
  id: string;
  name: string;
  category: string;
  author: string;
  provider: string;
  description?: string | null;
  price: number | null;
  priceCents: number | null;
  visibility: "public" | "private";
  status: "draft" | "live";
  version: number;
  authorId: string | null;
  isMine: boolean;
  pinnedVersion: number | null;
  installs: number;
  tags: SkillTag[];
  installed: boolean;
  assignedTo?: string[];
};


export type Task = {
  id: string;
  skillId: string;
  title: string;
  intent: string;
  value?: string;
  status: "pending" | "running" | "executing" | "awaiting_input" | "done" | "rejected";
  createdAt: string;
};

export type ActionLog = {
  id: string;
  action: string;
  receipt: string;
  sipId: string;
  receiptHash: string;
  time: string;
};

export type SpecialistStatus = "active" | "paused" | "retired";

export type Specialist = {
  id: string;
  initials: string;
  name: string;
  role: string;
  type: string;
  status: SpecialistStatus;
  assignedSkills: string[];
  reputation: number;
  earned: number;
  delegatedTasks: Task[];
  actionLog: ActionLog[];
};

export type Risk = "high" | "medium" | "low";

export type RefundEvidenceLite = {
  email: string | null;
  order_number: string | null;
  customer: { email: string; name: string | null } | null;
  order: { order_number: string; amount: number; currency: string; status: string; created_at: string } | null;
  prior_refunds: Array<{ id: string; amount: number; issued_by_agent: string | null; governance_status: string | null; created_at: string }>;
  totals: { paid: number; refunded: number; net_owed: number };
  flags: string[];
  duplicate_risk: boolean;
  recommendation: "reject" | "hold" | "approve";
};

export type DecisionCard = {
  id: string;
  risk: Risk;
  requestor: string;
  specialist: string;
  title: string;
  detail: string;
  amount?: number;
  status: "pending" | "approved" | "rejected";
  evidence?: RefundEvidenceLite | null;
};

export type Receipt = {
  id: string;
  action: string;
  hash: string;
  txHash?: string | null;
  chainId?: number | null;
  anchorStatus?: "anchored" | "simulated" | "failed" | null;
  time: string;
  isoBadge: boolean;
};

export type FeedItem = {
  id: string;
  actor: string;
  message: string;
  tone: "ok" | "warn" | "info";
  time: string;
};

export type MasterTwin = {
  id: string;
  name: string;
  initials: string;
  reputation: number;
  verifiedActions: number;
  status: "active";
};

export type Ledger = {
  earningPool: number;
  staked: number;
  accessBond: number;
  burn24h: number;
  latestReceipt?: Receipt;
};

export type WorkspaceMode = "test" | "live";

export type WorkspaceState = {
  hydrated: boolean;
  mode: WorkspaceMode;
  masterTwin: MasterTwin;
  specialists: Specialist[];
  skills: Skill[];
  decisionCards: DecisionCard[];
  receipts: Receipt[];
  feed: FeedItem[];
  ledger: Ledger;
};

type Action =
  | { type: "SET_MODE"; mode: WorkspaceMode }
  | { type: "SET_WORKSPACE"; payload: Partial<WorkspaceState> }
  | { type: "INSTALL_SKILL"; skillId: string }
  | { type: "ASSIGN_SKILL"; skillId: string; specialistId: string }
  | { type: "CREATE_SPECIALIST"; specialist: Specialist }
  | { type: "DELEGATE_TASK"; specialistId: string; skillId: string; intent: string }
  | { type: "APPROVE_CARD"; cardId: string }
  | { type: "REJECT_CARD"; cardId: string }
  | { type: "ADD_RECEIPT"; receipt: Receipt }
  | { type: "ADD_FEED"; item: FeedItem }
  | { type: "CREATE_SKILL"; skill: Skill }
  | { type: "SEED_DEMO" };

const emptySkills: Skill[] = [];

const emptySpecialists: Specialist[] = [];

const initialState: WorkspaceState = {
  hydrated: false,
  mode: "test",
  masterTwin: {
    id: "master",
    name: "",
    initials: "M",
    reputation: 0,
    verifiedActions: 0,
    status: "active",
  },
  specialists: emptySpecialists,
  skills: emptySkills,
  decisionCards: [],
  receipts: [],
  feed: [],
  ledger: {
    earningPool: 0,
    staked: 0,
    accessBond: 0,
    burn24h: 0,
  },
};

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_WORKSPACE":
      return { ...state, ...action.payload };
    case "INSTALL_SKILL": {
      const skill = state.skills.find((s) => s.id === action.skillId);
      if (!skill || skill.installed) return state;
      return {
        ...state,
        skills: state.skills.map((s) => (s.id === action.skillId ? { ...s, installed: true, installs: s.installs + 1 } : s)),
      };
    }
    case "ASSIGN_SKILL": {
      const skill = state.skills.find((s) => s.id === action.skillId);
      if (!skill) return state;
      return {
        ...state,
        skills: state.skills.map((s) =>
          s.id === action.skillId
            ? { ...s, assignedTo: Array.from(new Set([...(s.assignedTo || []), action.specialistId])) }
            : s
        ),
        specialists: state.specialists.map((sp) =>
          sp.id === action.specialistId && !sp.assignedSkills.includes(action.skillId)
            ? { ...sp, assignedSkills: [...sp.assignedSkills, action.skillId] }
            : sp
        ),
      };
    }
    case "CREATE_SPECIALIST":
      return { ...state, specialists: [...state.specialists, action.specialist] };
    case "DELEGATE_TASK": {
      const task: Task = {
        id: makeId(),
        skillId: action.skillId,
        title: action.intent.slice(0, 60),
        intent: action.intent,
        value: "pending",
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        specialists: state.specialists.map((sp) =>
          sp.id === action.specialistId ? { ...sp, delegatedTasks: [task, ...sp.delegatedTasks] } : sp
        ),
        decisionCards: [
          {
            id: makeId(),
            risk: Math.random() > 0.5 ? "high" : "medium",
            requestor: state.masterTwin.name || "Master Twin",
            specialist: state.specialists.find((s) => s.id === action.specialistId)?.name || "Specialist",
            title: action.intent.slice(0, 60),
            detail: `Delegated to ${action.skillId}`,
            status: "pending",
          },
          ...state.decisionCards,
        ],
      };
    }
    case "APPROVE_CARD": {
      const card = state.decisionCards.find((c) => c.id === action.cardId);
      if (!card) return state;
      const now = new Date().toISOString();
      const receipt: Receipt = {
        id: makeId(),
        action: card.title,
        hash: `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`,
        time: now,
        isoBadge: true,
      };
      return {
        ...state,
        decisionCards: state.decisionCards.map((c) => (c.id === action.cardId ? { ...c, status: "approved" } : c)),
        receipts: [receipt, ...state.receipts],
        feed: [
          { id: makeId(), actor: card.specialist, message: `Executed: ${card.title}`, tone: "ok", time: now },
          ...state.feed,
        ],
        ledger: { ...state.ledger, latestReceipt: receipt, earningPool: state.ledger.earningPool + 12.4 },
      };
    }
    case "REJECT_CARD":
      return {
        ...state,
        decisionCards: state.decisionCards.map((c) => (c.id === action.cardId ? { ...c, status: "rejected" } : c)),
      };
    case "ADD_RECEIPT":
      return { ...state, receipts: [action.receipt, ...state.receipts] };
    case "ADD_FEED":
      return { ...state, feed: [action.item, ...state.feed] };
    case "CREATE_SKILL":
      return { ...state, skills: [action.skill, ...state.skills] };
    case "SEED_DEMO":
      return seedDemoWorkspace(state);
    default:
      return state;
  }
}

function seedDemoWorkspace(state: WorkspaceState): WorkspaceState {
  const mk = (partial: Omit<Skill, "priceCents" | "visibility" | "status" | "version" | "authorId" | "isMine" | "pinnedVersion">): Skill => ({
    ...partial,
    priceCents: partial.price != null ? Math.round(partial.price * 100) : null,
    visibility: "public",
    status: "live",
    version: 1,
    authorId: null,
    isMine: false,
    pinnedVersion: 1,
  });
  const skills: Skill[] = [
    mk({ id: "flight-booking", name: "Flight Booking", category: "Travel", author: "Travelpayouts", provider: "Travelpayouts", price: 29, installs: 12400, tags: ["deterministic"], installed: true, assignedTo: ["marco"] }),
    mk({ id: "hotel-booking", name: "Hotel Booking", category: "Travel", author: "Travelpayouts", provider: "Travelpayouts", price: null, installs: 8100, tags: ["deterministic"], installed: true, assignedTo: ["marco"] }),
    mk({ id: "price-monitor", name: "Price Monitor", category: "Travel", author: "AiXin Labs", provider: "AiXin Labs", price: null, installs: 22100, tags: ["deterministic", "autonomous"], installed: true, assignedTo: ["marco"] }),
    mk({ id: "social-scheduler", name: "Social Scheduler", category: "Marketing", author: "Nova Studio", provider: "Nova Studio", price: 19, installs: 8700, tags: ["deterministic"], installed: true, assignedTo: ["nova"] }),
    mk({ id: "engagement-analyzer", name: "Engagement Analyzer", category: "Marketing", author: "AiXin Labs", provider: "AiXin Labs", price: null, installs: 5400, tags: ["deterministic"], installed: true, assignedTo: ["nova"] }),
    mk({ id: "content-optimizer", name: "Content Optimizer", category: "Marketing", author: "Nova Studio", provider: "Nova Studio", price: null, installs: 6200, tags: ["deterministic"], installed: true, assignedTo: ["nova"] }),
    mk({ id: "portfolio-tracker", name: "Portfolio Tracker", category: "Finance", author: "AiXin Labs", provider: "AiXin Labs", price: null, installs: 4300, tags: ["deterministic"], installed: true, assignedTo: ["ledger"] }),
    mk({ id: "tax-report", name: "Tax Report", category: "Finance", author: "AiXin Labs", provider: "AiXin Labs", price: null, installs: 3100, tags: ["deterministic"], installed: true, assignedTo: ["ledger"] }),
    mk({ id: "trade-executor", name: "Trade Executor", category: "Finance", author: "AiXin Labs", provider: "AiXin Labs", price: null, installs: 2800, tags: ["deterministic"], installed: true, assignedTo: ["ledger"] }),
    mk({ id: "refund-handler", name: "Refund Handler", category: "Support", author: "AiXin Labs", provider: "AiXin Labs", price: null, installs: 3900, tags: ["deterministic"], installed: true, assignedTo: ["iris"] }),
    mk({ id: "ticket-triage", name: "Ticket Triage", category: "Support", author: "AiXin Labs", provider: "AiXin Labs", price: null, installs: 2500, tags: ["deterministic"], installed: true, assignedTo: ["iris"] }),
  ];


  const specialists: Specialist[] = [
    {
      id: "marco",
      initials: "MA",
      name: "Marco",
      role: "Travel Specialist",
      type: "Travel",
      status: "active",
      assignedSkills: ["flight-booking", "hotel-booking", "price-monitor"],
      reputation: 4.8,
      earned: 4210,
      delegatedTasks: [],
      actionLog: [
        { id: makeId(), action: "Sent price-drop alert", receipt: "0x9f2a…c41e", sipId: "sip-001", receiptHash: "0x9f2a…c41e", time: "03:00" },
      ],
    },
    {
      id: "nova",
      initials: "NO",
      name: "Nova",
      role: "Marketing Specialist",
      type: "Marketing",
      status: "active",
      assignedSkills: ["social-scheduler", "engagement-analyzer", "content-optimizer"],
      reputation: 4.6,
      earned: 3180,
      delegatedTasks: [],
      actionLog: [
        { id: makeId(), action: "Drafted engagement report", receipt: "0x7b10…8af", sipId: "sip-002", receiptHash: "0x7b10…8af", time: "06:12" },
      ],
    },
    {
      id: "ledger",
      initials: "LE",
      name: "Ledger",
      role: "Finance Specialist",
      type: "Finance",
      status: "active",
      assignedSkills: ["portfolio-tracker", "tax-report", "trade-executor"],
      reputation: 4.9,
      earned: 2540,
      delegatedTasks: [],
      actionLog: [],
    },
    {
      id: "iris",
      initials: "IR",
      name: "Iris",
      role: "Support Specialist",
      type: "Support",
      status: "paused",
      assignedSkills: ["refund-handler", "ticket-triage"],
      reputation: 4.7,
      earned: 1650,
      delegatedTasks: [],
      actionLog: [
        { id: makeId(), action: "Issued refund #4821", receipt: "0x1c88…02da", sipId: "sip-003", receiptHash: "0x1c88…02da", time: "11:47" },
      ],
    },
  ];

  const decisionCards: DecisionCard[] = [
    {
      id: makeId(),
      risk: "high",
      requestor: "Marco",
      specialist: "Travel",
      title: "Book United UA123 · SFO → CDG",
      detail: "Non-refundable · departs Aug 14",
      amount: 450,
      status: "pending",
    },
    {
      id: makeId(),
      risk: "medium",
      requestor: "Nova",
      specialist: "Marketing",
      title: "Publish 4 posts to LinkedIn",
      detail: "Scheduled 09:00 · brand account",
      status: "pending",
    },
  ];

  const receipts: Receipt[] = [
    { id: makeId(), action: "Sent price-drop alert", hash: "0x9f2a…c41e", time: "03:00", isoBadge: true },
    { id: makeId(), action: "Drafted engagement report", hash: "0x7b10…8af", time: "06:12", isoBadge: true },
    { id: makeId(), action: "Issued refund #4821", hash: "0x1c88…02da", time: "11:47", isoBadge: true },
  ];

  const feed: FeedItem[] = [
    { id: makeId(), actor: "Travel Twin", message: "Booked SFO→CDG · receipt #a19f", tone: "ok", time: "10:42" },
    { id: makeId(), actor: "Marketing Twin", message: "Paused · Decision Card open", tone: "warn", time: "10:38" },
    { id: makeId(), actor: "Finance Twin", message: "Reconciled 42 invoices · receipt #a1a0", tone: "ok", time: "10:15" },
    { id: makeId(), actor: "SIP", message: "Schema OK · rules 12/12 · anchored", tone: "ok", time: "10:00" },
  ];

  const masterTwin: MasterTwin = {
    id: "master",
    name: state.masterTwin.name || "Aaron",
    initials: state.masterTwin.initials || (state.masterTwin.name ? state.masterTwin.name.charAt(0).toUpperCase() : "A"),
    reputation: 4.9,
    verifiedActions: 1204,
    status: "active",
  };

  return {
    ...state,
    mode: "test",
    masterTwin,
    specialists,
    skills,
    decisionCards,
    receipts,
    feed,
    ledger: {
      earningPool: 1240.0,
      staked: 800.0,
      accessBond: 200.0,
      burn24h: 12.4,
      latestReceipt: receipts[0],
    },
  };
}

type WorkspaceCtx = {
  state: WorkspaceState;
  dispatch: React.Dispatch<Action>;
};

const WorkspaceCtx = createContext<WorkspaceCtx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <WorkspaceCtx.Provider value={{ state, dispatch }}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

export type { Action };
