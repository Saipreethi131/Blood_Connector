import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  donationDate: {
    type: Date,
    default: Date.now
  },
  bloodGroup: {
    type: String,
    required: true
  },
  units: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['Completed', 'Verified'],
    default: 'Completed'
  }
});

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
