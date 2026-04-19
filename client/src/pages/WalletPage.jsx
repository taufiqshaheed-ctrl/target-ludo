import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ArrowUpRight, ArrowDownLeft,
  Loader2, RefreshCw, CheckCircle2, Clock, XCircle, IndianRupee,
  X, ChevronRight, Building2, CreditCard, Hash, Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TYPE_LABEL = {
  deposit:    'Deposit',
  withdrawal: 'Withdrawal',
  bonus:      'Bonus',
  refund:     'Refund',
};

const StatusIcon = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (status === 'failed')    return <XCircle      className="w-3.5 h-3.5 text-destructive" />;
  return                             <Clock        className="w-3.5 h-3.5 text-amber-500" />;
};

/* ── Withdraw Modal ─────────────────────────────────────────────────────────── */
const PRESETS = [100, 200, 500, 1000, 2000, 5000];

const WithdrawModal = ({ open, onClose, maxAmount, onSuccess }) => {
  const [step, setStep] = useState('amount'); // 'amount' | 'bank' | 'done'
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank'); // 'bank' | 'upi'
  const [form, setForm] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const sheetRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('amount');
      setAmount('');
      setMethod('bank');
      setForm({ accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '' });
      setError('');
    }
  }, [open]);

  const amtNum = Number(amount);
  const amountValid = !isNaN(amtNum) && amtNum >= 100 && amtNum <= maxAmount;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/deposits/withdraw', {
        amount: amtNum,
        ...(method === 'bank'
          ? {
              accountHolderName: form.accountHolderName.trim(),
              bankName: form.bankName.trim(),
              accountNumber: form.accountNumber.trim(),
              ifscCode: form.ifscCode.trim(),
            }
          : { upiId: form.upiId.trim() }),
      });
      setStep('done');
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const bankValid =
    method === 'upi'
      ? form.upiId.trim().length > 3
      : form.accountHolderName.trim() && form.bankName.trim() &&
        form.accountNumber.trim() && form.ifscCode.trim();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={step !== 'done' ? onClose : undefined}
          />

          {/* Bottom sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-[61] bg-card rounded-t-3xl shadow-2xl
                       h-[88dvh] sm:h-auto sm:max-h-[88dvh]
                       flex flex-col overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <h2 className="font-bold text-lg">
                {step === 'done' ? 'Request Submitted' : 'Withdraw Money'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5">

              {/* ── Step: Amount ── */}
              {step === 'amount' && (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Available balance: <span className="font-bold text-foreground">₹{maxAmount.toLocaleString('en-IN')}</span>
                    </p>
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/20 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
                      <span className="text-2xl font-bold text-muted-foreground">₹</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 bg-transparent text-2xl font-bold focus:outline-none placeholder:text-muted-foreground/40"
                      />
                    </div>
                    {amtNum > 0 && amtNum < 100 && (
                      <p className="text-xs text-destructive mt-1">Minimum withdrawal is ₹100</p>
                    )}
                    {amtNum > maxAmount && (
                      <p className="text-xs text-destructive mt-1">Exceeds available balance</p>
                    )}
                  </div>

                  {/* Preset chips */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Quick select</p>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESETS.filter(p => p <= maxAmount).map(p => (
                        <button
                          key={p}
                          onClick={() => setAmount(String(p))}
                          className={`py-2 rounded-xl text-sm font-semibold border transition-colors ${
                            amtNum === p
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-secondary/20 text-foreground hover:border-primary/50'
                          }`}
                        >
                          ₹{p.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-400">
                    Withdrawals are processed within 24 hours after admin approval.
                  </div>
                </div>
              )}

              {/* ── Step: Bank Details ── */}
              {step === 'bank' && (
                <div className="flex flex-col gap-4">
                  {/* Method toggle */}
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setMethod('bank')}
                      className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        method === 'bank'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary/30'
                      }`}
                    >
                      <Building2 className="w-4 h-4" /> Bank Account
                    </button>
                    <button
                      onClick={() => setMethod('upi')}
                      className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        method === 'upi'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary/30'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> UPI
                    </button>
                  </div>

                  <p className="text-sm font-medium text-muted-foreground -mb-1">
                    Withdrawing <span className="font-bold text-foreground">₹{amtNum.toLocaleString('en-IN')}</span>
                  </p>

                  {method === 'bank' ? (
                    <>
                      {[
                        { key: 'accountHolderName', label: 'Account Holder Name', icon: CreditCard, placeholder: 'Full name as in bank' },
                        { key: 'bankName',          label: 'Bank Name',           icon: Building2,  placeholder: 'e.g. State Bank of India' },
                        { key: 'accountNumber',     label: 'Account Number',      icon: Hash,        placeholder: '10-digit account number' },
                        { key: 'ifscCode',          label: 'IFSC Code',           icon: Hash,        placeholder: 'e.g. SBIN0001234' },
                      ].map(({ key, label, icon: Icon, placeholder }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
                          <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/20 px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/50">
                            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <input
                              type={key === 'accountNumber' ? 'tel' : 'text'}
                              value={form[key]}
                              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                              placeholder={placeholder}
                              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
                            />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">UPI ID</label>
                      <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/20 px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/50">
                        <Smartphone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <input
                          type="text"
                          value={form.upiId}
                          onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))}
                          placeholder="yourname@upi"
                          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-destructive rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2">
                      {error}
                    </p>
                  )}
                </div>
              )}

              {/* ── Step: Done ── */}
              {step === 'done' && (
                <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Request Submitted!</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Your withdrawal of <span className="font-semibold text-foreground">₹{amtNum.toLocaleString('en-IN')}</span> is under review.
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                      Admin will process it within 24 hours. You can track the status in Transaction History.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-border"
              style={{ paddingBottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))' }}
            >
              {step === 'amount' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!amountValid}
                  onClick={() => setStep('bank')}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </motion.button>
              )}
              {step === 'bank' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('amount'); setError(''); }}
                    className="px-4 py-3 rounded-2xl border border-border text-sm font-semibold"
                  >
                    Back
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={!bankValid || submitting}
                    onClick={handleSubmit}
                    className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
                  </motion.button>
                </div>
              )}
              {step === 'done' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base"
                >
                  Done
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ── Wallet Page ────────────────────────────────────────────────────────────── */
const WalletPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading]     = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Fetch fresh balance from server on mount
  useEffect(() => {
    refreshUser().finally(() => setBalanceLoading(false));
  }, [refreshUser]);

  // Fetch real transactions
  useEffect(() => {
    api.get('/deposits/transactions')
      .then(res => setTransactions(res.data.transactions || []))
      .catch(() => {})
      .finally(() => setTxnLoading(false));
  }, []);

  const handleRefresh = async () => {
    setBalanceLoading(true);
    await refreshUser();
    setBalanceLoading(false);
    setTxnLoading(true);
    try {
      const res = await api.get('/deposits/transactions');
      setTransactions(res.data.transactions || []);
    } catch { /* silent */ } finally {
      setTxnLoading(false);
    }
  };

  // Called after a successful withdrawal submission to refresh balance + history
  const handleWithdrawSuccess = () => {
    refreshUser();
    api.get('/deposits/transactions')
      .then(res => setTransactions(res.data.transactions || []))
      .catch(() => {});
  };

  const isCredit = (type) => ['deposit', 'bonus', 'refund'].includes(type);

  return (
    <>
      <div className="p-4 md:p-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Wallet</h1>
          <button
            onClick={handleRefresh}
            disabled={balanceLoading}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-40"
            title="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* ── Balance card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-1 bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-6 text-primary-foreground flex flex-col justify-between min-h-[180px]"
          >
            <div>
              <p className="text-sm opacity-80">Total Balance</p>
              {balanceLoading ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-5 h-5 animate-spin opacity-70" />
                  <span className="text-sm opacity-70">Updating…</span>
                </div>
              ) : (
                <p className="text-4xl font-black mt-1 flex items-start gap-1">
                  <span className="text-2xl mt-1">₹</span>
                  {(user?.coins ?? 0).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => navigate('/add-money')}
                className="flex-1 py-2.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Money
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => setWithdrawOpen(true)}
                className="flex-1 py-2.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </motion.button>
            </div>
          </motion.div>

          {/* ── Transactions ── */}
          <div className="md:col-span-2">
            <h2 className="font-semibold mb-3 text-foreground">Recent Transactions</h2>

            {txnLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3 rounded-2xl border border-dashed border-border">
                <IndianRupee className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No transactions yet</p>
                <button
                  onClick={() => navigate('/add-money')}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  Add Money
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx, i) => (
                  <motion.div
                    key={tx._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between p-4 bg-card rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.status === 'failed'
                          ? 'bg-secondary/50'
                          : isCredit(tx.type) ? 'bg-green-500/15' : 'bg-destructive/15'
                      }`}>
                        {isCredit(tx.type)
                          ? <ArrowDownLeft className={`w-5 h-5 ${tx.status === 'failed' ? 'text-muted-foreground' : 'text-green-500'}`} />
                          : <ArrowUpRight  className={`w-5 h-5 ${tx.status === 'failed' ? 'text-muted-foreground' : 'text-destructive'}`} />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-foreground text-sm">{TYPE_LABEL[tx.type] || tx.type}</p>
                          <StatusIcon status={tx.status} />
                        </div>
                        {tx.note && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{tx.note}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    <span className={`font-bold text-sm ${
                      tx.status === 'failed'
                        ? 'text-muted-foreground line-through'
                        : isCredit(tx.type) ? 'text-green-500' : 'text-destructive'
                    }`}>
                      {isCredit(tx.type) ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdraw modal (rendered outside the scroll container) */}
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        maxAmount={user?.coins ?? 0}
        onSuccess={handleWithdrawSuccess}
      />
    </>
  );
};

export default WalletPage;
