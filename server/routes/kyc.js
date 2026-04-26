import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import authMiddleware from '../middleware/authMiddleware.js';
import KYC from '../models/KYC.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads'),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `kyc_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

// GET /api/kyc/status — own KYC status
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const kyc = await KYC.findOne({ userId: req.user.id }).lean();
        if (!kyc) return res.json({ status: 'not_submitted' });
        res.json({
            status: kyc.status,
            docType: kyc.docType,
            docNumber: kyc.docNumber,
            adminNote: kyc.adminNote || '',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const kycUploadMiddleware = (req, res, next) => {
    upload.fields([
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
    ])(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || 'File upload error' });
        }
        next();
    });
};

// POST /api/kyc/submit — submit or resubmit KYC
router.post(
    '/submit',
    authMiddleware,
    kycUploadMiddleware,
    async (req, res) => {
        try {
            const { docType, docNumber } = req.body;
            if (!docType || !docNumber) {
                return res.status(400).json({ message: 'docType and docNumber are required' });
            }

            const fileUrl = (field) =>
                req.files?.[field]?.[0]
                    ? `/uploads/${req.files[field][0].filename}`
                    : '';

            const existing = await KYC.findOne({ userId: req.user.id });

            if (existing && existing.status === 'approved') {
                return res.status(400).json({ message: 'KYC already approved' });
            }

            const data = {
                docType,
                docNumber: docNumber.trim(),
                frontImage: fileUrl('frontImage') || existing?.frontImage || '',
                backImage: fileUrl('backImage') || existing?.backImage || '',
                selfie: fileUrl('selfie') || existing?.selfie || '',
                status: 'pending',
                adminNote: '',
            };

            let kyc;
            if (existing) {
                Object.assign(existing, data);
                kyc = await existing.save();
            } else {
                kyc = await KYC.create({ userId: req.user.id, ...data });
            }

            res.json({ status: kyc.status });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

export default router;
