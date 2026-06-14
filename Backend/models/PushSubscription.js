import mongoose from 'mongoose';

const { Schema, Types: { ObjectId } } = mongoose;

const pushSubscriptionSchema = new Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true },
    },
  },
  bloodGroup: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

pushSubscriptionSchema.index({ user: 1 });
pushSubscriptionSchema.index({ 'subscription.endpoint': 1 }, { unique: true });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;
