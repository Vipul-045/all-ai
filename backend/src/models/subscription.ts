import mongoose, { Model, Schema, Types } from "mongoose";

interface ISubscription extends mongoose.Document {
  userId: Types.ObjectId;
  planName: string;
  status?: "active" | "cancelled" | "expired" | "trial";
  startDate?: Date;
  endDate?: Date;
  isAutoRenew?: boolean;
}

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planName: { type: String, required: true }, // e.g., "Basic", "Pro"
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "trial"],
      default: "active",
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isAutoRenew: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const SubscriptionModel: Model<ISubscription> = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);

export default SubscriptionModel;
