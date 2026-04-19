import mongoose from 'mongoose';

// Single-document collection — we always upsert the same fixed _id
const announcementSchema = new mongoose.Schema({
    _id: { type: String, default: 'global' },
    message: { type: String, default: '' },
    battleMessage: { type: String, default: '' },
    walletMessage: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Announcement', announcementSchema);
