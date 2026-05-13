import { AuditLogModel } from '../models/AuditLog.js';

export interface WriteAuditInput {
  entity: string;
  entityId: string;
  actorId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}

export async function writeAudit(input: WriteAuditInput): Promise<void> {
  await AuditLogModel.create({
    entity: input.entity,
    entityId: input.entityId,
    actorId: input.actorId,
    action: input.action,
    before: input.before ?? undefined,
    after: input.after ?? undefined,
    at: new Date(),
  });
}
