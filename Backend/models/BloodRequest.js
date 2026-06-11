import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsRequired: {
    type: Number,
    required: [true, 'Number of units is required'],
    min: [1, 'At least 1 unit is required']
  },
  urgency: {
    type: String,
    enum: ['Normal', 'Urgent', 'Critical'],
    required: [true, 'Urgency level is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    type: String,
    required: [true, 'Hospital address is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Fulfilled', 'Cancelled'],
    default: 'Pending'
  },
  sosLevel: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: 1
  },
  searchRadius: {
    type: Number,
    default: 5 // in km
  },
  responses: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending'
    },
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bloodRequestSchema.index({ location: '2dsphere' });

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);
export default BloodRequest;
