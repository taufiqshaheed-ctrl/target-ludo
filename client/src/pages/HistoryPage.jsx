import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft, ArrowUpRight, Clock,
  CheckCircle2, XCircle, Loader2, IndianRupee,
} from 'lucide-react';
import api from '../services/api';

const TYPE_LABEL = {
  deposit:    'Deposit',
  withdrawal: 'Withdrawal',
  bonus:      'Bonus',
  refund:     'Refund',
};

const StatusBadge = ({ status }) => {
  const map = {
    completed: { cls: 'bg-green-500/15 text-green-500',  icon: CheckCircle2 },
    pending:   { cls: 'bg-amber-400/15 text-amber-500',  icon: Clock },
    failed:    { cls: 'bg-destructive/15 text-destructive', icon: XCircle },
  };
  const { cls, icon: Icon } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

const TxnIcon = ({ type, status }) => {
  const isCredit = type === 'deposit' || type === 'bonus' || type === 'refund';
  const dim = status === 'failed' ? 'opacity-40' : '';
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
      isCredit ? 'bg-green-500/15' : 'bg-destructive/15'
    } ${dim}`}>
      {isCredit
        ? <ArrowDownLeft className="w-5 h-5 text-green-500" />
        : <ArrowUpRight  className="w-5 h-5 text-destructive" />}
    </div>
  );
};

const HistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/deposits/transactions')
      .then(res => setTransactions(res.data.transactions || []))
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  const isCredit = (type) => ['deposit', 'bonus', 'refund'].includes(type);

  return (
    <div className="p-4 md:p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center gap-3">
          <XCircle className="w-12 h-12 text-destructive/50" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center gap-3">
          <Clock className="w-14 h-14 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No transactions yet</p>
          <p className="text-muted-foreground/60 text-sm">Your payment history will appear here</p>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="flex flex-col gap-3">
          {transactions.map((txn, i) => (
            <motion.div
              key={txn._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border"
            >
              <TxnIcon type={txn.type} status={txn.status} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm">
                    {TYPE_LABEL[txn.type] || txn.type}
                  </p>
                  <StatusBadge status={txn.status} />
                </div>
                {txn.note && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{txn.note}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(txn.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className={`font-bold text-base flex items-center justify-end gap-0.5 ${
                  txn.status === 'failed'
                    ? 'text-muted-foreground line-through'
                    : isCredit(txn.type)
                      ? 'text-green-500'
                      : 'text-destructive'
                }`}>
                  <IndianRupee className="w-3.5 h-3.5" />
                  {txn.amount.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{txn.type}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
