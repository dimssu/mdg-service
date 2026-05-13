import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const auditLogSchema = new Schema({
  entity: { type: String, required: true },
  entityId: { type: String, required: true },
  actorId: { type: String, required: true },
  action: { type: String, required: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  at: { type: Date, required: true, default: () => new Date() },
});

auditLogSchema.index({ entity: 1, entityId: 1, at: -1 });
auditLogSchema.index({ at: -1 });

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema> & { _id: unknown };
export type AuditLogModelType = Model<AuditLogDoc>;

export const AuditLogModel: AuditLogModelType = model<AuditLogDoc>(
  'AuditLog',
  auditLogSchema,
);
