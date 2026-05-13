import { SERVICE_RUN_STATUSES } from '@dk/shared';
import { Schema, model, type InferSchemaType, type Model } from 'mongoose';


const serviceRunErrorSchema = new Schema(
  {
    message: { type: String, required: true },
    stack: { type: String },
  },
  { _id: false },
);

const serviceRunSchema = new Schema(
  {
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
    serviceId: { type: String, required: true },
    dealerServiceId: {
      type: Schema.Types.ObjectId,
      ref: 'DealerService',
      required: true,
    },
    startedAt: { type: Date, required: true, default: () => new Date() },
    finishedAt: { type: Date },
    status: { type: String, enum: SERVICE_RUN_STATUSES, required: true },
    durationMs: { type: Number },
    output: { type: Schema.Types.Mixed },
    error: { type: serviceRunErrorSchema },
  },
  { timestamps: true },
);

serviceRunSchema.index({ dealerId: 1 });
serviceRunSchema.index({ serviceId: 1 });
serviceRunSchema.index({ status: 1 });
serviceRunSchema.index({ startedAt: -1 });

export type ServiceRunDoc = InferSchemaType<typeof serviceRunSchema> & {
  _id: unknown;
};
export type ServiceRunModelType = Model<ServiceRunDoc>;

export const ServiceRunModel: ServiceRunModelType = model<ServiceRunDoc>(
  'ServiceRun',
  serviceRunSchema,
);
