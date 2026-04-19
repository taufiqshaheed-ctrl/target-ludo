import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActiveSession from '../models/ActiveSession.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/emailService.js';
import generateUniqueUsername from '../utils/generateUsername.js';

const router = express.Router();

const signToken = (user) =>
    new Promise((resolve, reject) => {
        jwt.sign(
            { id: user._id, fullName: user.fullName, email: user.email },
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '7d' },
            (err, token) => (err ? reject(err) : resolve(token))
        );
    });

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { fullName, email, password, phone } = req.body;
    try {
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        const username = await generateUniqueUsername(fullName);
        const user = new User({ fullName, email, password, phone: phone || '', otp, otpExpires, isVerified: false, role: 'user', username });
        await user.save();

        try {
            await sendVerificationEmail(email, otp);
            res.json({ message: 'Registration successful. Check your email for the verification code.' });
        } catch (emailErr) {
            console.error('Email error:', emailErr);
            await User.deleteOne({ _id: user._id });
            res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email }).select('+otp +otpExpires');
        if (!user) return res.status(400).json({ message: 'Invalid email' });
        if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otpExpires < Date.now()) return res.status(400).json({ message: 'OTP expired' });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Send welcome email (fire-and-forget)
        sendWelcomeEmail(user.email, user.fullName).catch(() => {});

        const token = await signToken(user);
        const payload = { id: user._id, fullName: user.fullName, email: user.email };
        res.json({ token, user: payload, message: 'Email verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        ActiveSession.findOneAndUpdate(
            { userId: user._id },
            { userId: user._id, email: user.email, fullName: user.fullName, loginAt: new Date() },
            { upsert: true, new: true }
        ).catch(() => {});

        const token = await signToken(user);
        const payload = { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, coins: user.coins, avatar: user.avatar, username: user.username, createdAt: user.createdAt };
        res.json({ token, user: payload });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account with that email' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendPasswordResetEmail(email, otp);
        res.json({ message: 'Password reset code sent to your email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ email }).select('+otp +otpExpires');
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otpExpires < Date.now()) return res.status(400).json({ message: 'OTP expired' });

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.isVerified = true;
        await user.save();

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
            ActiveSession.findOneAndDelete({ userId: decoded.id }).catch(() => {});
        }
    } catch { /* expired or invalid token — fine */ }
    res.json({ message: 'Logged out' });
});

export default router;
