import mongoose from 'mongoose';

const { Schema, Types: { ObjectId } } = mongoose;

const bloodInventorySchema = new Schema({
  hospital: { type: ObjectId, ref: 'User', required: true, unique: true },
  inventory: [{
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    units: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  }],
  updatedAt: { type: Date, default: Date.now },
});

const BloodInventory = mongoose.model('BloodInventory', bloodInventorySchema);
export default BloodInventory;
