import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: {
      values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      message: '{VALUE} is not a valid blood group'
    }
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required']
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  lastDonationDate: {
    type: Date,
    default: null
  },
  totalDonations: {
    type: Number,
    default: 0
  },
  eligibilityStatus: {
    type: Boolean,
    default: true
  }
});

// Spatial index for location queries
donorSchema.index({ location: '2dsphere' });

const Donor = mongoose.model('Donor', donorSchema);
export default Donor;
