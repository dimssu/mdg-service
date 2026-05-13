import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    roles: { type: [String], default: ['admin'] },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

// Note: `unique: true` on the `email` field above already creates a unique index;
// declaring it again with `adminSchema.index(...)` causes Mongoose to log a
// "Duplicate schema index" warning at startup. Keep only the field-level
// declaration.

export type AdminDoc = InferSchemaType<typeof adminSchema> & { _id: unknown };
export type AdminModelType = Model<AdminDoc>;

export const AdminModel: AdminModelType = model<AdminDoc>('Admin', adminSchema);
