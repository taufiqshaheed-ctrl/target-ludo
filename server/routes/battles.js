import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Battle from '../models/Battle.js';
import ActiveSession from '../models/ActiveSession.js';
import PaymentSettings from '../models/PaymentSettings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/battle-results');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const router = express.Router();

// Multer for battle result screenshots
const screenshotStorage = multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `battle_result_${Date.now()}${ext}`);
    },
});
const uploadScreenshot = multer({
    storage: screenshotStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
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
        if (!session) return res.status(401).json({ message: 'Session invalidated' });
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// GET /api/battles — list open battles (excluding ones created by current user)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const battles = await Battle.find({ status: 'open', creator: { $ne: req.user.id } })
            .populate('creator', 'fullName')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ battles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/battles/running — all battles in progress or awaiting result
router.get('/running', authMiddleware, async (req, res) => {
    try {
        const battles = await Battle.find({ status: { $in: ['running', 'result_pending'] } })
            .populate('creator', 'fullName username')
            .populate('player2', 'fullName username')
            .sort({ updatedAt: -1 })
            .lean();
        res.json({ battles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/battles/my — battles the current user is part of (open/running/result_pending)
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const battles = await Battle.find({
            $or: [{ creator: req.user.id }, { player2: req.user.id }],
            status: { $in: ['open', 'running', 'result_pending'] },
        })
            .populate('creator', 'fullName')
            .populate('player2', 'fullName')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ battles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/battles — create a battle (deducts entry fee)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { entryFee } = req.body;
        const fee = Number(entryFee);
        if (!fee || fee < 1) return res.status(400).json({ message: 'Invalid entry fee' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.coins < fee) return res.status(400).json({ message: 'Insufficient balance' });

        user.coins -= fee;
        await user.save();

        const settings = await PaymentSettings.findById('global').lean();
        const commissionPct = settings?.commissionPercent ?? 5;
        const prize = Math.floor(fee * 2 * (1 - commissionPct / 100));
        const battle = await Battle.create({ creator: req.user.id, entryFee: fee, prize });
        await battle.populate('creator', 'fullName');

        res.json({ battle, newBalance: user.coins });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/battles/:id/join — join an open battle
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const battle = await Battle.findById(req.params.id).populate('creator', 'fullName');
        if (!battle) return res.status(404).json({ message: 'Battle not found' });
        if (battle.status !== 'open') return res.status(400).json({ message: 'Battle is not open' });
        if (battle.creator._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot join your own battle' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.coins < battle.entryFee) return res.status(400).json({ message: 'Insufficient balance' });

        user.coins -= battle.entryFee;
        await user.save();

        battle.player2 = req.user.id;
        battle.status = 'running';
        await battle.save();
        await battle.populate('player2', 'fullName');

        res.json({ battle, newBalance: user.coins });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/battles/:id/room-code — creator sets the Ludo King room code
router.patch('/:id/room-code', authMiddleware, async (req, res) => {
    try {
        const { roomCode } = req.body;
        if (!roomCode?.trim()) return res.status(400).json({ message: 'Room code required' });

        const battle = await Battle.findById(req.params.id)
            .populate('creator', 'fullName')
            .populate('player2', 'fullName');
        if (!battle) return res.status(404).json({ message: 'Battle not found' });
        if (battle.creator._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the creator can set the room code' });
        }
        if (!['open', 'running'].includes(battle.status)) return res.status(400).json({ message: 'Cannot set room code at this stage' });

        battle.roomCode = roomCode.trim().toUpperCase();
        await battle.save();

        res.json({ battle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/battles/:id/result — player submits result + screenshot
router.post('/:id/result', authMiddleware, uploadScreenshot.single('screenshot'), async (req, res) => {
    try {
        const { result } = req.body; // 'won' | 'lost' | 'cancelled'
        if (!['won', 'lost', 'cancelled'].includes(result)) {
            return res.status(400).json({ message: 'Invalid result value' });
        }

        const battle = await Battle.findById(req.params.id)
            .populate('creator', 'fullName')
            .populate('player2', 'fullName');
        if (!battle) return res.status(404).json({ message: 'Battle not found' });
        if (!['running', 'result_pending'].includes(battle.status)) {
            return res.status(400).json({ message: 'Battle is not in a submittable state' });
        }

        const isCreator = battle.creator._id.toString() === req.user.id;
        const isPlayer2 = battle.player2?._id?.toString() === req.user.id;
        if (!isCreator && !isPlayer2) {
            return res.status(403).json({ message: 'Not a participant of this battle' });
        }

        const screenshotUrl = req.file
            ? `/uploads/battle-results/${req.file.filename}`
            : '';

        if (isCreator) {
            battle.creatorResult = result;
            if (screenshotUrl) battle.creatorScreenshot = screenshotUrl;
        } else {
            battle.player2Result = result;
            if (screenshotUrl) battle.player2Screenshot = screenshotUrl;
        }

        // Move to result_pending once any player submits
        battle.status = 'result_pending';

        const cr = battle.creatorResult;
        const pr = battle.player2Result;

        // Auto-resolve when both have submitted and they agree
        if (cr !== 'pending' && pr !== 'pending') {
            if (cr === 'won' && pr === 'lost') {
                battle.status = 'completed';
                battle.winner = battle.creator._id;
            } else if (cr === 'lost' && pr === 'won') {
                battle.status = 'completed';
                battle.winner = battle.player2._id;
            } else if (cr === 'cancelled' && pr === 'cancelled') {
                battle.status = 'cancelled';
                await User.findByIdAndUpdate(battle.creator._id, { $inc: { coins: battle.entryFee } });
                await User.findByIdAndUpdate(battle.player2._id, { $inc: { coins: battle.entryFee } });
            }
            // Conflicting results → stays result_pending for admin to resolve
        }

        await battle.save();
        res.json({ battle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/battles/:id — cancel own open battle (refund)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const battle = await Battle.findById(req.params.id);
        if (!battle) return res.status(404).json({ message: 'Battle not found' });
        if (battle.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not your battle' });
        }
        if (battle.status !== 'open') return res.status(400).json({ message: 'Cannot cancel a non-open battle' });

        battle.status = 'cancelled';
        await battle.save();

        await User.findByIdAndUpdate(req.user.id, { $inc: { coins: battle.entryFee } });

        res.json({ message: 'Battle cancelled and entry fee refunded' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
