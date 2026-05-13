import {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_IDS,
  TOTAL_STEPS,
  stepById,
  type OnboardingStepId,
} from '@dk/shared';
import { STEP_PAYLOAD_SCHEMAS, type StepPayload } from '@dk/shared/schemas';
import type { HydratedDocument } from 'mongoose';

import type { DealerDoc } from '../models/Dealer.js';
import { AppError } from '../utils/AppError.js';
import { writeAudit } from '../utils/audit.js';
import { nextDealerCode } from '../utils/codeGenerator.js';
import { hashPassword } from '../utils/password.js';

type DealerHydrated = HydratedDocument<DealerDoc>;

/**
 * Returns the freshly-seeded `onboarding` subdoc for a brand-new dealer.
 * All 8 steps PENDING, currentStepId = first step.
 */
export function seedOnboardingSteps(): {
  currentStepId: OnboardingStepId;
  completedStepCount: number;
  steps: Array<{ id: OnboardingStepId; status: 'PENDING' }>;
} {
  return {
    currentStepId: ONBOARDING_STEP_IDS[0],
    completedStepCount: 0,
    steps: ONBOARDING_STEPS.map((s) => ({ id: s.id, status: 'PENDING' as const })),
  };
}

function findStep(dealer: DealerHydrated, stepId: OnboardingStepId) {
  const step = dealer.onboarding?.steps?.find((s) => s.id === stepId);
  if (!step) throw AppError.notFound(`Step not found on dealer: ${stepId}`);
  return step;
}

function laterStepIds(stepId: OnboardingStepId): OnboardingStepId[] {
  const idx = ONBOARDING_STEP_IDS.indexOf(stepId);
  return idx < 0 ? [] : ONBOARDING_STEP_IDS.slice(idx + 1);
}

/**
 * Apply a step-completion payload to a dealer doc. Validates strict
 * forward-only order, writes the per-step side-effects, marks the step DONE,
 * advances `currentStepId`, and flips the dealer to ACTIVE when the final
 * step lands. Also pushes an embedded audit entry. The caller is expected to
 * save the document and write a global AuditLog entry.
 */
export async function applyStepCompletion<S extends OnboardingStepId>(
  dealer: DealerHydrated,
  stepId: S,
  rawPayload: unknown,
  actorId: string,
): Promise<{ statusFlippedToActive: boolean; payload: StepPayload<S> }> {
  if (!dealer.onboarding) throw AppError.badRequest('Dealer has no onboarding state');
  const current = dealer.onboarding.currentStepId;
  if (current !== stepId) {
    throw AppError.badRequest(
      `Cannot complete step '${stepId}' — current step is '${current ?? 'none'}'`,
      { currentStepId: current },
    );
  }
  const schema = STEP_PAYLOAD_SCHEMAS[stepId];
  const parsed = schema.parse(rawPayload) as StepPayload<S>;

  // Per-step side-effects
  await applySideEffects(dealer, stepId, parsed, actorId);

  // Mark the step done
  const stepEntry = findStep(dealer, stepId);
  stepEntry.status = 'DONE';
  stepEntry.completedAt = new Date();
  stepEntry.completedBy = actorId;
  const data = stripSensitive(stepId, parsed);
  stepEntry.data = data;
  if ((parsed as { note?: string }).note) {
    stepEntry.note = (parsed as { note?: string }).note;
  }

  // Advance
  const nextIdx = ONBOARDING_STEP_IDS.indexOf(stepId) + 1;
  const nextId = nextIdx < ONBOARDING_STEP_IDS.length ? ONBOARDING_STEP_IDS[nextIdx]! : null;
  dealer.onboarding.currentStepId = nextId;
  dealer.onboarding.completedStepCount = (dealer.onboarding.completedStepCount ?? 0) + 1;

  // Activate if last step done
  let statusFlippedToActive = false;
  if (dealer.onboarding.completedStepCount >= TOTAL_STEPS && dealer.status !== 'ACTIVE') {
    dealer.status = 'ACTIVE';
    statusFlippedToActive = true;
  }

  dealer.audit.push({
    at: new Date(),
    actorId,
    action: 'STEP_COMPLETE',
    note: stepId,
  } as (typeof dealer.audit)[number]);

  return { statusFlippedToActive, payload: parsed };
}

/**
 * Apply a step reopen. Implements the two-tier rule:
 * - non-mutating steps (per `step.mutating === false`): reopen freely
 * - mutating steps (5, 7): require `force: true`. Step 6 is never reopenable
 *   (`step.reopenable === false`) — to change the code use PATCH /dealers/:id/code.
 *
 * Side-effects already written to `dealer.*` are NOT auto-reverted; admin
 * re-completes the step with corrected data which will overwrite.
 */
export function applyStepReopen(
  dealer: DealerHydrated,
  stepId: OnboardingStepId,
  opts: { force?: boolean; note?: string },
  actorId: string,
): { wasActive: boolean } {
  if (!dealer.onboarding) throw AppError.badRequest('Dealer has no onboarding state');
  const def = stepById(stepId);
  if (!def.reopenable) {
    throw AppError.badRequest(
      `Step '${stepId}' is append-only and cannot be reopened.`,
    );
  }
  const stepEntry = findStep(dealer, stepId);
  if (stepEntry.status !== 'DONE') {
    throw AppError.badRequest(`Step '${stepId}' is not done; nothing to reopen.`);
  }
  if (def.mutating && !opts.force) {
    throw AppError.badRequest(
      `Step '${stepId}' is mutating; reopen requires { force: true }.`,
    );
  }

  // Flip back
  stepEntry.status = 'PENDING';
  stepEntry.completedAt = undefined;
  stepEntry.completedBy = undefined;
  dealer.onboarding.currentStepId = stepId;
  dealer.onboarding.completedStepCount = Math.max(
    0,
    (dealer.onboarding.completedStepCount ?? 0) - 1,
  );

  // Also flip any later DONE steps back to PENDING (consistency) — only relevant
  // when force=true on a mutating step that was followed by completions.
  const later = laterStepIds(stepId);
  for (const id of later) {
    const e = dealer.onboarding.steps.find((s) => s.id === id);
    if (e && e.status === 'DONE') {
      e.status = 'PENDING';
      e.completedAt = undefined;
      e.completedBy = undefined;
      dealer.onboarding.completedStepCount = Math.max(
        0,
        (dealer.onboarding.completedStepCount ?? 0) - 1,
      );
    }
  }

  const wasActive = dealer.status === 'ACTIVE';
  if (wasActive) dealer.status = 'ONBOARDING';

  dealer.audit.push({
    at: new Date(),
    actorId,
    action: opts.force ? 'STEP_REOPEN_FORCED' : 'STEP_REOPEN',
    note: stepId + (opts.note ? `: ${opts.note}` : ''),
  } as (typeof dealer.audit)[number]);

  return { wasActive };
}

// --- per-step side-effects ------------------------------------------------

async function applySideEffects(
  dealer: DealerHydrated,
  stepId: OnboardingStepId,
  payload: unknown,
  actorId: string,
): Promise<void> {
  switch (stepId) {
    case 'collect-phone': {
      const p = payload as StepPayload<'collect-phone'>;
      dealer.phone = p.phone;
      if (p.name) dealer.name = p.name;
      return;
    }
    case 'send-welcome':
    case 'send-terms-link':
    case 'send-pdf':
      // no dealer-doc mutation beyond the step entry
      return;
    case 'receive-payment-and-gst': {
      const p = payload as StepPayload<'receive-payment-and-gst'>;
      dealer.gst = p.gst;
      dealer.paymentNote = p.paymentNote;
      dealer.paymentReceivedAt = new Date();
      return;
    }
    case 'assign-code': {
      const p = payload as StepPayload<'assign-code'>;
      if (dealer.code && dealer.code !== p.code) {
        // append-only: if already set, this step is being re-run with the same
        // value (after a reopen of a later step). Reject mismatches.
        throw AppError.badRequest(
          `Dealer code is already set to ${dealer.code} and is append-only.`,
        );
      }
      dealer.code = p.code;
      return;
    }
    case 'create-admin-group': {
      const p = payload as StepPayload<'create-admin-group'>;
      const groups = dealer.whatsappGroups ?? {};
      groups.adminGroupName = p.groupName;
      groups.adminGroupInviteLink = p.inviteLink;
      groups.adminGroupCreatedAt = new Date();
      dealer.whatsappGroups = groups as typeof dealer.whatsappGroups;
      const passwordHash = await hashPassword(p.password);
      dealer.portalCredentials = {
        username: p.username,
        passwordHash,
        setAt: new Date(),
        issuedBy: actorId,
        mustChangeOnFirstLogin: true,
      } as typeof dealer.portalCredentials;
      return;
    }
    case 'create-dealer-group': {
      const p = payload as StepPayload<'create-dealer-group'>;
      const groups = dealer.whatsappGroups ?? {};
      groups.dealerGroupName = p.groupName;
      groups.dealerGroupInviteLink = p.inviteLink;
      groups.dealerGroupCreatedAt = new Date();
      dealer.whatsappGroups = groups as typeof dealer.whatsappGroups;
      return;
    }
  }
}

/** Strip sensitive fields before persisting to the audit-visible `step.data`. */
function stripSensitive(stepId: OnboardingStepId, payload: unknown): Record<string, unknown> {
  const obj = { ...(payload as Record<string, unknown>) };
  if (stepId === 'create-admin-group' && 'password' in obj) {
    obj.password = '[redacted]';
  }
  return obj;
}

/**
 * Commit-with-retry helper for the assign-code step. Retries up to 3 times on
 * E11000 (duplicate-key) collisions by re-deriving the suggestion.
 */
export async function suggestAndPersistCode(
  dealer: DealerHydrated,
  preferred: string | undefined,
  actorId: string,
): Promise<{ code: string }> {
  let attempt = 0;
  let suggestion = preferred ?? (await nextDealerCode());
  while (attempt < 3) {
    try {
      dealer.code = suggestion;
      await dealer.save();
      void actorId;
      return { code: suggestion };
    } catch (err) {
      const e = err as { code?: number };
      if (e?.code === 11000) {
        attempt += 1;
        suggestion = await nextDealerCode();
        continue;
      }
      throw err;
    }
  }
  throw AppError.conflict('Could not allocate a unique dealer code after retries', {
    suggestion,
  });
}

// Export the test-facing dealer hydrated type for routers that need it.
export type { DealerHydrated };

// Bring helpers used by overview/etc. into scope so the file is the canonical
// home for dealer-domain logic.
export { writeAudit };
