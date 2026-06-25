import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    required: true,
  },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromRole: { type: String, enum: ['donor', 'hospital'], required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toRole: { type: String, enum: ['donor', 'hospital'], required: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

// One rating per (request, rater) — prevents duplicate ratings for the same interaction
ratingSchema.index({ request: 1, fromUser: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;
