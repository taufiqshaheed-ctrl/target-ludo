import mongoose from 'mongoose';

// Single-document model — always upsert the fixed _id 'global'
const paymentSettingsSchema = new mongoose.Schema({
    _id: { type: String, default: 'global' },
    qrImageUrl: { type: String, default: '' },
    upiId: { type: String, default: '' },
    commissionPercent: { type: Number, default: 5, min: 0, max: 100 },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('PaymentSettings', paymentSettingsSchema);
