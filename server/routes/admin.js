import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import KYC from '../models/KYC.js';
import ActiveSession from '../models/ActiveSession.js';
import Announcement from '../models/Announcement.js';
import CarouselImage from '../models/CarouselImage.js';
import PaymentSettings from '../models/PaymentSettings.js';
import DepositRequest from '../models/DepositRequest.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import Battle from '../models/Battle.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads'),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `carousel_${Date.now()}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

// Separate multer instance for QR images
const qrStorage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads'),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `payment_qr${ext}`); // fixed name so old one is overwritten
    },
});
const uploadQR = multer({
    storage: qrStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

const router = express.Router();

// Admin auth middleware
const adminMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
        const user = await User.findById(decoded.id).select('role');
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const session = await ActiveSession.findOne({ userId: decoded.id }).lean();
        if (!session) return res.status(401).json({ message: 'Session invalidated' });
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// GET /api/admin/stats
router.get('/stats', adminMiddleware, async (req, res) => {
    try {
        const [totalUsers, totalTransactions, pendingKYC, completedDeposits, completedWithdrawals] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Transaction.countDocuments(),
            KYC.countDocuments({ status: 'pending' }),
            Transaction.aggregate([
                { $match: { type: 'deposit', status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Transaction.aggregate([
                { $match: { type: 'withdrawal', status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);

        res.json({
            totalUsers,
            totalTransactions,
            pendingKYC,
            totalDeposits: completedDeposits[0]?.total || 0,
            totalWithdrawals: completedWithdrawals[0]?.total || 0,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/users?search=&page=1&limit=20
router.get('/users', adminMiddleware, async (req, res) => {
    try {
        const { search = '', page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const query = search
            ? {
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -otp -otpExpires')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(query),
        ]);

        // Attach KYC status to each user
        const userIds = users.map(u => u._id);
        const kycs = await KYC.find({ userId: { $in: userIds } }).select('userId status').lean();
        const kycMap = {};
        kycs.forEach(k => { kycMap[k.userId.toString()] = k.status; });

        const usersWithKYC = users.map(u => ({
            ...u,
            kycStatus: kycMap[u._id.toString()] || 'not_submitted',
        }));

        res.json({ users: usersWithKYC, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/users/:id
router.get('/users/:id', adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -otp -otpExpires').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const [transactions, kyc] = await Promise.all([
            Transaction.find({ userId: req.params.id }).sort({ createdAt: -1 }).lean(),
            KYC.findOne({ userId: req.params.id }).lean(),
        ]);

        res.json({ user, transactions, kyc });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/users/:id  — update role, coins, fullName, phone
router.patch('/users/:id', adminMiddleware, async (req, res) => {
    try {
        const { role, coins, fullName, phone } = req.body;
        const updates = {};
        if (role && ['user', 'admin'].includes(role)) updates.role = role;
        if (coins !== undefined && !isNaN(coins)) updates.coins = Number(coins);
        if (fullName && fullName.trim()) updates.fullName = fullName.trim();
        if (phone !== undefined) updates.phone = phone.trim();

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password -otp -otpExpires');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/users/:id — delete user and all associated data
router.delete('/users/:id', adminMiddleware, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await Promise.all([
            Transaction.deleteMany({ userId: req.params.id }),
            KYC.deleteMany({ userId: req.params.id }),
            DepositRequest.deleteMany({ userId: req.params.id }),
            WithdrawalRequest.deleteMany({ userId: req.params.id }),
            Battle.deleteMany({ $or: [{ creator: req.params.id }, { player2: req.params.id }] }),
        ]);
        res.json({ message: 'User and all associated data deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/transactions?page=1&limit=20&type=&status=&userId=
router.get('/transactions', adminMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status, userId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;
        if (userId) query.userId = userId;

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .populate('userId', 'fullName email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Transaction.countDocuments(query),
        ]);

        res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/transactions/:id — update status and/or note
router.patch('/transactions/:id', adminMiddleware, async (req, res) => {
    try {
        const { status, note } = req.body;
        const updates = {};
        if (status) {
            if (!['pending', 'completed', 'failed'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
            updates.status = status;
        }
        if (note !== undefined) updates.note = note;

        const txn = await Transaction.findByIdAndUpdate(req.params.id, updates, { new: true })
            .populate('userId', 'fullName email');
        if (!txn) return res.status(404).json({ message: 'Transaction not found' });
        res.json(txn);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/transactions/:id
router.delete('/transactions/:id', adminMiddleware, async (req, res) => {
    try {
        const txn = await Transaction.findByIdAndDelete(req.params.id);
        if (!txn) return res.status(404).json({ message: 'Transaction not found' });
        res.json({ message: 'Transaction deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/kyc?status=pending&page=1&limit=20
router.get('/kyc', adminMiddleware, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const query = status ? { status } : {};

        const [submissions, total] = await Promise.all([
            KYC.find(query)
                .populate('userId', 'fullName email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            KYC.countDocuments(query),
        ]);

        res.json({ submissions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/kyc/:id — approve or reject
router.patch('/kyc/:id', adminMiddleware, async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected' });
        }
        const kyc = await KYC.findByIdAndUpdate(
            req.params.id,
            { status, adminNote: adminNote || '' },
            { new: true }
        ).populate('userId', 'fullName email');
        if (!kyc) return res.status(404).json({ message: 'KYC not found' });
        res.json(kyc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/kyc/:id
router.delete('/kyc/:id', adminMiddleware, async (req, res) => {
    try {
        const kyc = await KYC.findByIdAndDelete(req.params.id);
        if (!kyc) return res.status(404).json({ message: 'KYC not found' });
        res.json({ message: 'KYC submission deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/carousel — public
router.get('/carousel', async (_req, res) => {
    try {
        const images = await CarouselImage.find().sort({ order: 1, createdAt: 1 }).lean();
        res.json({ images });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/carousel — admin only, upload image
router.post('/carousel', adminMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const url = `${baseUrl}/uploads/${req.file.filename}`;
        const count = await CarouselImage.countDocuments();
        const image = await CarouselImage.create({ filename: req.file.filename, url, order: count });
        res.json(image);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/carousel/:id — admin only
router.delete('/carousel/:id', adminMiddleware, async (req, res) => {
    try {
        const image = await CarouselImage.findByIdAndDelete(req.params.id);
        if (!image) return res.status(404).json({ message: 'Image not found' });
        const filePath = path.join(__dirname, '../uploads', image.filename);
        fs.unlink(filePath, () => {});
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/announcement — public, returns both home & battle messages
router.get('/announcement', async (_req, res) => {
    try {
        const announcement = await Announcement.findById('global').lean();
        res.json({
            message: announcement?.message || '',
            battleMessage: announcement?.battleMessage || '',
            walletMessage: announcement?.walletMessage || '',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/announcement — admin only, set/update home message
router.post('/announcement', adminMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        if (typeof message !== 'string') {
            return res.status(400).json({ message: 'message must be a string' });
        }
        const announcement = await Announcement.findByIdAndUpdate(
            'global',
            { message: message.trim(), updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ message: announcement.message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/announcement/battle — admin only, set/update battle message
router.post('/announcement/battle', adminMiddleware, async (req, res) => {
    try {
        const { battleMessage } = req.body;
        if (typeof battleMessage !== 'string') {
            return res.status(400).json({ message: 'battleMessage must be a string' });
        }
        const announcement = await Announcement.findByIdAndUpdate(
            'global',
            { battleMessage: battleMessage.trim(), updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ battleMessage: announcement.battleMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/announcement/wallet — admin only, set/update wallet add-money message
router.post('/announcement/wallet', adminMiddleware, async (req, res) => {
    try {
        const { walletMessage } = req.body;
        if (typeof walletMessage !== 'string') {
            return res.status(400).json({ message: 'walletMessage must be a string' });
        }
        const announcement = await Announcement.findByIdAndUpdate(
            'global',
            { walletMessage: walletMessage.trim(), updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ walletMessage: announcement.walletMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Payment QR ────────────────────────────────────────────────────────────────

// GET /api/admin/payment-settings — public; returns QR URL + upiId + commissionPercent
router.get('/payment-settings', async (_req, res) => {
    try {
        const settings = await PaymentSettings.findById('global').lean();
        res.json({
            qrImageUrl: settings?.qrImageUrl || '',
            upiId: settings?.upiId || '',
            commissionPercent: settings?.commissionPercent ?? 5,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/commission — admin sets prize deduction %
router.put('/commission', adminMiddleware, async (req, res) => {
    try {
        const { commissionPercent } = req.body;
        const pct = Number(commissionPercent);
        if (isNaN(pct) || pct < 0 || pct > 100) {
            return res.status(400).json({ message: 'commissionPercent must be 0–100' });
        }
        const settings = await PaymentSettings.findByIdAndUpdate(
            'global',
            { commissionPercent: pct, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ commissionPercent: settings.commissionPercent });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/payment-qr — admin uploads payment QR image
router.post('/payment-qr', adminMiddleware, uploadQR.single('qr'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
        const qrImageUrl = `/uploads/${req.file.filename}`;
        const settings = await PaymentSettings.findByIdAndUpdate(
            'global',
            { qrImageUrl, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ qrImageUrl: settings.qrImageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/payment-upi — admin sets UPI ID text
router.put('/payment-upi', adminMiddleware, async (req, res) => {
    try {
        const { upiId } = req.body;
        if (typeof upiId !== 'string') return res.status(400).json({ message: 'upiId must be a string' });
        const settings = await PaymentSettings.findByIdAndUpdate(
            'global',
            { upiId: upiId.trim(), updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ upiId: settings.upiId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Deposit Requests ───────────────────────────────────────────────────────────

// GET /api/admin/deposits — list all deposit requests (newest first)
router.get('/deposits', adminMiddleware, async (_req, res) => {
    try {
        const requests = await DepositRequest.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName email username')
            .lean();
        res.json({ requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/deposits/:id/approve — approve + credit coins + complete transaction
router.patch('/deposits/:id/approve', adminMiddleware, async (req, res) => {
    try {
        const request = await DepositRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Deposit request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        // Credit coins to user wallet
        await User.findByIdAndUpdate(request.userId, { $inc: { coins: request.amount } });

        // Mark linked transaction as completed
        if (request.transactionId) {
            await Transaction.findByIdAndUpdate(request.transactionId, {
                status: 'completed',
                note: 'Deposit approved by admin',
            });
        } else {
            // Fallback for requests created before transactionId was added
            await Transaction.create({
                userId: request.userId,
                type: 'deposit',
                amount: request.amount,
                status: 'completed',
                reference: request._id.toString(),
                note: 'Deposit approved by admin',
            });
        }

        request.status = 'approved';
        request.processedAt = new Date();
        await request.save();
        await request.populate('userId', 'fullName email username');

        res.json({ message: `₹${request.amount} credited to user's wallet.`, request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/deposits/:id/reject — reject with optional note + fail transaction
router.patch('/deposits/:id/reject', adminMiddleware, async (req, res) => {
    try {
        const { adminNote } = req.body;
        const request = await DepositRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Deposit request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        // Mark linked transaction as failed
        if (request.transactionId) {
            await Transaction.findByIdAndUpdate(request.transactionId, {
                status: 'failed',
                note: adminNote?.trim() ? `Rejected: ${adminNote.trim()}` : 'Deposit rejected by admin',
            });
        }

        request.status = 'rejected';
        request.adminNote = adminNote?.trim() || '';
        request.processedAt = new Date();
        await request.save();
        await request.populate('userId', 'fullName email username');

        res.json({ message: 'Deposit request rejected.', request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/deposits/:id
router.delete('/deposits/:id', adminMiddleware, async (req, res) => {
    try {
        const req_ = await DepositRequest.findByIdAndDelete(req.params.id);
        if (!req_) return res.status(404).json({ message: 'Deposit request not found' });
        res.json({ message: 'Deposit request deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Withdrawal Requests ───────────────────────────────────────────────────────

// GET /api/admin/withdrawals — list all withdrawal requests (newest first)
router.get('/withdrawals', adminMiddleware, async (_req, res) => {
    try {
        const requests = await WithdrawalRequest.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName email username')
            .lean();
        res.json({ requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/withdrawals/:id/approve — mark as approved, complete transaction
router.patch('/withdrawals/:id/approve', adminMiddleware, async (req, res) => {
    try {
        const request = await WithdrawalRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Withdrawal request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        // Complete the linked transaction
        if (request.transactionId) {
            await Transaction.findByIdAndUpdate(request.transactionId, {
                status: 'completed',
                note: 'Withdrawal approved and transferred by admin',
            });
        }

        request.status = 'approved';
        request.processedAt = new Date();
        await request.save();
        await request.populate('userId', 'fullName email username');

        res.json({ message: `Withdrawal of ₹${request.amount} approved.`, request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/withdrawals/:id/reject — reject + refund coins to user
router.patch('/withdrawals/:id/reject', adminMiddleware, async (req, res) => {
    try {
        const { adminNote } = req.body;
        const request = await WithdrawalRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Withdrawal request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        // Refund coins back to user
        await User.findByIdAndUpdate(request.userId, { $inc: { coins: request.amount } });

        // Mark transaction as failed and create a refund transaction
        if (request.transactionId) {
            await Transaction.findByIdAndUpdate(request.transactionId, {
                status: 'failed',
                note: adminNote?.trim() ? `Rejected: ${adminNote.trim()}` : 'Withdrawal rejected by admin',
            });
        }
        await Transaction.create({
            userId: request.userId,
            type: 'refund',
            amount: request.amount,
            status: 'completed',
            note: adminNote?.trim() ? `Withdrawal refund: ${adminNote.trim()}` : 'Withdrawal request rejected — amount refunded',
        });

        request.status = 'rejected';
        request.adminNote = adminNote?.trim() || '';
        request.processedAt = new Date();
        await request.save();
        await request.populate('userId', 'fullName email username');

        res.json({ message: 'Withdrawal rejected and amount refunded to user.', request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/withdrawals/:id
router.delete('/withdrawals/:id', adminMiddleware, async (req, res) => {
    try {
        const req_ = await WithdrawalRequest.findByIdAndDelete(req.params.id);
        if (!req_) return res.status(404).json({ message: 'Withdrawal request not found' });
        res.json({ message: 'Withdrawal request deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Battle Management ─────────────────────────────────────────────────────────

// GET /api/admin/battles?status=&page=1&limit=20
router.get('/battles', adminMiddleware, async (req, res) => {
    try {
        const { status, page = 1, limit = 30 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const query = status ? { status } : {};

        const [battles, total] = await Promise.all([
            Battle.find(query)
                .populate('creator', 'fullName username')
                .populate('player2', 'fullName username')
                .populate('winner', 'fullName username')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Battle.countDocuments(query),
        ]);

        res.json({ battles, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/battles/:id/winner — admin declares winner and credits prize
router.patch('/battles/:id/winner', adminMiddleware, async (req, res) => {
    try {
        const { winnerId, adminNote } = req.body;
        if (!winnerId) return res.status(400).json({ message: 'winnerId required' });

        const battle = await Battle.findById(req.params.id)
            .populate('creator', 'fullName username')
            .populate('player2', 'fullName username');
        if (!battle) return res.status(404).json({ message: 'Battle not found' });
        if (battle.status === 'completed') return res.status(400).json({ message: 'Battle already completed' });
        if (battle.status === 'cancelled') return res.status(400).json({ message: 'Cannot declare winner on cancelled battle' });

        const creatorId = battle.creator._id.toString();
        const player2Id = battle.player2?._id?.toString();
        if (winnerId !== creatorId && winnerId !== player2Id) {
            return res.status(400).json({ message: 'winnerId must be one of the participants' });
        }

        // Only mark winner — do NOT auto-credit here.
        // Admin explicitly credits via POST /admin/battles/:id/credit with editable amount.
        battle.winner = winnerId;
        battle.status = 'completed';
        battle.adminNote = adminNote?.trim() || '';
        await battle.save();
        await battle.populate('winner', 'fullName username');

        res.json({ message: `Winner declared. Use the Credit button to send prize money.`, battle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/battles/:id/void — admin voids battle and refunds both players
router.patch('/battles/:id/void', adminMiddleware, async (req, res) => {
    try {
        const { adminNote } = req.body;

        const battle = await Battle.findById(req.params.id)
            .populate('creator', 'fullName username')
            .populate('player2', 'fullName username');
        if (!battle) return res.status(404).json({ message: 'Battle not found' });
        if (['completed', 'cancelled'].includes(battle.status)) {
            return res.status(400).json({ message: 'Battle already finalised' });
        }

        // Refund both players
        await User.findByIdAndUpdate(battle.creator._id, { $inc: { coins: battle.entryFee } });
        if (battle.player2) {
            await User.findByIdAndUpdate(battle.player2._id, { $inc: { coins: battle.entryFee } });
        }

        battle.status = 'cancelled';
        battle.adminNote = adminNote?.trim() || 'Voided by admin';
        await battle.save();

        res.json({ message: 'Battle voided and entry fees refunded.', battle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/battles/:id/credit — manually credit a custom amount to the winner
router.post('/battles/:id/credit', adminMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const amt = Number(amount);
        if (!amt || amt <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

        const battle = await Battle.findById(req.params.id)
            .populate('creator', 'fullName username')
            .populate('player2', 'fullName username')
            .populate('winner', 'fullName username');
        if (!battle) return res.status(404).json({ message: 'Battle not found' });
        if (battle.status !== 'completed') return res.status(400).json({ message: 'Battle must be completed to credit winner' });
        if (!battle.winner) return res.status(400).json({ message: 'No winner set for this battle' });
        if (battle.prizeCredited) return res.status(400).json({ message: 'Prize already credited for this battle' });

        battle.prizeCredited = true;
        await battle.save();

        await User.findByIdAndUpdate(battle.winner._id, { $inc: { coins: amt } });
        await Transaction.create({
            userId: battle.winner._id,
            type: 'battle_win',
            amount: amt,
            status: 'completed',
            description: `Manual credit by admin — Battle ID ${battle._id}`,
        });

        res.json({ message: `₹${amt} credited to ${battle.winner.fullName}`, battle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/battles/:id
router.delete('/battles/:id', adminMiddleware, async (req, res) => {
    try {
        const battle = await Battle.findByIdAndDelete(req.params.id);
        if (!battle) return res.status(404).json({ message: 'Battle not found' });
        res.json({ message: 'Battle deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
