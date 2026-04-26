import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, Wallet, TrendingUp, ShieldCheck, IndianRupee, Clock, ArrowRight, Megaphone, ImagePlus, Trash2, QrCode, Upload, ArrowUpRight, Swords, Percent } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [announcement, setAnnouncement] = useState('');
    const [announcementInput, setAnnouncementInput] = useState('');
    const [announcementSaving, setAnnouncementSaving] = useState(false);
    const [battleAnnouncement, setBattleAnnouncement] = useState('');
    const [battleAnnouncementInput, setBattleAnnouncementInput] = useState('');
    const [battleAnnouncementSaving, setBattleAnnouncementSaving] = useState(false);
    const [walletAnnouncement, setWalletAnnouncement] = useState('');
    const [walletAnnouncementInput, setWalletAnnouncementInput] = useState('');
    const [walletAnnouncementSaving, setWalletAnnouncementSaving] = useState(false);
    const [carouselImages, setCarouselImages] = useState([]);
    const [carouselUploading, setCarouselUploading] = useState(false);
    const fileInputRef = useRef(null);
    const qrInputRef = useRef(null);

    // Payment QR & deposit requests
    const [qrImageUrl, setQrImageUrl] = useState('');
    const [upiId, setUpiId] = useState('');
    const [upiInput, setUpiInput] = useState('');
    const [upiSaving, setUpiSaving] = useState(false);
    const [qrUploading, setQrUploading] = useState(false);
    const [deposits, setDeposits] = useState([]);

    // Commission / prize deduction
    const [commissionPercent, setCommissionPercent] = useState(5);
    const [commissionInput, setCommissionInput] = useState('5');
    const [commissionSaving, setCommissionSaving] = useState(false);

    // Withdrawal requests
    const [withdrawals, setWithdrawals] = useState([]);

    // Battles
    const [battles, setBattles] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, usersRes, txnRes, announcementRes, carouselRes, paymentRes, depositsRes, withdrawalsRes, battlesRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/users?limit=5'),
                    api.get('/admin/transactions?limit=5'),
                    api.get('/admin/announcement'),
                    api.get('/admin/carousel'),
                    api.get('/admin/payment-settings'),
                    api.get('/admin/deposits'),
                    api.get('/admin/withdrawals'),
                    api.get('/admin/battles?limit=50'),
                ]);
                setStats(statsRes.data);
                setRecentUsers(usersRes.data.users);
                setRecentTransactions(txnRes.data.transactions);
                setAnnouncement(announcementRes.data.message || '');
                setAnnouncementInput(announcementRes.data.message || '');
                setBattleAnnouncement(announcementRes.data.battleMessage || '');
                setBattleAnnouncementInput(announcementRes.data.battleMessage || '');
                setWalletAnnouncement(announcementRes.data.walletMessage || '');
                setWalletAnnouncementInput(announcementRes.data.walletMessage || '');
                setCarouselImages(carouselRes.data.images || []);
                setQrImageUrl(paymentRes.data.qrImageUrl || '');
                setUpiId(paymentRes.data.upiId || '');
                setUpiInput(paymentRes.data.upiId || '');
                const pct = paymentRes.data.commissionPercent ?? 5;
                setCommissionPercent(pct);
                setCommissionInput(String(pct));
                setDeposits(depositsRes.data.requests || []);
                setWithdrawals(withdrawalsRes.data.requests || []);
                setBattles(battlesRes.data.battles || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const saveAnnouncement = async () => {
        setAnnouncementSaving(true);
        try {
            const res = await api.post('/admin/announcement', { message: announcementInput });
            setAnnouncement(res.data.message);
        } catch (err) {
            console.error(err);
        } finally {
            setAnnouncementSaving(false);
        }
    };

    const saveBattleAnnouncement = async () => {
        setBattleAnnouncementSaving(true);
        try {
            const res = await api.post('/admin/announcement/battle', { battleMessage: battleAnnouncementInput });
            setBattleAnnouncement(res.data.battleMessage);
        } catch (err) {
            console.error(err);
        } finally {
            setBattleAnnouncementSaving(false);
        }
    };

    const saveWalletAnnouncement = async () => {
        setWalletAnnouncementSaving(true);
        try {
            const res = await api.post('/admin/announcement/wallet', { walletMessage: walletAnnouncementInput });
            setWalletAnnouncement(res.data.walletMessage);
        } catch (err) {
            console.error(err);
        } finally {
            setWalletAnnouncementSaving(false);
        }
    };

    const uploadQRImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setQrUploading(true);
        try {
            const form = new FormData();
            form.append('qr', file);
            const res = await api.post('/admin/payment-qr', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            setQrImageUrl(res.data.qrImageUrl);
        } catch (err) {
            console.error(err);
        } finally {
            setQrUploading(false);
            if (qrInputRef.current) qrInputRef.current.value = '';
        }
    };

    const saveUpiId = async () => {
        setUpiSaving(true);
        try {
            const res = await api.put('/admin/payment-upi', { upiId: upiInput });
            setUpiId(res.data.upiId);
        } catch (err) {
            console.error(err);
        } finally {
            setUpiSaving(false);
        }
    };

    const saveCommission = async () => {
        const pct = Number(commissionInput);
        if (isNaN(pct) || pct < 0 || pct > 100) return;
        setCommissionSaving(true);
        try {
            const res = await api.put('/admin/commission', { commissionPercent: pct });
            setCommissionPercent(res.data.commissionPercent);
            setCommissionInput(String(res.data.commissionPercent));
        } catch (err) {
            console.error(err);
        } finally {
            setCommissionSaving(false);
        }
    };





    const uploadCarouselImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCarouselUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await api.post('/admin/carousel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setCarouselImages(prev => [...prev, res.data]);
        } catch (err) {
            console.error(err);
        } finally {
            setCarouselUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const deleteCarouselImage = async (id) => {
        try {
            await api.delete(`/admin/carousel/${id}`);
            setCarouselImages(prev => prev.filter(img => img._id !== id));
        } catch (err) {
            console.error(err);
        }
    };




    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'bg-primary/20', iconColor: 'text-primary' },
        { label: 'Total Deposits', value: stats ? `₹${stats.totalDeposits.toLocaleString()}` : '—', icon: IndianRupee, color: 'bg-green-500/20', iconColor: 'text-green-500' },
        { label: 'Total Withdrawals', value: stats ? `₹${stats.totalWithdrawals.toLocaleString()}` : '—', icon: TrendingUp, color: 'bg-amber-500/20', iconColor: 'text-amber-500' },
        { label: 'Pending KYC', value: stats?.pendingKYC ?? '—', icon: Clock, color: 'bg-rose-500/20', iconColor: 'text-rose-500' },
    ];

    const statusColor = {
        completed: 'text-green-500',
        pending: 'text-amber-500',
        failed: 'text-rose-500',
    };

    const kycColor = {
        approved: 'text-green-500',
        pending: 'text-amber-500',
        rejected: 'text-rose-500',
        not_submitted: 'text-muted-foreground',
    };

    return (
        <>
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                </div>
                <p className="text-muted-foreground text-sm">Welcome back, {user?.fullName || 'Admin'}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="glass-card p-5 flex flex-col gap-3"
                    >
                        <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                        </div>
                        <div>
                            <p className="text-xl font-bold">{loading ? '...' : card.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Announcement Editor */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="glass-card p-6 mb-8"
            >
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Megaphone className="w-4 h-4 text-amber-500" />
                    User Announcement
                </h2>
                {announcement && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#FEF08A', color: '#713F12' }}>
                        <Megaphone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#A16207' }} />
                        <span className="font-medium">{announcement}</span>
                    </div>
                )}
                <textarea
                    value={announcementInput}
                    onChange={e => setAnnouncementInput(e.target.value)}
                    rows={3}
                    placeholder="Type a message to show all users on their dashboard…"
                    className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={() => { setAnnouncementInput(''); }}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                        Clear message
                    </button>
                    <button
                        onClick={saveAnnouncement}
                        disabled={announcementSaving}
                        className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-900 font-semibold text-sm transition-colors disabled:opacity-60"
                    >
                        {announcementSaving ? 'Saving…' : 'Publish'}
                    </button>
                </div>
            </motion.div>

            {/* Battle Announcement Editor */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="glass-card p-6 mb-8"
            >
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Megaphone className="w-4 h-4 text-primary" />
                    Battle Page Announcement
                </h2>
                {battleAnnouncement && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#FEF08A', color: '#713F12' }}>
                        <Megaphone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#A16207' }} />
                        <span className="font-medium">{battleAnnouncement}</span>
                    </div>
                )}
                <textarea
                    value={battleAnnouncementInput}
                    onChange={e => setBattleAnnouncementInput(e.target.value)}
                    rows={3}
                    placeholder="Type a message to show users on the Battle page…"
                    className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={() => setBattleAnnouncementInput('')}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                        Clear message
                    </button>
                    <button
                        onClick={saveBattleAnnouncement}
                        disabled={battleAnnouncementSaving}
                        className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-900 font-semibold text-sm transition-colors disabled:opacity-60"
                    >
                        {battleAnnouncementSaving ? 'Saving…' : 'Publish'}
                    </button>
                </div>
            </motion.div>

            {/* Wallet / Add Money Announcement */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6 mb-8"
            >
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Megaphone className="w-4 h-4 text-rose-500" />
                    Add Money Page Announcement
                </h2>
                {walletAnnouncement && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm bg-rose-50 border border-rose-200 text-rose-800">
                        <Megaphone className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
                        <span className="font-medium">{walletAnnouncement}</span>
                    </div>
                )}
                <textarea
                    value={walletAnnouncementInput}
                    onChange={e => setWalletAnnouncementInput(e.target.value)}
                    rows={3}
                    placeholder="Type instructions to show users on the Add Money page (e.g. payment instructions, UPI ID, etc.)…"
                    className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={() => setWalletAnnouncementInput('')}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                        Clear message
                    </button>
                    <button
                        onClick={saveWalletAnnouncement}
                        disabled={walletAnnouncementSaving}
                        className="px-5 py-2 rounded-xl bg-rose-400 hover:bg-rose-300 text-white font-semibold text-sm transition-colors disabled:opacity-60"
                    >
                        {walletAnnouncementSaving ? 'Saving…' : 'Publish'}
                    </button>
                </div>
            </motion.div>

            {/* Carousel Image Manager */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="glass-card p-6 mb-8"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <ImagePlus className="w-4 h-4 text-primary" />
                        Home Carousel Images
                    </h2>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={carouselUploading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                    >
                        <ImagePlus className="w-4 h-4" />
                        {carouselUploading ? 'Uploading…' : 'Upload Image'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={uploadCarouselImage}
                    />
                </div>

                {carouselImages.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                        No images yet. Upload your first carousel image.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {carouselImages.map(img => (
                            <div key={img._id} className="relative group rounded-xl overflow-hidden aspect-video bg-secondary/20">
                                <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${img.url}`} alt="carousel" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => deleteCarouselImage(img._id)}
                                    className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Payment QR & UPI Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34 }}
                className="glass-card p-6 mb-8"
            >
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <QrCode className="w-4 h-4 text-primary" />
                    Payment QR & UPI Settings
                </h2>
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* QR preview + upload */}
                    <div className="flex flex-col items-center gap-3">
                        {qrImageUrl ? (
                            <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${qrImageUrl}`}
                                alt="Payment QR"
                                className="w-40 h-40 object-contain rounded-2xl border border-border bg-white p-2"
                            />
                        ) : (
                            <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <QrCode className="w-10 h-10" />
                                <span className="text-xs">No QR yet</span>
                            </div>
                        )}
                        <button
                            onClick={() => qrInputRef.current?.click()}
                            disabled={qrUploading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                        >
                            <Upload className="w-4 h-4" />
                            {qrUploading ? 'Uploading…' : qrImageUrl ? 'Replace QR' : 'Upload QR'}
                        </button>
                        <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={uploadQRImage} />
                    </div>
                    {/* UPI ID */}
                    <div className="flex-1 flex flex-col gap-3">
                        <label className="text-sm font-semibold text-foreground">UPI ID</label>
                        <input
                            type="text"
                            value={upiInput}
                            onChange={e => setUpiInput(e.target.value)}
                            placeholder="yourname@upi"
                            className="rounded-xl bg-secondary/30 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {upiId && <p className="text-xs text-muted-foreground">Current: <span className="font-mono font-semibold text-foreground">{upiId}</span></p>}
                        <button
                            onClick={saveUpiId}
                            disabled={upiSaving}
                            className="self-start px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity"
                        >
                            {upiSaving ? 'Saving…' : 'Save UPI ID'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Prize Commission Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                className="glass-card p-6 mb-8"
            >
                <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                    <Percent className="w-4 h-4 text-amber-500" />
                    Prize Commission (Platform Fee)
                </h2>
                <p className="text-xs text-muted-foreground mb-5">
                    Percentage deducted from the total prize pool before crediting the winner.
                    E.g. at {commissionPercent}% — entry ₹100 each → pool ₹200 → winner gets ₹{Math.floor(200 * (1 - commissionPercent / 100))}.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-1 max-w-xs">
                        <label className="text-xs text-muted-foreground font-medium block mb-2">Commission %</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={commissionInput}
                                onChange={e => setCommissionInput(e.target.value)}
                                className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-2.5 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">%</span>
                        </div>
                    </div>

                    {/* Live preview */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/20 border border-border text-xs flex-1">
                        <div className="text-center flex-1">
                            <p className="text-muted-foreground mb-0.5">Entry fee each</p>
                            <p className="font-bold text-base">₹100</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="text-center flex-1">
                            <p className="text-muted-foreground mb-0.5">Prize pool</p>
                            <p className="font-bold text-base">₹200</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="text-center flex-1">
                            <p className="text-muted-foreground mb-0.5">Winner gets</p>
                            <p className="font-bold text-base text-green-500">
                                ₹{Math.floor(200 * (1 - Math.max(0, Math.min(100, Number(commissionInput) || 0)) / 100))}
                            </p>
                        </div>
                        <div className="text-center flex-1">
                            <p className="text-muted-foreground mb-0.5">Platform earns</p>
                            <p className="font-bold text-base text-amber-500">
                                ₹{200 - Math.floor(200 * (1 - Math.max(0, Math.min(100, Number(commissionInput) || 0)) / 100))}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">
                        Current saved rate: <span className="font-bold text-foreground">{commissionPercent}%</span>
                    </p>
                    <button
                        onClick={saveCommission}
                        disabled={commissionSaving || Number(commissionInput) === commissionPercent}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-400 disabled:opacity-60 transition-colors"
                    >
                        {commissionSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {commissionSaving ? 'Saving…' : 'Save Commission'}
                    </button>
                </div>
            </motion.div>

            {/* Quick Access — Dedicated Admin Pages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    {
                        label: 'Deposit Requests',
                        icon: IndianRupee,
                        color: 'text-green-500',
                        bg: 'bg-green-500/10',
                        count: deposits.filter(d => d.status === 'pending').length,
                        path: '/admin/deposits',
                    },
                    {
                        label: 'Withdrawal Requests',
                        icon: ArrowUpRight,
                        color: 'text-primary',
                        bg: 'bg-primary/10',
                        count: withdrawals.filter(w => w.status === 'pending').length,
                        path: '/admin/withdrawals',
                    },
                    {
                        label: 'Battle Management',
                        icon: Swords,
                        color: 'text-amber-500',
                        bg: 'bg-amber-500/10',
                        count: battles.filter(b => b.status === 'result_pending').length,
                        path: '/admin/battles',
                    },
                ].map(card => (
                    <motion.button
                        key={card.path}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(card.path)}
                        className="glass-card p-5 flex items-center gap-4 hover:ring-2 hover:ring-primary/30 transition-all text-left"
                    >
                        <div className={`w-11 h-11 rounded-2xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{card.label}</p>
                            {card.count > 0 && (
                                <p className="text-xs font-bold text-amber-500 mt-0.5">{card.count} pending</p>
                            )}
                            {card.count === 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">All clear</p>
                            )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
                    </motion.button>
                ))}
            </div>


            <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Users */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Recent Users
                        </h2>
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            View all <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : recentUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">No users yet</div>
                    ) : (
                        <div className="space-y-3">
                            {recentUsers.map(u => (
                                <button
                                    key={u._id}
                                    onClick={() => navigate(`/admin/users/${u._id}`)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors text-left"
                                >
                                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                        {u.fullName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{u.fullName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                    </div>
                                    <span className={`text-xs font-medium ${kycColor[u.kycStatus]}`}>
                                        {u.kycStatus.replace('_', ' ')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Recent Transactions */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" />
                            Recent Transactions
                        </h2>
                        <button
                            onClick={() => navigate('/admin/transactions')}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            View all <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : recentTransactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">No transactions yet</div>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map(t => (
                                <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{t.userId?.fullName || '—'}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{t.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">₹{t.amount.toLocaleString()}</p>
                                        <p className={`text-xs font-medium capitalize ${statusColor[t.status]}`}>{t.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>

        </>
    );
};

export default AdminDashboard;
