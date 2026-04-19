import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, ImagePlus, CheckCircle2, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import ConfirmModal from '@/components/ConfirmModal';

const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const AdminDeposits = () => {
    const [deposits, setDeposits]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [processing, setProcessing]       = useState(null);
    const [rejectNote, setRejectNote]       = useState('');
    const [rejectingId, setRejectingId]     = useState(null);
    const [lightbox, setLightbox]           = useState('');
    const [filter, setFilter]               = useState('pending');
    const [deleteTarget, setDeleteTarget]   = useState(null);
    const [deleting, setDeleting]           = useState(false);

    const fetchDeposits = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/deposits');
            setDeposits(res.data.requests || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDeposits(); }, []);

    const approve = async (id) => {
        setProcessing(id);
        try {
            const res = await api.patch(`/admin/deposits/${id}/approve`);
            setDeposits(prev => prev.map(d => d._id === id ? res.data.request : d));
        } catch (err) { console.error(err); }
        finally { setProcessing(null); }
    };

    const reject = async (id) => {
        setProcessing(id);
        try {
            const res = await api.patch(`/admin/deposits/${id}/reject`, { adminNote: rejectNote });
            setDeposits(prev => prev.map(d => d._id === id ? res.data.request : d));
            setRejectingId(null);
            setRejectNote('');
        } catch (err) { console.error(err); }
        finally { setProcessing(null); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/deposits/${deleteTarget._id}`);
            toast.success('Deposit request deleted');
            setDeposits(prev => prev.filter(d => d._id !== deleteTarget._id));
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete deposit request');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = filter ? deposits.filter(d => d.status === filter) : deposits;

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <IndianRupee className="w-6 h-6 text-green-500" />
                    Deposit Requests
                </h1>
                <button onClick={fetchDeposits} className="p-2 rounded-xl text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/40 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    { value: 'pending',  label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: '',         label: 'All' },
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            filter === tab.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                        {tab.value === 'pending' && deposits.filter(d => d.status === 'pending').length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">
                                {deposits.filter(d => d.status === 'pending').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm glass-card rounded-2xl border border-dashed border-border">
                    No {filter || ''} deposit requests.
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filtered.map(dep => {
                        const ssUrl = dep.screenshotUrl ? `${BASE}${dep.screenshotUrl}` : '';
                        return (
                            <motion.div
                                key={dep._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-2xl p-5 flex flex-col gap-3"
                            >
                                {/* User + amount + status */}
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            {dep.userId?.fullName || 'Unknown'}
                                            {dep.userId?.username && (
                                                <span className="text-muted-foreground font-normal text-xs"> @{dep.userId.username}</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{dep.userId?.email}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(dep.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-extrabold text-xl text-foreground">₹{dep.amount.toLocaleString('en-IN')}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            dep.status === 'pending'  ? 'bg-amber-400/20 text-amber-600' :
                                            dep.status === 'approved' ? 'bg-green-500/20 text-green-600' :
                                            'bg-destructive/20 text-destructive'
                                        }`}>
                                            {dep.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Screenshot */}
                                {ssUrl ? (
                                    <button
                                        onClick={() => setLightbox(ssUrl)}
                                        className="relative w-full overflow-hidden rounded-xl border border-border bg-secondary/20 group"
                                    >
                                        <img src={ssUrl} alt="Payment screenshot" className="w-full max-h-44 object-contain group-hover:opacity-80 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                                            <span className="px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold">View Full</span>
                                        </div>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                                        <ImagePlus className="w-4 h-4 flex-shrink-0" />
                                        No screenshot uploaded
                                    </div>
                                )}

                                {/* Actions */}
                                {dep.status === 'pending' && (
                                    rejectingId === dep._id ? (
                                        <div className="flex flex-col gap-2">
                                            <textarea
                                                value={rejectNote}
                                                onChange={e => setRejectNote(e.target.value)}
                                                placeholder="Reason for rejection (optional)"
                                                rows={2}
                                                className="w-full rounded-xl bg-secondary/30 border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/40"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => reject(dep._id)}
                                                    disabled={processing === dep._id}
                                                    className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-60"
                                                >
                                                    {processing === dep._id ? 'Rejecting…' : 'Confirm Reject'}
                                                </button>
                                                <button
                                                    onClick={() => { setRejectingId(null); setRejectNote(''); }}
                                                    className="px-4 py-2 rounded-xl border border-border text-sm font-semibold"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => approve(dep._id)}
                                                disabled={processing === dep._id}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold disabled:opacity-60 hover:bg-green-600 transition-colors"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                {processing === dep._id ? 'Approving…' : 'Approve & Credit'}
                                            </button>
                                            <button
                                                onClick={() => setRejectingId(dep._id)}
                                                disabled={processing === dep._id}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-semibold disabled:opacity-60 hover:bg-destructive/20 transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    )
                                )}

                                {dep.status === 'rejected' && dep.adminNote && (
                                    <p className="text-xs text-muted-foreground bg-secondary/30 rounded-xl px-3 py-2">Note: {dep.adminNote}</p>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setDeleteTarget(dep)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <ConfirmModal
                open={!!deleteTarget}
                title="Delete Deposit Request?"
                message="This will permanently remove this deposit request. This cannot be undone."
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
                            <img src={lightbox} alt="Screenshot" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80dvh]" />
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

export default AdminDeposits;
