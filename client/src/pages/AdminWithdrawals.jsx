import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Building2, Smartphone, CheckCircle2, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import ConfirmModal from '@/components/ConfirmModal';

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals]   = useState([]);
    const [loading, setLoading]           = useState(true);
    const [processing, setProcessing]     = useState(null);
    const [rejectNote, setRejectNote]     = useState('');
    const [rejectingId, setRejectingId]   = useState(null);
    const [filter, setFilter]             = useState('pending');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]         = useState(false);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/withdrawals');
            setWithdrawals(res.data.requests || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWithdrawals(); }, []);

    const approve = async (id) => {
        setProcessing(id);
        try {
            const res = await api.patch(`/admin/withdrawals/${id}/approve`);
            setWithdrawals(prev => prev.map(w => w._id === id ? res.data.request : w));
        } catch (err) { console.error(err); }
        finally { setProcessing(null); }
    };

    const reject = async (id) => {
        setProcessing(id);
        try {
            const res = await api.patch(`/admin/withdrawals/${id}/reject`, { adminNote: rejectNote });
            setWithdrawals(prev => prev.map(w => w._id === id ? res.data.request : w));
            setRejectingId(null);
            setRejectNote('');
        } catch (err) { console.error(err); }
        finally { setProcessing(null); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/withdrawals/${deleteTarget._id}`);
            toast.success('Withdrawal request deleted');
            setWithdrawals(prev => prev.filter(w => w._id !== deleteTarget._id));
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete withdrawal request');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = filter ? withdrawals.filter(w => w.status === filter) : withdrawals;

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ArrowUpRight className="w-6 h-6 text-primary" />
                    Withdrawal Requests
                </h1>
                <button onClick={fetchWithdrawals} className="p-2 rounded-xl text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/40 transition-colors">
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
                        {tab.value === 'pending' && withdrawals.filter(w => w.status === 'pending').length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">
                                {withdrawals.filter(w => w.status === 'pending').length}
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
                    No {filter || ''} withdrawal requests.
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filtered.map(wr => (
                        <motion.div
                            key={wr._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-2xl p-5 flex flex-col gap-3"
                        >
                            {/* User + amount + status */}
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                    <p className="font-semibold text-foreground">
                                        {wr.userId?.fullName || 'Unknown'}
                                        {wr.userId?.username && (
                                            <span className="text-muted-foreground font-normal text-xs"> @{wr.userId.username}</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{wr.userId?.email}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(wr.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-extrabold text-xl text-foreground">₹{wr.amount.toLocaleString('en-IN')}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        wr.status === 'pending'  ? 'bg-amber-400/20 text-amber-600' :
                                        wr.status === 'approved' ? 'bg-green-500/20 text-green-600' :
                                        'bg-destructive/20 text-destructive'
                                    }`}>
                                        {wr.status}
                                    </span>
                                </div>
                            </div>

                            {/* Bank / UPI details */}
                            <div className="rounded-xl bg-secondary/30 border border-border px-4 py-3 text-xs flex flex-col gap-1.5">
                                {wr.bankDetails?.upiId ? (
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-muted-foreground">UPI ID:</span>
                                        <span className="font-mono font-semibold text-foreground">{wr.bankDetails.upiId}</span>
                                    </div>
                                ) : (
                                    <>
                                        {wr.bankDetails?.accountHolderName && (
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                <span className="text-muted-foreground">Name:</span>
                                                <span className="font-semibold text-foreground">{wr.bankDetails.accountHolderName}</span>
                                            </div>
                                        )}
                                        {wr.bankDetails?.bankName && (
                                            <div className="flex items-center gap-2 pl-5">
                                                <span className="text-muted-foreground">Bank:</span>
                                                <span className="font-semibold text-foreground">{wr.bankDetails.bankName}</span>
                                            </div>
                                        )}
                                        {wr.bankDetails?.accountNumber && (
                                            <div className="flex items-center gap-2 pl-5">
                                                <span className="text-muted-foreground">Account:</span>
                                                <span className="font-mono font-semibold text-foreground">{wr.bankDetails.accountNumber}</span>
                                            </div>
                                        )}
                                        {wr.bankDetails?.ifscCode && (
                                            <div className="flex items-center gap-2 pl-5">
                                                <span className="text-muted-foreground">IFSC:</span>
                                                <span className="font-mono font-semibold text-foreground">{wr.bankDetails.ifscCode}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Actions */}
                            {wr.status === 'pending' && (
                                rejectingId === wr._id ? (
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
                                                onClick={() => reject(wr._id)}
                                                disabled={processing === wr._id}
                                                className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-60"
                                            >
                                                {processing === wr._id ? 'Rejecting…' : 'Confirm Reject'}
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
                                            onClick={() => approve(wr._id)}
                                            disabled={processing === wr._id}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold disabled:opacity-60 hover:bg-green-600 transition-colors"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            {processing === wr._id ? 'Approving…' : 'Mark as Transferred'}
                                        </button>
                                        <button
                                            onClick={() => setRejectingId(wr._id)}
                                            disabled={processing === wr._id}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-semibold disabled:opacity-60 hover:bg-destructive/20 transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject & Refund
                                        </button>
                                    </div>
                                )
                            )}

                            {wr.status === 'rejected' && wr.adminNote && (
                                <p className="text-xs text-muted-foreground bg-secondary/30 rounded-xl px-3 py-2">Note: {wr.adminNote}</p>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setDeleteTarget(wr)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            <ConfirmModal
                open={!!deleteTarget}
                title="Delete Withdrawal Request?"
                message="This will permanently remove this withdrawal request. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    );
};

export default AdminWithdrawals;
