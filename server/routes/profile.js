import express from 'express';
import User from '../models/User.js';
import KYC from '../models/KYC.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/profile  — get own profile (includes kycStatus)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [user, kyc] = await Promise.all([
            User.findById(req.user.id).select('-password'),
            KYC.findOne({ userId: req.user.id }).select('status').lean(),
        ]);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ ...user.toObject(), kycStatus: kyc?.status || 'not_submitted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/profile  — update own profile
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { fullName, phone, avatar } = req.body;
        const updates = {};
        if (fullName) updates.fullName = fullName;
        if (phone !== undefined) updates.phone = phone;
        if (avatar !== undefined) updates.avatar = avatar;

        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/profile/username/check?username=xyz  — check uniqueness
router.get('/username/check', authMiddleware, async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ message: 'username is required' });

        const clean = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
            return res.json({ available: false, message: '3–20 chars: letters, numbers, underscores only' });
        }

        const existing = await User.findOne({ username: clean, _id: { $ne: req.user.id } }).lean();
        if (existing) return res.json({ available: false, message: 'Username already taken' });

        res.json({ available: true, message: 'Username is available' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/profile/username  — set username
router.patch('/username', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ message: 'username is required' });

        const clean = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
            return res.status(400).json({ message: '3–20 chars: letters, numbers, underscores only' });
        }

        const existing = await User.findOne({ username: clean, _id: { $ne: req.user.id } }).lean();
        if (existing) return res.status(409).json({ message: 'Username already taken' });

        const user = await User.findByIdAndUpdate(req.user.id, { username: clean }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
