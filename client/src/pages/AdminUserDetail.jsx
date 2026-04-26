import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Wallet, FileText, ShieldCheck, Phone, Mail, Calendar, IndianRupee, Pencil, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import ConfirmModal from '@/components/ConfirmModal';

const BASE = import.meta.env.VITE_API_URL || '';

const statusColor = {
    completed: 'bg-green-500/20 text-green-500',
    pending: 'bg-amber-500/20 text-amber-500',
    failed: 'bg-rose-500/20 text-rose-500',
};

const kycColor = {
    approved: 'bg-green-500/20 text-green-500',
    pending: 'bg-amber-500/20 text-amber-500',
    rejected: 'bg-rose-500/20 text-rose-500',
    not_submitted: 'bg-muted text-muted-foreground',
};

const typeIcon = { deposit: '↑', withdrawal: '↓', bonus: '★', refund: '↩', battle_win: '🏆' };

const AdminUserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('transactions');
    const [updatingRole, setUpdatingRole] = useState(false);

    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: '', phone: '', coins: '' });
    const [editSaving, setEditSaving] = useState(false);

    // Delete user
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        api.get(`/admin/users/${id}`)
            .then(res => {
                setData(res.data);
                const u = res.data.user;
                setEditForm({ fullName: u.fullName || '', phone: u.phone || '', coins: u.coins ?? 0 });
            })
            .catch(() => toast.error('Failed to load user'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleRoleChange = async (newRole) => {
        setUpdatingRole(true);
        try {
            const res = await api.patch(`/admin/users/${id}`, { role: newRole });
            setData(prev => ({ ...prev, user: { ...prev.user, role: res.data.role } }));
            toast.success(`Role updated to ${newRole}`);
        } catch {
            toast.error('Failed to update role');
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleKYCAction = async (kycId, status) => {
        try {
            const res = await api.patch(`/admin/kyc/${kycId}`, { status });
            setData(prev => ({ ...prev, kyc: { ...prev.kyc, status: res.data.status } }));
            toast.success(`KYC ${status}`);
        } catch {
            toast.error('Failed to update KYC');
        }
    };

    const openEdit = () => {
        const u = data.user;
        setEditForm({ fullName: u.fullName || '', phone: u.phone || '', coins: u.coins ?? 0 });
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        setEditSaving(true);
        try {
            const res = await api.patch(`/admin/users/${id}`, {
                fullName: editForm.fullName,
                phone: editForm.phone,
                coins: Number(editForm.coins),
            });
            setData(prev => ({ ...prev, user: { ...prev.user, ...res.data } }));
            toast.success('User updated');
            setEditOpen(false);
        } catch {
            toast.error('Failed to update user');
        } finally {
            setEditSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/users/${id}`);
            toast.success('User deleted');
            navigate('/admin/users');
        } catch {
            toast.error('Failed to delete user');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) {
        return <div className="p-6 text-center text-muted-foreground">User not found</div>;
    }

    const { user, transactions, kyc } = data;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Back */}
            <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Users
            </button>

            {/* User Profile Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
                        {user.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold">{user.fullName}</h1>
                            {user.role === 'admin' && (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                                    <ShieldCheck className="w-3 h-3" /> Admin
                                </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isVerified ? 'bg-green-500/20 text-green-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                {user.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{user.email}</span>
                            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{user.phone || '—'}</span>
                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-2xl font-black text-primary justify-end">
                            <IndianRupee className="w-5 h-5" />
                            {user.coins?.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Wallet Balance</p>
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={openEdit}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                            >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                                onClick={() => setDeleteOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* Role control */}
                <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Change Role:</span>
                    <button
                        disabled={user.role === 'user' || updatingRole}
                        onClick={() => handleRoleChange('user')}
                        className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-border hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Set as User
                    </button>
                    <button
                        disabled={user.role === 'admin' || updatingRole}
                        onClick={() => handleRoleChange('admin')}
                        className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Set as Admin
                    </button>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-card border border-border rounded-xl p-1 w-fit">
                {[
                    { key: 'transactions', label: `Transactions (${transactions.length})`, icon: Wallet },
                    { key: 'kyc', label: 'KYC Document', icon: FileText },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Transactions Tab */}
            {tab === 'transactions' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground text-sm">No transactions yet</div>
                    ) : (
                        <>
                            <div className="hidden md:grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                <span>#</span><span>Type</span><span>Amount</span><span>Status</span><span>Date</span>
                            </div>
                            {transactions.map((t, i) => (
                                <div key={t._id} className="border-b border-border last:border-0">
                                    <div className="md:hidden flex items-center gap-3 px-5 py-4">
                                        <div className="w-9 h-9 rounded-full bg-secondary/30 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {typeIcon[t.type] || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium capitalize">{t.type}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('en-IN')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">₹{t.amount.toLocaleString()}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status]}`}>{t.status}</span>
                                        </div>
                                    </div>
                                    <div className="hidden md:grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3.5">
                                        <span className="text-xs text-muted-foreground">{i + 1}</span>
                                        <span className="text-sm font-medium capitalize flex items-center gap-2">
                                            <span>{typeIcon[t.type] || '?'}</span>{t.type}
                                        </span>
                                        <span className="text-sm font-bold">₹{t.amount.toLocaleString()}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${statusColor[t.status]}`}>{t.status}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </motion.div>
            )}

            {/* KYC Tab */}
            {tab === 'kyc' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
                    {!kyc ? (
                        <div className="text-center py-16">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No KYC document submitted</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold">KYC Details</h3>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${kycColor[kyc.status]}`}>
                                    {kyc.status}
                                </span>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-secondary/10 rounded-xl p-4">
                                    <p className="text-xs text-muted-foreground mb-1">Document Type</p>
                                    <p className="font-semibold capitalize">{kyc.docType.replace('_', ' ')}</p>
                                </div>
                                <div className="bg-secondary/10 rounded-xl p-4">
                                    <p className="text-xs text-muted-foreground mb-1">Document Number</p>
                                    <p className="font-semibold font-mono">{kyc.docNumber}</p>
                                </div>
                                <div className="bg-secondary/10 rounded-xl p-4">
                                    <p className="text-xs text-muted-foreground mb-1">Submitted On</p>
                                    <p className="font-semibold">{new Date(kyc.createdAt).toLocaleDateString('en-IN')}</p>
                                </div>
                                {kyc.adminNote && (
                                    <div className="bg-secondary/10 rounded-xl p-4">
                                        <p className="text-xs text-muted-foreground mb-1">Admin Note</p>
                                        <p className="font-semibold">{kyc.adminNote}</p>
                                    </div>
                                )}
                            </div>

                            {(kyc.frontImage || kyc.backImage || kyc.selfie) && (
                                <div className="grid md:grid-cols-3 gap-4 mt-2">
                                    {kyc.frontImage && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Front</p>
                                            <img src={`${BASE}${kyc.frontImage}`} alt="Front" className="w-full rounded-xl object-cover border border-border" />
                                        </div>
                                    )}
                                    {kyc.backImage && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Back</p>
                                            <img src={`${BASE}${kyc.backImage}`} alt="Back" className="w-full rounded-xl object-cover border border-border" />
                                        </div>
                                    )}
                                    {kyc.selfie && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Selfie</p>
                                            <img src={`${BASE}${kyc.selfie}`} alt="Selfie" className="w-full rounded-xl object-cover border border-border" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {kyc.status === 'pending' && (
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => handleKYCAction(kyc._id, 'approved')}
                                        className="px-6 py-2.5 rounded-xl bg-green-500/20 text-green-500 hover:bg-green-500/30 font-semibold text-sm transition-colors"
                                    >
                                        Approve KYC
                                    </button>
                                    <button
                                        onClick={() => handleKYCAction(kyc._id, 'rejected')}
                                        className="px-6 py-2.5 rounded-xl bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 font-semibold text-sm transition-colors"
                                    >
                                        Reject KYC
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Edit User Modal */}
            <AnimatePresence>
                {editOpen && (
                    <>
                        <motion.div
                            key="edit-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setEditOpen(false)}
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
                                        <Pencil className="w-4 h-4 text-primary" /> Edit User
                                    </h3>
                                    <button onClick={() => setEditOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Full Name</label>
                                        <input
                                            type="text"
                                            value={editForm.fullName}
                                            onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                                            className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Phone</label>
                                        <input
                                            type="text"
                                            value={editForm.phone}
                                            onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                            className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Wallet Balance (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.coins}
                                            onChange={e => setEditForm(f => ({ ...f, coins: e.target.value }))}
                                            className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-5">
                                    <button
                                        onClick={() => setEditOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/30 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEditSave}
                                        disabled={editSaving}
                                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {editSaving && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ConfirmModal
                open={deleteOpen}
                title="Delete User?"
                message={`This will permanently delete "${user.fullName}" and all their data. This cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteOpen(false)}
                loading={deleting}
            />
        </div>
    );
};

export default AdminUserDetail;
