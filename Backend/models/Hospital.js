import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License/Registration number is required'],
    unique: true,
    trim: true
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
  emergencyContact: {
    type: String,
    required: [true, 'Emergency contact number is required']
  }
});

hospitalSchema.index({ location: '2dsphere' });

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
