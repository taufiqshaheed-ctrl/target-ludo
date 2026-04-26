import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronLeft, ChevronRight, X, Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';
import ConfirmModal from '@/components/ConfirmModal';

const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const statusBadge = {
    approved: 'bg-green-500/20 text-green-500',
    pending: 'bg-amber-500/20 text-amber-500',
    rejected: 'bg-rose-500/20 text-rose-500',
};

const AdminKYC = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [actioning, setActioning] = useState(null);

    // Reject reason modal state
    const [rejectTarget, setRejectTarget] = useState(null); // { kycId }
    const [rejectNote, setRejectNote] = useState('');
    const [rejecting, setRejecting] = useState(false);

    // Image preview modal
    const [previewUrl, setPreviewUrl] = useState(null);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchKYC = async (p = page, status = filterStatus) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/kyc', {
                params: { page: p, limit: 15, status: status || undefined },
            });
            setSubmissions(res.data.submissions);
            setPages(res.data.pages);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKYC(); }, [page]);

    const applyFilter = (status) => {
        setFilterStatus(status);
        setPage(1);
        fetchKYC(1, status);
    };

    const handleApprove = async (kycId) => {
        setActioning(kycId);
        try {
            await api.patch(`/admin/kyc/${kycId}`, { status: 'approved' });
            toast.success('KYC approved');
            fetchKYC(page, filterStatus);
        } catch {
            toast.error('Failed to approve KYC');
        } finally {
            setActioning(null);
        }
    };

    const openRejectModal = (kycId) => {
        setRejectNote('');
        setRejectTarget({ kycId });
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/kyc/${deleteTarget._id}`);
            toast.success('KYC submission deleted');
            setSubmissions(prev => prev.filter(k => k._id !== deleteTarget._id));
            setTotal(n => n - 1);
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete KYC');
        } finally {
            setDeleting(false);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectTarget) return;
        setRejecting(true);
        try {
            await api.patch(`/admin/kyc/${rejectTarget.kycId}`, {
                status: 'rejected',
                adminNote: rejectNote.trim(),
            });
            toast.success('KYC rejected');
            setRejectTarget(null);
            fetchKYC(page, filterStatus);
        } catch {
            toast.error('Failed to reject KYC');
        } finally {
            setRejecting(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    KYC Submissions
                </h1>
                <p className="text-muted-foreground text-sm mt-1">{total} submissions</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 mb-6 bg-card border border-border rounded-xl p-1 w-fit">
                {['', 'pending', 'approved', 'rejected'].map(s => (
                    <button
                        key={s}
                        onClick={() => applyFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            filterStatus === s
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            <div className="glass-card overflow-hidden">
                {/* Desktop header */}
                <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_200px] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    <span>User</span><span>Doc Type</span><span>Doc Number</span><span>Status</span><span>Submitted</span><span>Actions</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">No KYC submissions found</div>
                ) : (
                    submissions.map((k, i) => (
                        <motion.div
                            key={k._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-border last:border-0"
                        >
                            {/* Mobile card */}
                            <div className="md:hidden p-5 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <button
                                            onClick={() => navigate(`/admin/users/${k.userId?._id}`)}
                                            className="font-semibold text-sm hover:text-primary transition-colors"
                                        >
                                            {k.userId?.fullName}
                                        </button>
                                        <p className="text-xs text-muted-foreground">{k.userId?.email}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusBadge[k.status]}`}>
                                        {k.status}
                                    </span>
                                </div>

                                <div className="flex gap-4 text-xs text-muted-foreground">
                                    <span className="capitalize">{k.docType.replace('_', ' ')}</span>
                                    <span className="font-mono">{k.docNumber}</span>
                                </div>

                                {/* Images */}
                                {(k.frontImage || k.backImage || k.selfie) && (
                                    <div className="flex gap-2">
                                        {[{ url: k.frontImage, label: 'Front' }, { url: k.backImage, label: 'Back' }, { url: k.selfie, label: 'Selfie' }]
                                            .filter(img => img.url)
                                            .map(img => (
                                                <button
                                                    key={img.label}
                                                    onClick={() => setPreviewUrl(`${BASE}${img.url}`)}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                                                >
                                                    <Eye className="w-3 h-3" /> {img.label}
                                                </button>
                                            ))}
                                    </div>
                                )}

                                {k.status === 'rejected' && k.adminNote && (
                                    <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                                        Reason: {k.adminNote}
                                    </p>
                                )}

                                {k.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            disabled={actioning === k._id}
                                            onClick={() => handleApprove(k._id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/20 text-green-500 text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50 transition-colors"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                                        </button>
                                        <button
                                            disabled={actioning === k._id}
                                            onClick={() => openRejectModal(k._id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/20 text-rose-500 text-xs font-semibold hover:bg-rose-500/30 disabled:opacity-50 transition-colors"
                                        >
                                            <XCircle className="w-3.5 h-3.5" /> Reject
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setDeleteTarget(k)}
                                    className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>

                            {/* Desktop row */}
                            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_200px] gap-4 items-center px-5 py-4">
                                <button onClick={() => navigate(`/admin/users/${k.userId?._id}`)} className="text-left min-w-0">
                                    <p className="text-sm font-medium hover:text-primary transition-colors truncate">{k.userId?.fullName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{k.userId?.email}</p>
                                </button>
                                <span className="text-sm capitalize">{k.docType.replace('_', ' ')}</span>
                                <span className="text-sm font-mono text-muted-foreground">{k.docNumber}</span>
                                <div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[k.status]}`}>{k.status}</span>
                                    {k.status === 'rejected' && k.adminNote && (
                                        <p className="text-xs text-muted-foreground mt-1 max-w-[120px] truncate" title={k.adminNote}>{k.adminNote}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">{new Date(k.createdAt).toLocaleDateString('en-IN')}</span>
                                    {(k.frontImage || k.backImage || k.selfie) && (
                                        <div className="flex gap-1">
                                            {[{ url: k.frontImage, label: 'F' }, { url: k.backImage, label: 'B' }, { url: k.selfie, label: 'S' }]
                                                .filter(img => img.url)
                                                .map(img => (
                                                    <button
                                                        key={img.label}
                                                        onClick={() => setPreviewUrl(`${BASE}${img.url}`)}
                                                        className="px-1.5 py-0.5 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                                                    >
                                                        {img.label}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {k.status === 'pending' ? (
                                        <>
                                            <button
                                                disabled={actioning === k._id}
                                                onClick={() => handleApprove(k._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 text-green-500 text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50 transition-colors"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                                            </button>
                                            <button
                                                disabled={actioning === k._id}
                                                onClick={() => openRejectModal(k._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-500 text-xs font-semibold hover:bg-rose-500/30 disabled:opacity-50 transition-colors"
                                            >
                                                <XCircle className="w-3.5 h-3.5" /> Reject
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/admin/users/${k.userId?._id}`)}
                                            className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary/30 transition-colors"
                                        >
                                            View Details
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDeleteTarget(k)}
                                        className="p-1.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
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

            {/* Reject reason modal */}
            <AnimatePresence>
                {rejectTarget && (
                    <>
                        <motion.div
                            key="reject-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setRejectTarget(null)}
                        />
                        <motion.div
                            key="reject-modal"
                            initial={{ opacity: 0, scale: 0.93, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 30 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-base flex items-center gap-2">
                                        <XCircle className="w-5 h-5 text-rose-500" /> Reject KYC
                                    </h3>
                                    <button onClick={() => setRejectTarget(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <label className="text-xs text-muted-foreground font-medium block mb-2">
                                    Reason for rejection <span className="text-muted-foreground">(shown to user)</span>
                                </label>
                                <textarea
                                    value={rejectNote}
                                    onChange={e => setRejectNote(e.target.value)}
                                    rows={3}
                                    placeholder="e.g. Document image is blurry, please re-upload…"
                                    className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-muted-foreground mb-4"
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setRejectTarget(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/30 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRejectConfirm}
                                        disabled={rejecting}
                                        className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {rejecting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Image preview modal */}
            <AnimatePresence>
                {previewUrl && (
                    <>
                        <motion.div
                            key="preview-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setPreviewUrl(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                                className="relative max-w-lg w-full"
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setPreviewUrl(null)}
                                    className="absolute -top-10 right-0 p-2 rounded-xl text-white/70 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <img src={previewUrl} alt="KYC document" className="w-full rounded-2xl shadow-2xl" />
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ConfirmModal
                open={!!deleteTarget}
                title="Delete KYC Submission?"
                message="This will permanently remove this KYC submission. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    );
};

export default AdminKYC;
