import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Eye, XCircle, RefreshCw, Trash2, IndianRupee, Send, Clock, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import ConfirmModal from '@/components/ConfirmModal';

const BASE = import.meta.env.VITE_API_URL || '';

const statusColors = {
    open:           'bg-blue-500/15 text-blue-500',
    running:        'bg-red-500/15 text-red-500',
    result_pending: 'bg-amber-500/15 text-amber-500',
    completed:      'bg-green-500/15 text-green-500',
    cancelled:      'bg-secondary/40 text-muted-foreground',
};

const fmt = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Kolkata',
        hour12: true,
    });

const AdminBattles = () => {
    const [battles, setBattles]             = useState([]);
    const [loading, setLoading]             = useState(true);
    const [filter, setFilter]               = useState('result_pending');
    const [declaringWinner, setDeclaringWinner] = useState(null);
    const [voidingBattle, setVoidingBattle] = useState(null);
    const [lightbox, setLightbox]           = useState('');
    const [deleteTarget, setDeleteTarget]   = useState(null);
    const [deleting, setDeleting]           = useState(false);
    const [creditAmounts, setCreditAmounts] = useState({});
    const [crediting, setCrediting]         = useState(null);

    const fetchBattles = async (status) => {
        setLoading(true);
        try {
            const q = status ? `?status=${status}&limit=100` : '?limit=100';
            const res = await api.get(`/admin/battles${q}`);
            setBattles(res.data.battles || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBattles(filter || undefined); }, []);

    const handleFilterChange = (value) => {
        setFilter(value);
        fetchBattles(value || undefined);
    };

    const declareWinner = async (battleId, winnerId) => {
        setDeclaringWinner(battleId);
        try {
            const res = await api.patch(`/admin/battles/${battleId}/winner`, { winnerId });
            setBattles(prev => prev.map(b => b._id === battleId ? res.data.battle : b));
            toast.success('Winner declared — now credit the prize using the Credit panel below.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to declare winner');
        } finally {
            setDeclaringWinner(null);
        }
    };

    const handleCredit = async (battle) => {
        const amt = Number(creditAmounts[battle._id] ?? battle.prize);
        if (!amt || amt <= 0) return toast.error('Enter a valid amount');
        setCrediting(battle._id);
        try {
            const res = await api.post(`/admin/battles/${battle._id}/credit`, { amount: amt });
            toast.success(res.data.message);
            // Reset input to prize amount after credit
            setCreditAmounts(prev => ({ ...prev, [battle._id]: battle.prize }));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to credit winner');
        } finally {
            setCrediting(null);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/battles/${deleteTarget._id}`);
            toast.success('Battle deleted');
            setBattles(prev => prev.filter(b => b._id !== deleteTarget._id));
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete battle');
        } finally {
            setDeleting(false);
        }
    };

    const voidBattle = async (battleId) => {
        setVoidingBattle(battleId);
        try {
            const res = await api.patch(`/admin/battles/${battleId}/void`);
            setBattles(prev => prev.map(b => b._id === battleId ? res.data.battle : b));
            toast.success('Battle voided and entry fees refunded.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to void battle');
        } finally {
            setVoidingBattle(null);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Swords className="w-6 h-6 text-primary" />
                    Battle Management
                </h1>
                <button
                    onClick={() => fetchBattles(filter || undefined)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/40 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    { value: 'result_pending', label: 'Needs Review' },
                    { value: 'running',        label: 'Running' },
                    { value: 'open',           label: 'Open' },
                    { value: 'completed',      label: 'Completed' },
                    { value: '',               label: 'All' },
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => handleFilterChange(tab.value)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            filter === tab.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : battles.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm glass-card rounded-2xl border border-dashed border-border">
                    No battles found.
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {battles.map(b => {
                        const isResolvable = ['running', 'result_pending'].includes(b.status);
                        const sameTime = b.createdAt === b.updatedAt ||
                            Math.abs(new Date(b.updatedAt) - new Date(b.createdAt)) < 2000;
                        return (
                            <motion.div
                                key={b._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-2xl p-5 flex flex-col gap-4"
                            >
                                {/* Header: status + prize */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[b.status]}`}>
                                        {b.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                                        <Trophy className="w-3.5 h-3.5" /> ₹{b.prize} prize
                                    </span>
                                </div>

                                {/* Timestamps */}
                                <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl bg-secondary/20 px-4 py-2.5">
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                        <CalendarDays className="w-3 h-3 flex-shrink-0" />
                                        <span className="font-medium text-foreground/70">Created:</span>
                                        <span>{fmt(b.createdAt)}</span>
                                    </div>
                                    {!sameTime && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span className="font-medium text-foreground/70">Updated:</span>
                                            <span>{fmt(b.updatedAt)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Players row */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Creator</p>
                                        <p className="text-sm font-semibold truncate">{b.creator?.fullName || '—'}</p>
                                    </div>
                                    <div className="flex flex-col items-center px-3">
                                        <span className="text-base font-black text-muted-foreground">VS</span>
                                        <span className="text-xs text-muted-foreground">₹{b.entryFee} each</span>
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Player 2</p>
                                        <p className="text-sm font-semibold truncate">{b.player2?.fullName || 'Waiting…'}</p>
                                    </div>
                                </div>

                                {/* Room code */}
                                {b.roomCode && (
                                    <div className="flex items-center gap-2 rounded-xl bg-secondary/20 px-4 py-2.5">
                                        <span className="text-xs text-muted-foreground">Room Code:</span>
                                        <span className="font-mono font-bold text-primary tracking-widest">{b.roomCode}</span>
                                    </div>
                                )}

                                {/* Result claims */}
                                {(b.creatorResult !== 'pending' || b.player2Result !== 'pending') && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-xl bg-secondary/20 p-3">
                                            <p className="text-[10px] text-muted-foreground mb-1 truncate">
                                                {b.creator?.fullName || 'Creator'} claims
                                            </p>
                                            <p className={`text-sm font-bold capitalize ${
                                                b.creatorResult === 'won' ? 'text-green-500' :
                                                b.creatorResult === 'lost' ? 'text-rose-500' :
                                                b.creatorResult === 'cancelled' ? 'text-amber-500' : 'text-muted-foreground'
                                            }`}>{b.creatorResult}</p>
                                            {b.creatorScreenshot && (
                                                <button
                                                    onClick={() => setLightbox(`${BASE}${b.creatorScreenshot}`)}
                                                    className="mt-2 flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline"
                                                >
                                                    <Eye className="w-3 h-3" /> View screenshot
                                                </button>
                                            )}
                                        </div>
                                        <div className="rounded-xl bg-secondary/20 p-3">
                                            <p className="text-[10px] text-muted-foreground mb-1 truncate">
                                                {b.player2?.fullName || 'Player 2'} claims
                                            </p>
                                            <p className={`text-sm font-bold capitalize ${
                                                b.player2Result === 'won' ? 'text-green-500' :
                                                b.player2Result === 'lost' ? 'text-rose-500' :
                                                b.player2Result === 'cancelled' ? 'text-amber-500' : 'text-muted-foreground'
                                            }`}>{b.player2Result}</p>
                                            {b.player2Screenshot && (
                                                <button
                                                    onClick={() => setLightbox(`${BASE}${b.player2Screenshot}`)}
                                                    className="mt-2 flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline"
                                                >
                                                    <Eye className="w-3 h-3" /> View screenshot
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Winner badge */}
                                {b.status === 'completed' && b.winner && (
                                    <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2.5">
                                        <Trophy className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm font-bold text-green-500">
                                            Winner: {b.winner?.fullName || '—'}
                                        </span>
                                        {b.adminNote && (
                                            <span className="text-xs text-muted-foreground ml-1">— {b.adminNote}</span>
                                        )}
                                    </div>
                                )}

                                {/* ── Credit Prize to Winner ─────────────────────────────── */}
                                {b.status === 'completed' && b.winner && (
                                    b.prizeCredited ? (
                                        <div className="rounded-2xl border border-green-500/40 bg-green-500/10 px-4 py-3 flex items-center gap-2">
                                            <Send className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-green-500">Prize Already Credited</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    ₹{b.prize} was sent to {b.winner?.fullName}'s wallet.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-green-500/25 bg-green-500/5 p-4 flex flex-col gap-3">
                                            <div>
                                                <p className="text-xs font-bold text-green-500 uppercase tracking-wide flex items-center gap-1.5 mb-0.5">
                                                    <IndianRupee className="w-3.5 h-3.5" />
                                                    Credit Prize to {b.winner?.fullName || 'Winner'}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Edit the amount if needed, then click <strong>Credit</strong> — money will be added to the winner's wallet instantly.
                                                </p>
                                            </div>

                                            <div className="flex gap-2 items-center">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm select-none">₹</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={creditAmounts[b._id] ?? b.prize}
                                                        onChange={e => setCreditAmounts(prev => ({ ...prev, [b._id]: e.target.value }))}
                                                        className="w-full rounded-xl bg-card border border-border pl-7 pr-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleCredit(b)}
                                                    disabled={crediting === b._id}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-white text-sm font-bold transition-colors disabled:opacity-60 flex-shrink-0"
                                                >
                                                    {crediting === b._id
                                                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                        : <Send className="w-4 h-4" />
                                                    }
                                                    {crediting === b._id ? 'Crediting…' : 'Credit Now'}
                                                </button>
                                            </div>

                                            <p className="text-[10px] text-muted-foreground">
                                                Prize pool: <strong>₹{b.prize}</strong> &nbsp;·&nbsp; Entry fee each: <strong>₹{b.entryFee}</strong>
                                            </p>
                                        </div>
                                    )
                                )}

                                {/* Admin action buttons */}
                                {isResolvable && b.player2 && (
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => declareWinner(b._id, b.creator._id)}
                                            disabled={declaringWinner === b._id}
                                            className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors disabled:opacity-60"
                                        >
                                            {declaringWinner === b._id ? '…' : `✓ ${b.creator.fullName} Won`}
                                        </button>
                                        <button
                                            onClick={() => declareWinner(b._id, b.player2._id)}
                                            disabled={declaringWinner === b._id}
                                            className="flex-1 py-2.5 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-bold hover:bg-green-500/20 transition-colors disabled:opacity-60"
                                        >
                                            {declaringWinner === b._id ? '…' : `✓ ${b.player2.fullName} Won`}
                                        </button>
                                        <button
                                            onClick={() => voidBattle(b._id)}
                                            disabled={voidingBattle === b._id}
                                            className="px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-bold hover:bg-destructive/20 transition-colors disabled:opacity-60"
                                        >
                                            {voidingBattle === b._id ? '…' : 'Void & Refund'}
                                        </button>
                                    </div>
                                )}

                                {/* Delete */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setDeleteTarget(b)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete Battle
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <ConfirmModal
                open={!!deleteTarget}
                title="Delete Battle?"
                message="This will permanently remove this battle record. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setLightbox('')}
                    >
                        <motion.div
                            initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
                            className="relative max-w-lg w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={lightbox} alt="Battle result" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80dvh]" />
                            <button onClick={() => setLightbox('')} className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminBattles;
