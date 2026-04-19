import mongoose from 'mongoose';

const depositRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    screenshotUrl: {
        type: String,
        default: '',
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null,
    },
    adminNote: {
        type: String,
        default: '',
    },
    processedAt: {
        type: Date,
    },
}, { timestamps: true });

const DepositRequest = mongoose.model('DepositRequest', depositRequestSchema);
export default DepositRequest;
