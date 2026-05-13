import { CADENCES, DEALER_SERVICE_STATUSES } from '@dk/shared';
import { Schema, model, type InferSchemaType, type Model } from 'mongoose';


const dealerServiceSchema = new Schema(
  {
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
    serviceId: { type: String, required: true, trim: true },
    config: { type: Schema.Types.Mixed, default: {} },
    cadence: { type: String, enum: CADENCES, required: true },
    schedule: { type: String, required: true },
    customCron: { type: String },
    status: {
      type: String,
      enum: DEALER_SERVICE_STATUSES,
      default: 'ACTIVE',
      required: true,
    },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date },
  },
  { timestamps: true },
);

dealerServiceSchema.index({ dealerId: 1, serviceId: 1 }, { unique: true });
dealerServiceSchema.index({ status: 1 });
dealerServiceSchema.index({ nextRunAt: 1 });

export type DealerServiceDoc = InferSchemaType<typeof dealerServiceSchema> & {
  _id: unknown;
};
export type DealerServiceModelType = Model<DealerServiceDoc>;

export const DealerServiceModel: DealerServiceModelType = model<DealerServiceDoc>(
  'DealerService',
  dealerServiceSchema,
);
