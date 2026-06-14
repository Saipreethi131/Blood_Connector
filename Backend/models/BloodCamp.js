import mongoose from 'mongoose';

const { Schema, Types: { ObjectId } } = mongoose;

const bloodCampSchema = new Schema({
  hospital: { type: ObjectId, ref: 'User', required: true },
  hospitalName: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  },
  targetBloodGroups: [{
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  }],
  registrations: [{
    donor: { type: ObjectId, ref: 'User' },
    donorName: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    registeredAt: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming',
  },
  createdAt: { type: Date, default: Date.now },
});

bloodCampSchema.index({ location: '2dsphere' });
bloodCampSchema.index({ date: 1, status: 1 });

const BloodCamp = mongoose.model('BloodCamp', bloodCampSchema);
export default BloodCamp;
