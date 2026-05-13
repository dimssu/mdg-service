import {
  DEALER_STATUSES,
  ONBOARDING_STEP_IDS,
  ONBOARDING_STEP_STATUSES,
  SLA_TIERS,
} from '@dk/shared';
import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const ownerContactSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  { _id: false },
);

const pumpLocationSchema = new Schema(
  {
    address: { type: String, required: true },
    city: String,
    state: String,
    pincode: String,
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const bankDetailsSchema = new Schema(
  {
    accountHolder: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
    bankName: { type: String, required: true },
    branch: String,
  },
  { _id: false },
);

const complianceDocSchema = new Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const dealerAuditEntrySchema = new Schema(
  {
    at: { type: Date, required: true, default: () => new Date() },
    actorId: { type: String, required: true },
    action: { type: String, required: true },
    note: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
  },
  { _id: false },
);

const portalCredentialsSchema = new Schema(
  {
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    setAt: { type: Date, required: true, default: () => new Date() },
    issuedBy: { type: String, required: true },
    mustChangeOnFirstLogin: { type: Boolean, default: true },
  },
  { _id: false },
);

const whatsappGroupsSchema = new Schema(
  {
    adminGroupName: String,
    adminGroupInviteLink: String,
    adminGroupCreatedAt: Date,
    dealerGroupName: String,
    dealerGroupInviteLink: String,
    dealerGroupCreatedAt: Date,
  },
  { _id: false },
);

const onboardingStepEntrySchema = new Schema(
  {
    id: { type: String, enum: ONBOARDING_STEP_IDS, required: true },
    status: { type: String, enum: ONBOARDING_STEP_STATUSES, required: true, default: 'PENDING' },
    completedAt: Date,
    completedBy: String,
    data: Schema.Types.Mixed,
    note: String,
  },
  { _id: false },
);

const onboardingSchema = new Schema(
  {
    // Nullable on purpose — set to null once all steps are DONE.
    currentStepId: {
      type: String,
      enum: [...ONBOARDING_STEP_IDS, null],
      default: 'collect-phone',
    },
    completedStepCount: { type: Number, default: 0 },
    steps: { type: [onboardingStepEntrySchema], default: [] },
  },
  { _id: false },
);

const dealerSchema = new Schema(
  {
    // Captured up front (step 1)
    phone: { type: String, required: true, trim: true },
    name: { type: String, trim: true },

    // Assigned at step 6
    code: { type: String, uppercase: true, trim: true },

    // Optional / filled in over the journey
    ownerContact: { type: ownerContactSchema },
    pumpLocation: { type: pumpLocationSchema },
    gst: { type: String, uppercase: true, trim: true },
    pan: { type: String, uppercase: true, trim: true },
    onboardingDate: { type: Date, required: true, default: () => new Date() },
    status: {
      type: String,
      enum: DEALER_STATUSES,
      default: 'ONBOARDING',
      required: true,
    },

    // Step 5
    paymentNote: String,
    paymentReceivedAt: Date,

    // Step 7
    portalCredentials: { type: portalCredentialsSchema },

    // Steps 7 + 8
    whatsappGroups: { type: whatsappGroupsSchema },

    // Optional business data, no longer gating ACTIVE
    bankDetails: { type: bankDetailsSchema },
    complianceDocs: { type: [complianceDocSchema], default: [] },
    slaTier: { type: String, enum: SLA_TIERS },

    onboarding: { type: onboardingSchema, required: true },
    audit: { type: [dealerAuditEntrySchema], default: [] },
  },
  { timestamps: true },
);

dealerSchema.index({ status: 1 });
dealerSchema.index({ name: 'text' });
// Sparse-unique indexes: many dealers can have these fields absent during onboarding,
// but once set they must be unique.
dealerSchema.index({ phone: 1 }, { unique: true, sparse: true });
dealerSchema.index({ code: 1 }, { unique: true, sparse: true });
dealerSchema.index({ gst: 1 }, { unique: true, sparse: true });
dealerSchema.index({ pan: 1 }, { sparse: true });
dealerSchema.index({ 'portalCredentials.username': 1 }, { unique: true, sparse: true });

export type DealerDoc = InferSchemaType<typeof dealerSchema> & { _id: unknown };
export type DealerModelType = Model<DealerDoc>;

export const DealerModel: DealerModelType = model<DealerDoc>('Dealer', dealerSchema);
