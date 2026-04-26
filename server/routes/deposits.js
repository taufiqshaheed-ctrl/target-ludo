import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ActiveSession from '../models/ActiveSession.js';
import DepositRequest from '../models/DepositRequest.js';
import Transaction from '../models/Transaction.js';
import PaymentSettings from '../models/PaymentSettings.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Multer for payment screenshots
const screenshotStorage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads'),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `deposit_ss_${Date.now()}${ext}`);
    },
});
const uploadScreenshot = multer({
    storage: screenshotStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

// Auth middleware
const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
        const session = await ActiveSession.findOne({ userId: decoded.id }).lean();
        if (!session) return res.status(401).json({ message: 'Session invalidated. Please log in again.' });
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// GET /api/deposits/payment-settings — public
router.get('/payment-settings', async (_req, res) => {
    try {
        const settings = await PaymentSettings.findById('global').lean();
        res.json({ qrImageUrl: settings?.qrImageUrl || '', upiId: settings?.upiId || '' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/deposits — multipart: amount (field) + screenshot (file)
router.post('/', authMiddleware, uploadScreenshot.single('screenshot'), async (req, res) => {
    const amount = Number(req.body.amount);
    if (!req.body.amount || isNaN(amount) || amount < 10 || amount > 200000) {
        return res.status(400).json({ message: 'Invalid amount. Must be between ₹10 and ₹2,00,000.' });
    }
    if (!req.file) {
        return res.status(400).json({ message: 'Payment screenshot is required.' });
    }
    try {
        const screenshotUrl = `/uploads/${req.file.filename}`;
        const utrNumber = req.body.utrNumber?.trim() || '';

        // Create a pending transaction entry for history tracking
        const txn = await Transaction.create({
            userId: req.user.id,
            type: 'deposit',
            amount,
            status: 'pending',
            note: utrNumber ? `UTR: ${utrNumber} — Awaiting admin verification` : 'Awaiting admin verification',
        });

        // Create deposit request linked to the transaction
        const request = await DepositRequest.create({
            userId: req.user.id,
            amount,
            screenshotUrl,
            utrNumber,
            transactionId: txn._id,
        });

        res.status(201).json({
            message: 'Deposit request submitted. Admin will verify your screenshot and credit your wallet.',
            request,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/deposits/my — user's own deposit history
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const requests = await DepositRequest.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json({ requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/deposits/transactions — user's transaction history (all types)
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        res.json({ transactions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/deposits/withdraw — submit a withdrawal request (deducts coins immediately)
router.post('/withdraw', authMiddleware, async (req, res) => {
    const amount = Number(req.body.amount);
    if (!req.body.amount || isNaN(amount) || amount < 100 || amount > 200000) {
        return res.status(400).json({ message: 'Invalid amount. Minimum withdrawal is ₹100.' });
    }

    const { accountHolderName, bankName, accountNumber, ifscCode, upiId } = req.body;
    // Require either bank details or UPI ID
    const hasBankDetails = accountHolderName && bankName && accountNumber && ifscCode;
    const hasUpi = upiId && upiId.trim();
    if (!hasBankDetails && !hasUpi) {
        return res.status(400).json({ message: 'Please provide bank account details or a UPI ID.' });
    }

    try {
        // Check user has enough coins
        const user = await User.findById(req.user.id).select('coins');
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.coins < amount) {
            return res.status(400).json({ message: 'Insufficient wallet balance.' });
        }

        // Deduct coins immediately so they can't be double-spent
        await User.findByIdAndUpdate(req.user.id, { $inc: { coins: -amount } });

        // Create a pending transaction for history tracking
        const txn = await Transaction.create({
            userId: req.user.id,
            type: 'withdrawal',
            amount,
            status: 'pending',
            note: 'Withdrawal request submitted, pending admin approval',
        });

        // Create withdrawal request
        const request = await WithdrawalRequest.create({
            userId: req.user.id,
            amount,
            bankDetails: {
                accountHolderName: accountHolderName?.trim() || '',
                bankName: bankName?.trim() || '',
                accountNumber: accountNumber?.trim() || '',
                ifscCode: ifscCode?.trim().toUpperCase() || '',
                upiId: upiId?.trim() || '',
            },
            transactionId: txn._id,
        });

        res.status(201).json({
            message: 'Withdrawal request submitted. Admin will process it within 24 hours.',
            request,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/deposits/withdrawals — user's own withdrawal history
router.get('/withdrawals', authMiddleware, async (req, res) => {
    try {
        const requests = await WithdrawalRequest.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json({ requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
