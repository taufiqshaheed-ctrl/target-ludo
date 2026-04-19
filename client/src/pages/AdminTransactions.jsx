import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';
import ConfirmModal from '@/components/ConfirmModal';

const statusBadge = {
    completed: 'bg-green-500/20 text-green-500',
    pending: 'bg-amber-500/20 text-amber-500',
    failed: 'bg-rose-500/20 text-rose-500',
};

const typeBadge = {
    deposit: 'bg-green-500/10 text-green-400',
    withdrawal: 'bg-rose-500/10 text-rose-400',
    bonus: 'bg-primary/10 text-primary',
    refund: 'bg-amber-500/10 text-amber-400',
    battle_win: 'bg-purple-500/10 text-purple-400',
};

const AdminTransactions = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Edit modal
    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm] = useState({ status: '', note: '' });
    const [editSaving, setEditSaving] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchTransactions = async (p = page, type = filterType, status = filterStatus) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/transactions', {
                params: { page: p, limit: 20, type: type || undefined, status: status || undefined },
            });
            setTransactions(res.data.transactions);
            setPages(res.data.pages);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, [page]);

    const applyFilters = () => {
        setPage(1);
        fetchTransactions(1, filterType, filterStatus);
    };

    const openEdit = (t) => {
        setEditTarget(t);
        setEditForm({ status: t.status, note: t.note || '' });
    };

    const handleEditSave = async () => {
        setEditSaving(true);
        try {
            const res = await api.patch(`/admin/transactions/${editTarget._id}`, {
                status: editForm.status,
                note: editForm.note,
            });
            setTransactions(prev => prev.map(t => t._id === editTarget._id ? { ...t, ...res.data } : t));
            toast.success('Transaction updated');
            setEditTarget(null);
        } catch {
            toast.error('Failed to update transaction');
        } finally {
            setEditSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/transactions/${deleteTarget._id}`);
            toast.success('Transaction deleted');
            setTransactions(prev => prev.filter(t => t._id !== deleteTarget._id));
            setTotal(n => n - 1);
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete transaction');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-primary" />
                    All Transactions
                </h1>
                <p className="text-muted-foreground text-sm mt-1">{total} total transactions</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                >
                    <option value="">All Types</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="bonus">Bonus</option>
                    <option value="refund">Refund</option>
                    <option value="battle_win">Battle Win</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
                <button
                    onClick={applyFilters}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
                >
                    Apply
                </button>
                {(filterType || filterStatus) && (
                    <button
                        onClick={() => { setFilterType(''); setFilterStatus(''); setPage(1); fetchTransactions(1, '', ''); }}
                        className="px-5 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/30 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="glass-card overflow-hidden">
                <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    <span>User</span><span>Type</span><span>Amount</span><span>Status</span><span>Reference</span><span>Date</span><span>Actions</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">No transactions found</div>
                ) : (
                    transactions.map((t, i) => (
                        <motion.div
                            key={t._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            className="border-b border-border last:border-0"
                        >
                            {/* Mobile */}
                            <div className="md:hidden flex items-center gap-3 px-5 py-4">
                                <button
                                    onClick={() => navigate(`/admin/users/${t.userId?._id}`)}
                                    className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0"
                                >
                                    {t.userId?.fullName?.charAt(0).toUpperCase() || '?'}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{t.userId?.fullName || '—'}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadge[t.type] || ''}`}>{t.type}</span>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    <div>
                                        <p className="font-bold text-sm">₹{t.amount.toLocaleString()}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[t.status]}`}>{t.status}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* Desktop */}
                            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 items-center px-5 py-3.5">
                                <button onClick={() => navigate(`/admin/users/${t.userId?._id}`)} className="text-left min-w-0">
                                    <p className="text-sm font-medium truncate hover:text-primary transition-colors">{t.userId?.fullName || '—'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{t.userId?.email}</p>
                                </button>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${typeBadge[t.type] || ''}`}>{t.type}</span>
                                <span className="text-sm font-bold">₹{t.amount.toLocaleString()}</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${statusBadge[t.status]}`}>{t.status}</span>
                                <span className="text-xs text-muted-foreground font-mono">{t.reference || '—'}</span>
                                <span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEdit(t)}
                                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(t)}
                                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-border hover:bg-secondary/30 disabled:opacity-40 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded-xl border border-border hover:bg-secondary/30 disabled:opacity-40 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Edit Transaction Modal */}
            <AnimatePresence>
                {editTarget && (
                    <>
                        <motion.div
                            key="edit-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setEditTarget(null)}
                        />
                        <motion.div
                            key="edit-modal"
                            initial={{ opacity: 0, scale: 0.93, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 30 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-bold text-base flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-primary" /> Edit Transaction
                                    </h3>
                                    <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Status</label>
                                        <select
                                            value={editForm.status}
                                            onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                                            className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Admin Note</label>
                                        <input
                                            type="text"
                                            value={editForm.note}
                                            onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                                            placeholder="Optional note…"
                                            className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-5">
                                    <button onClick={() => setEditTarget(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/30 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEditSave}
                                        disabled={editSaving}
                                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {editSaving && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                                        Save
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ConfirmModal
                open={!!deleteTarget}
                title="Delete Transaction?"
                message="This will permanently remove this transaction record. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    );
};

export default AdminTransactions;
