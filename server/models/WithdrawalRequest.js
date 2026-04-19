import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: { type: Number, required: true },
    bankDetails: {
        accountHolderName: { type: String, default: '' },
        bankName:          { type: String, default: '' },
        accountNumber:     { type: String, default: '' },
        ifscCode:          { type: String, default: '' },
        upiId:             { type: String, default: '' },
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    adminNote: { type: String, default: '' },
    processedAt: { type: Date },
}, { timestamps: true });

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
export default WithdrawalRequest;
