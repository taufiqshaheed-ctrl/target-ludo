import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, ChevronLeft, ChevronRight, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';
import ConfirmModal from '@/components/ConfirmModal';

const kycBadge = {
    approved: 'bg-green-500/20 text-green-500',
    pending: 'bg-amber-500/20 text-amber-500',
    rejected: 'bg-rose-500/20 text-rose-500',
    not_submitted: 'bg-muted text-muted-foreground',
};

const AdminUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchUsers = async (q = search, p = page) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users', { params: { search: q, page: p, limit: 15 } });
            setUsers(res.data.users);
            setPages(res.data.pages);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchUsers(search, 1);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/users/${deleteTarget._id}`);
            toast.success(`${deleteTarget.fullName} deleted`);
            setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
            setTotal(t => t - 1);
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete user');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    All Users
                </h1>
                <p className="text-muted-foreground text-sm mt-1">{total} total users</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, email or phone..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
                <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
                >
                    Search
                </button>
            </form>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_80px_48px] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Phone</span>
                    <span>Wallet</span>
                    <span>KYC</span>
                    <span>Role</span>
                    <span></span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">No users found</div>
                ) : (
                    users.map((u, i) => (
                        <motion.div
                            key={u._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                        >
                            {/* Mobile layout */}
                            <div className="md:hidden flex items-center gap-3 px-5 py-4">
                                <button
                                    onClick={() => navigate(`/admin/users/${u._id}`)}
                                    className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0"
                                >
                                    {u.fullName?.charAt(0).toUpperCase()}
                                </button>
                                <button onClick={() => navigate(`/admin/users/${u._id}`)} className="min-w-0 flex-1 text-left">
                                    <p className="font-semibold text-sm truncate">{u.fullName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                </button>
                                <div className="text-right flex-shrink-0 flex items-center gap-2">
                                    <div>
                                        <p className="text-sm font-bold">₹{u.coins?.toLocaleString()}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${kycBadge[u.kycStatus]}`}>
                                            {u.kycStatus.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setDeleteTarget(u)}
                                        className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Desktop layout */}
                            <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_80px_48px] gap-4 items-center px-5 py-3.5">
                                <button
                                    onClick={() => navigate(`/admin/users/${u._id}`)}
                                    className="flex items-center gap-2 min-w-0 text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                        {u.fullName?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium truncate hover:text-primary transition-colors">{u.fullName}</span>
                                </button>
                                <span className="text-sm text-muted-foreground truncate">{u.email}</span>
                                <span className="text-sm text-muted-foreground">{u.phone || '—'}</span>
                                <span className="text-sm font-semibold">₹{u.coins?.toLocaleString()}</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${kycBadge[u.kycStatus]}`}>
                                    {u.kycStatus.replace('_', ' ')}
                                </span>
                                <div className="flex items-center gap-1">
                                    {u.role === 'admin' && <ShieldCheck className="w-4 h-4 text-primary" />}
                                    <span className="text-xs font-medium capitalize">{u.role}</span>
                                </div>
                                <button
                                    onClick={() => setDeleteTarget(u)}
                                    className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                                    title="Delete user"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-xl border border-border hover:bg-secondary/30 disabled:opacity-40 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(pages, p + 1))}
                        disabled={page === pages}
                        className="p-2 rounded-xl border border-border hover:bg-secondary/30 disabled:opacity-40 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            <ConfirmModal
                open={!!deleteTarget}
                title="Delete User?"
                message={`This will permanently delete "${deleteTarget?.fullName}" and all their transactions, KYC, and requests. This cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    );
};

export default AdminUsers;
