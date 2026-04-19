import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmModal = ({
    open,
    title = 'Are you sure?',
    message,
    onConfirm,
    onCancel,
    loading = false,
    confirmLabel = 'Delete',
    danger = true,
}) => (
    <AnimatePresence>
        {open && (
            <>
                <motion.div
                    key="cm-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                    onClick={onCancel}
                />
                <motion.div
                    key="cm-modal"
                    initial={{ opacity: 0, scale: 0.93, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 30 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl p-6 pointer-events-auto">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? 'bg-destructive/15' : 'bg-amber-500/15'}`}>
                                <AlertTriangle className={`w-5 h-5 ${danger ? 'text-destructive' : 'text-amber-500'}`} />
                            </div>
                            <h3 className="font-bold text-base">{title}</h3>
                        </div>
                        {message && <p className="text-sm text-muted-foreground mb-5">{message}</p>}
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/30 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${
                                    danger
                                        ? 'bg-destructive text-destructive-foreground hover:brightness-110'
                                        : 'bg-amber-500 text-white hover:brightness-110'
                                }`}
                            >
                                {loading
                                    ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    : <Trash2 className="w-4 h-4" />
                                }
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

export default ConfirmModal;
