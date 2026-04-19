import mongoose from 'mongoose';

const kycSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    docType: {
        type: String,
        enum: ['aadhar', 'pan', 'passport', 'driving_license'],
        required: true,
    },
    docNumber: {
        type: String,
        required: true,
        trim: true,
    },
    frontImage: {
        type: String,
        default: '',
    },
    backImage: {
        type: String,
        default: '',
    },
    selfie: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    adminNote: {
        type: String,
        default: '',
    },
}, { timestamps: true });

const KYC = mongoose.model('KYC', kycSchema);
export default KYC;
