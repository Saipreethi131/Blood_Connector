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
  // No defaults here on purpose: a 2dsphere index needs the field to be
  // fully ABSENT (not present-with-null) to safely skip undonated-location
  // donors in geo queries. A present-but-invalid GeoJSON object (e.g.
  // { type: null, coordinates: null }) can throw on insert.
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
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
  },
  weight: {
    type: Number,
    default: null
  },
  age: {
    type: Number,
    default: null
  },
  hemoglobin: {
    type: Number,
    default: null
  },
  chronicConditions: {
    type: Boolean,
    default: false
  }
});

// Spatial index for location queries
donorSchema.index({ location: '2dsphere' });

const Donor = mongoose.model('Donor', donorSchema);
export default Donor;
