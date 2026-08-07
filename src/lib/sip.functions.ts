import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateIntent } from "@/lib/sip.server";
import type { Json } from "@/integrations/supabase/types";

const asJson = (v: unknown) => v as unknown as Json;

// --- Validate an intent and create a pending decision card ---
export const runSipValidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        specialistId: z.string().uuid(),
        skillId: z.string().uuid().optional(),
        intentText: z.string().min(1),
        intent: z.record(z.string(), z.unknown()),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const report = validateIntent(data.intent);

    const { data: specialist } = await supabase
      .from("specialist_twins")
      .select("id, name, type")
      .eq("id", data.specialistId)
      .maybeSingle();

    // Insert task
    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        specialist_id: data.specialistId,
        skill_id: data.skillId ?? null,
        title: data.intentText.slice(0, 80),
        intent: data.intentText,
        intent_json: asJson(data.intent),
        value: report.risk,
        status: "pending",
      })
      .select("id")
      .single();
    if (taskErr) throw taskErr;

    let cardId: string | null = null;
    if (report.requires_approval) {
      const { data: card, error: cardErr } = await supabase
        .from("decision_cards")
        .insert({
          user_id: userId,
          task_id: task.id,
          specialist_id: data.specialistId,
          risk: report.risk,
          requestor: "Master Twin",
          specialist_name: specialist?.name ?? "Specialist",
          title: data.intentText.slice(0, 80),
          detail: report.reasons.join("; ") || `Delegated action: ${report.intent.action}`,
          amount: typeof report.intent.amount === "number" ? report.intent.amount : null,
          status: "pending",
          sip_report: asJson(report),
        })
        .select("id")
        .single();
      if (cardErr) throw cardErr;
      cardId = card.id;
    }

    // No Decision Card needed → run the skill end-to-end now so it never sits
    // in "pending" with nothing for the user to act on.
    if (!cardId) {
      try {
        const { runExecution } = await import("@/lib/execution.server");
        await runExecution(
          supabase,
          userId,
          task.id,
          data.intentText,
          data.intent,
          specialist?.type ?? "general",
          report.sip_id,
          null,
        );
      } catch (e) {
        console.error("[runSipValidate] auto-execute failed", e);
        await supabase.from("tasks").update({ status: "done" }).eq("id", task.id);
      }
    }

    return { report: asJson(report), taskId: task.id, decisionCardId: cardId };
  });


// --- Approve or reject a decision card. On approve, anchor on BSC Testnet. ---
export const decideOnCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        cardId: z.string().uuid(),
        decision: z.enum(["approve", "reject"]),
        reason: z.string().trim().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: card, error: loadErr } = await supabase
      .from("decision_cards")
      .select("*")
      .eq("id", data.cardId)
      .maybeSingle();
    if (loadErr) throw loadErr;
    if (!card) throw new Error("Decision card not found");
    if (card.status !== "pending") throw new Error("Decision already recorded");

    if (data.decision === "reject") {
      // Rejections are consequential governance events too. Sign + anchor a
      // "REJECT" receipt so the audit trail records WHO rejected, WHY, and
      // when — with the same tamper-evident hash chain as approvals.
      const reason = data.reason?.trim() || "No reason provided";
      const sipId = (card.sip_report as { sip_id?: string } | null)?.sip_id ?? `sip_${card.id.slice(0, 8)}`;
      const payloadBase = {
        sip_id: sipId,
        action: `REJECT: ${card.title}`,
        decision: "reject" as const,
        reason,
        user_id: userId,
        card_id: card.id,
        decided_at: new Date().toISOString(),
      };
      const { signReceiptWithValidator } = await import("@/lib/validator-client.server");
      const signed = await signReceiptWithValidator(payloadBase, sipId);
      const payloadHash = signed.payload_hash;
      const payload = {
        ...payloadBase,
        validator: {
          source: signed.source,
          url: signed.validator_url,
          signature: signed.signature,
          public_key: signed.public_key,
          degraded_reason: signed.degraded_reason ?? null,
        },
      };
      const { anchorReceipt } = await import("@/lib/anchor.server");
      const anchor = await anchorReceipt(sipId, payloadHash);

      const { data: receipt, error: recErr } = await supabase
        .from("receipts")
        .insert({
          user_id: userId,
          task_id: card.task_id,
          decision_card_id: card.id,
          specialist_id: card.specialist_id,
          action: `REJECT: ${card.title}`,
          sip_id: sipId,
          payload_hash: payloadHash,
          tx_hash: anchor.txHash,
          chain_id: anchor.chainId,
          block_number: anchor.blockNumber ? Number(anchor.blockNumber) : null,
          anchor_status:
            anchor.status === "anchored" ? "anchored" : anchor.status === "simulated" ? "simulated" : "failed",
          iso_badge: anchor.status === "anchored",
          payload: asJson(payload),
        })
        .select("id, tx_hash, anchor_status")
        .single();
      if (recErr) throw recErr;

      // Persist reason on the decision card itself for the UI trail.
      const mergedReport = {
        ...(card.sip_report as Record<string, unknown> | null),
        decision_reason: reason,
        decided_by: userId,
      };
      await supabase
        .from("decision_cards")
        .update({
          status: "rejected",
          decided_at: new Date().toISOString(),
          sip_report: asJson(mergedReport),
        })
        .eq("id", card.id);
      if (card.task_id) {
        await supabase.from("tasks").update({ status: "rejected" }).eq("id", card.task_id);
      }

      // Reputation: rejecting a risky action is a POSITIVE governance signal
      // for the operator, but a small negative for the specialist that
      // proposed a rejected action.
      if (card.specialist_id) {
        await supabase.from("reputation_entries").insert({
          user_id: userId,
          subject_type: "specialist",
          subject_id: card.specialist_id,
          delta: -0.01,
          reason: "action_rejected",
          receipt_id: receipt.id,
        });
      }

      return { status: "rejected" as const, receipt };
    }

    // Approve → sign receipt via external validator (or local fallback), then anchor payload hash on BSC Testnet.
    const sipId = (card.sip_report as { sip_id?: string } | null)?.sip_id ?? `sip_${card.id.slice(0, 8)}`;
    const overrideReason = data.reason?.trim() || null;
    const recommendation = (card.sip_report as { recommendation?: string } | null)?.recommendation ?? null;
    const isOverride = !!overrideReason && (recommendation === "reject" || recommendation === "hold");
    const payloadBase = {
      sip_id: sipId,
      action: isOverride ? `APPROVE (override ${recommendation?.toUpperCase()}): ${card.title}` : card.title,
      decision: "approve" as const,
      override_recommendation: isOverride ? recommendation : null,
      override_reason: overrideReason,
      user_id: userId,
      card_id: card.id,
      approved_at: new Date().toISOString(),
    };
    const { signReceiptWithValidator } = await import("@/lib/validator-client.server");
    const signed = await signReceiptWithValidator(payloadBase, sipId);
    const payloadHash = signed.payload_hash;
    const payload = {
      ...payloadBase,
      validator: {
        source: signed.source,
        url: signed.validator_url,
        signature: signed.signature,
        public_key: signed.public_key,
        degraded_reason: signed.degraded_reason ?? null,
      },
    };

    const { anchorReceipt } = await import("@/lib/anchor.server");
    const anchor = await anchorReceipt(payload.sip_id, payloadHash);

    // --- ERC-8004: Identity → Reputation → Validation ---
    const { registerAgentIdentity, giveFeedback, requestAndRespondValidation } = await import(
      "@/lib/erc8004.server"
    );

    // Ensure the specialist has an on-chain agentId in the Identity Registry.
    let agentId: bigint | null = null;
    let identityTxHash: string | null = null;
    if (card.specialist_id) {
      const { data: sp } = await supabase
        .from("specialist_twins")
        .select("id, name, agent_id, agent_domain, identity_tx_hash")
        .eq("id", card.specialist_id)
        .maybeSingle();
      if (sp) {
        if (sp.agent_id) {
          agentId = BigInt(sp.agent_id);
        } else {
          const domain = sp.agent_domain ?? `${sp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.aixin.agent`;
          // Use operator address (from private key) as the agent address for MVP.
          const operatorPk = process.env.BSC_TESTNET_PRIVATE_KEY;
          const operatorAddr = operatorPk
            ? (await import("viem/accounts")).privateKeyToAccount(
                operatorPk.startsWith("0x") ? (operatorPk as `0x${string}`) : (`0x${operatorPk}` as `0x${string}`),
              ).address
            : ("0x0000000000000000000000000000000000000000" as `0x${string}`);
          const reg = await registerAgentIdentity(domain, operatorAddr);
          identityTxHash = reg.txHash;
          agentId = reg.agentId;
          await supabase
            .from("specialist_twins")
            .update({
              agent_id: agentId ? Number(agentId) : null,
              agent_domain: domain,
              identity_tx_hash: reg.txHash,
            })
            .eq("id", sp.id);
        }
      }
    }

    // Reputation feedback: score derived from SIP risk.
    const sipRisk = (card.sip_report as { risk?: string } | null)?.risk ?? "medium";
    const score = sipRisk === "low" ? 95 : sipRisk === "medium" ? 80 : 65;
    const dataURI = `aixin://receipts/${payload.sip_id}`;
    const feedback = agentId
      ? await giveFeedback(agentId, score, payloadHash as `0x${string}`, dataURI)
      : { status: "simulated" as const, txHash: null };

    // Validation request + response (self-validate for MVP).
    const validation = agentId
      ? await requestAndRespondValidation(agentId, payloadHash as `0x${string}`, score)
      : { status: "simulated" as const, txHash: null, response: score };

    const { data: receipt, error: recErr } = await supabase
      .from("receipts")
      .insert({
        user_id: userId,
        task_id: card.task_id,
        decision_card_id: card.id,
        specialist_id: card.specialist_id,
        action: payloadBase.action,
        sip_id: payload.sip_id,
        payload_hash: payloadHash,
        tx_hash: anchor.txHash,
        chain_id: anchor.chainId,
        block_number: anchor.blockNumber ? Number(anchor.blockNumber) : null,
        anchor_status:
          anchor.status === "anchored"
            ? "anchored"
            : anchor.status === "simulated"
              ? "simulated"
              : "failed",
        iso_badge: anchor.status === "anchored",
        payload: asJson(payload),
        agent_id: agentId ? Number(agentId) : null,
        identity_tx_hash: identityTxHash,
        feedback_tx_hash: feedback.txHash ?? null,
        validation_tx_hash: validation.txHash ?? null,
        validation_response: validation.response ?? null,
      })
      .select("id, tx_hash, anchor_status, identity_tx_hash, feedback_tx_hash, validation_tx_hash")
      .single();
    if (recErr) throw recErr;

    const approvedReport = {
      ...(card.sip_report as Record<string, unknown> | null),
      ...(isOverride
        ? { override_reason: overrideReason, override_recommendation: recommendation, decided_by: userId }
        : {}),
    };
    await supabase
      .from("decision_cards")
      .update({
        status: "approved",
        decided_at: new Date().toISOString(),
        sip_report: asJson(approvedReport),
      })
      .eq("id", card.id);

    // Kick off the post-approval execution loop: real act/verify events,
    // AI-generated outcome artifact, Master Twin greeting in the follow-up
    // thread, and Telegram notification if paired.
    if (card.task_id) {
      try {
        const { data: t } = await supabase
          .from("tasks")
          .select("id, intent, intent_json")
          .eq("id", card.task_id)
          .maybeSingle();
        const intentJson = (t?.intent_json ?? {}) as Record<string, unknown>;
        const domainLabel =
          typeof intentJson.domain === "string" ? (intentJson.domain as string) : "Task";
        const { runExecution } = await import("@/lib/execution.server");
        await runExecution(
          supabase,
          userId,
          card.task_id,
          t?.intent ?? card.title,
          intentJson,
          domainLabel,
          payload.sip_id,
          isOverride ? overrideReason : null,
        );
      } catch (e) {
        console.error("[decideOnCard] execution failed", e);
        await supabase.from("tasks").update({ status: "done" }).eq("id", card.task_id);
      }
    }

    // Bump ledger preview (simulated $AXN) using transparent breakdown.
    const { data: current } = await supabase
      .from("ledger_preview")
      .select("earning_pool, staked")
      .eq("user_id", userId)
      .maybeSingle();
    const { computeEarning } = await import("@/lib/earnings");
    const earning = computeEarning({
      anchored: anchor.status === "anchored",
      ercIdentity: !!identityTxHash,
      ercFeedback: !!feedback.txHash,
      ercValidation: !!validation.txHash,
      validationScore: validation.response ?? score,
      staked: Number(current?.staked ?? 0),
    });
    const nextPool = Number(current?.earning_pool ?? 0) + earning.total;
    await supabase.from("ledger_preview").upsert({
      user_id: userId,
      earning_pool: nextPool,
    });

    // Reputation ledger.
    if (card.specialist_id) {
      await supabase.from("reputation_entries").insert({
        user_id: userId,
        subject_type: "specialist",
        subject_id: card.specialist_id,
        delta: 0.01,
        reason: "action_approved",
        receipt_id: receipt.id,
      });
    }

    return { status: "approved" as const, receipt };
  });
