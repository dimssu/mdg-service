import type {
  Dealer,
  DealerOnboarding,
  DealerService,
  ServiceRun,
  AuditLog,
  OnboardingStepEntry,
  OnboardingStepId,
  OnboardingStepStatus,
} from '@dk/shared';

import type { AuditLogDoc } from '../../models/AuditLog.js';
import type { DealerDoc } from '../../models/Dealer.js';
import type { DealerServiceDoc } from '../../models/DealerService.js';
import type { ServiceRunDoc } from '../../models/ServiceRun.js';

type WithId<T> = T & { _id: unknown };
type WithTs<T> = T & { createdAt?: Date; updatedAt?: Date };

function toIso(d?: Date | null): string | undefined {
  if (!d) return undefined;
  if (d instanceof Date) return d.toISOString();
  return new Date(d).toISOString();
}

function idOf(doc: { _id: unknown }): string {
  return String(doc._id);
}

function serializeOnboarding(o: DealerDoc['onboarding']): DealerOnboarding {
  const steps = (o?.steps ?? []).map<OnboardingStepEntry>((s) => ({
    id: s.id as OnboardingStepId,
    status: s.status as OnboardingStepStatus,
    completedAt: toIso(s.completedAt),
    completedBy: s.completedBy ?? undefined,
    data: (s.data ?? undefined) as Record<string, unknown> | undefined,
    note: s.note ?? undefined,
  }));
  return {
    currentStepId: (o?.currentStepId ?? null) as OnboardingStepId | null,
    completedStepCount: o?.completedStepCount ?? 0,
    steps,
  };
}

export function serializeDealer(doc: WithId<DealerDoc> & WithTs<DealerDoc>): Dealer {
  return {
    id: idOf(doc),
    phone: doc.phone,
    name: doc.name ?? undefined,
    code: doc.code ?? undefined,
    ownerContact: doc.ownerContact
      ? {
          name: doc.ownerContact.name,
          phone: doc.ownerContact.phone,
          email: doc.ownerContact.email,
        }
      : undefined,
    pumpLocation: doc.pumpLocation
      ? {
          address: doc.pumpLocation.address,
          city: doc.pumpLocation.city ?? undefined,
          state: doc.pumpLocation.state ?? undefined,
          pincode: doc.pumpLocation.pincode ?? undefined,
          lat: doc.pumpLocation.lat,
          lng: doc.pumpLocation.lng,
        }
      : undefined,
    gst: doc.gst ?? undefined,
    pan: doc.pan ?? undefined,
    onboardingDate: toIso(doc.onboardingDate) ?? new Date().toISOString(),
    status: doc.status,
    paymentNote: doc.paymentNote ?? undefined,
    paymentReceivedAt: toIso(doc.paymentReceivedAt),
    portalCredentials: doc.portalCredentials
      ? {
          username: doc.portalCredentials.username,
          setAt: toIso(doc.portalCredentials.setAt) ?? new Date().toISOString(),
          issuedBy: doc.portalCredentials.issuedBy,
          mustChangeOnFirstLogin: !!doc.portalCredentials.mustChangeOnFirstLogin,
        }
      : undefined,
    whatsappGroups: doc.whatsappGroups
      ? {
          adminGroupName: doc.whatsappGroups.adminGroupName ?? undefined,
          adminGroupInviteLink: doc.whatsappGroups.adminGroupInviteLink ?? undefined,
          adminGroupCreatedAt: toIso(doc.whatsappGroups.adminGroupCreatedAt),
          dealerGroupName: doc.whatsappGroups.dealerGroupName ?? undefined,
          dealerGroupInviteLink: doc.whatsappGroups.dealerGroupInviteLink ?? undefined,
          dealerGroupCreatedAt: toIso(doc.whatsappGroups.dealerGroupCreatedAt),
        }
      : undefined,
    bankDetails: doc.bankDetails
      ? {
          accountHolder: doc.bankDetails.accountHolder,
          accountNumber: doc.bankDetails.accountNumber,
          ifsc: doc.bankDetails.ifsc,
          bankName: doc.bankDetails.bankName,
          branch: doc.bankDetails.branch ?? undefined,
        }
      : undefined,
    complianceDocs: doc.complianceDocs?.map((c) => ({ label: c.label, url: c.url })),
    slaTier: doc.slaTier ?? undefined,
    onboarding: serializeOnboarding(doc.onboarding),
    audit: (doc.audit ?? []).map((a) => ({
      at: toIso(a.at) ?? new Date().toISOString(),
      actorId: a.actorId,
      action: a.action,
      note: a.note ?? undefined,
    })),
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function serializeDealerService(
  doc: WithId<DealerServiceDoc> & WithTs<DealerServiceDoc>,
): DealerService {
  return {
    id: idOf(doc),
    dealerId: String(doc.dealerId),
    serviceId: doc.serviceId,
    config: (doc.config ?? {}) as Record<string, unknown>,
    cadence: doc.cadence,
    schedule: doc.schedule,
    customCron: doc.customCron ?? undefined,
    status: doc.status,
    lastRunAt: toIso(doc.lastRunAt),
    nextRunAt: toIso(doc.nextRunAt),
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function serializeServiceRun(
  doc: WithId<ServiceRunDoc> & WithTs<ServiceRunDoc>,
): ServiceRun {
  return {
    id: idOf(doc),
    dealerId: String(doc.dealerId),
    serviceId: doc.serviceId,
    dealerServiceId: String(doc.dealerServiceId),
    startedAt: toIso(doc.startedAt) ?? new Date().toISOString(),
    finishedAt: toIso(doc.finishedAt),
    status: doc.status,
    durationMs: doc.durationMs ?? undefined,
    output: doc.output ?? undefined,
    error: doc.error
      ? { message: doc.error.message, stack: doc.error.stack ?? undefined }
      : undefined,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function serializeAuditLog(doc: WithId<AuditLogDoc>): AuditLog {
  return {
    id: idOf(doc),
    entity: doc.entity,
    entityId: doc.entityId,
    actorId: doc.actorId,
    action: doc.action,
    before: doc.before ?? undefined,
    after: doc.after ?? undefined,
    at: toIso(doc.at) ?? new Date().toISOString(),
  };
}
