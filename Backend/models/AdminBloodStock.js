import mongoose from 'mongoose';

const adminBloodStockSchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
    unique: true,
  },
  unitsAvailable: { type: Number, default: 0, min: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

const AdminBloodStock = mongoose.model('AdminBloodStock', adminBloodStockSchema);
export default AdminBloodStock;
