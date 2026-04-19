import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, Coins, Megaphone, Plus, Trash2, RefreshCw,
  Zap, Users, Copy, Check, Upload, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/* Pulsing "LIVE" dot */
const LiveBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-[10px] font-bold uppercase tracking-wide">
    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
    Live
  </span>
);

/* ── Result submit modal ──────────────────────────────────────────────────── */
const ResultModal = ({ battle, onClose, onSubmitted }) => {
  const [result, setResult]   = useState('');
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!result) return setError('Select your result');
    if (!file) return setError('Screenshot is required');
    setError('');
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('result', result);
      form.append('screenshot', file);
      const res = await api.post(`/battles/${battle._id}/result`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSubmitted(res.data.battle);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit result');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="relative glass-card w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 z-10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold mb-1">Submit Result</h3>
        <p className="text-xs text-muted-foreground mb-5">
          Upload a screenshot from Ludo King showing the final result.
        </p>

        {error && (
          <p className="text-sm text-destructive mb-4 bg-destructive/10 rounded-xl px-4 py-2">{error}</p>
        )}

        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Your result</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { value: 'won',       label: '🏆 I Won',   color: 'border-green-500 bg-green-500/15 text-green-500' },
            { value: 'lost',      label: '💀 I Lost',  color: 'border-rose-500 bg-rose-500/15 text-rose-500' },
            { value: 'cancelled', label: '🚫 Cancel',  color: 'border-amber-500 bg-amber-500/15 text-amber-500' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setResult(opt.value)}
              className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                result === opt.value ? opt.color : 'border-border text-muted-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Screenshot</p>
        <div
          onClick={() => inputRef.current?.click()}
          className="relative rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden mb-5"
          style={{ minHeight: 140 }}
        >
          {preview ? (
            <>
              <img src={preview} alt="preview" className="w-full h-40 object-contain" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Upload className="w-6 h-6" />
              <span className="text-xs">Tap to upload screenshot</span>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
          {submitting ? 'Submitting…' : 'Submit Result'}
        </motion.button>
      </motion.div>
    </div>
  );
};

/* ── Active battle card (running / result_pending) ──────────────────────── */
const ActiveBattleCard = ({ battle, userId, onRefresh }) => {
  const creatorId = battle.creator?._id || battle.creator;
  const isCreator = String(creatorId) === String(userId);

  const [roomCode, setRoomCode]   = useState(battle.roomCode || '');
  const [savedCode, setSavedCode] = useState(battle.roomCode || '');
  const [savingCode, setSavingCode] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [codeError, setCodeError] = useState('');

  const myResultField = isCreator ? 'creatorResult' : 'player2Result';
  const alreadySubmitted = battle[myResultField] && battle[myResultField] !== 'pending';

  const resultLabel = { won: '🏆 Won', lost: '💀 Lost', cancelled: '🚫 Cancelled', pending: null };

  const handleSaveCode = async () => {
    if (!roomCode.trim()) return setCodeError('Enter a room code');
    setCodeError('');
    setSavingCode(true);
    try {
      const res = await api.patch(`/battles/${battle._id}/room-code`, { roomCode });
      setSavedCode(res.data.battle.roomCode);
    } catch (err) {
      setCodeError(err.response?.data?.message || 'Failed to save code');
    } finally {
      setSavingCode(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(savedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const opponentName = isCreator
    ? (battle.player2?.fullName || 'Opponent')
    : (battle.creator?.fullName || 'Opponent');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 mb-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          {battle.status === 'result_pending'
            ? <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-bold uppercase">Result Pending</span>
            : <LiveBadge />}
          <span className="text-xs font-bold text-green-500 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> ₹{battle.prize} prize
          </span>
        </div>

        {/* Players */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {battle.creator?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <p className="text-xs font-semibold truncate max-w-[80px] text-center">
              {battle.creator?.fullName || 'Player 1'}
              {isCreator && <span className="text-primary"> (You)</span>}
            </p>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <span className="text-base font-black text-muted-foreground">VS</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Coins className="w-3 h-3" /> ₹{battle.entryFee}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-500">
              {battle.player2?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <p className="text-xs font-semibold truncate max-w-[80px] text-center">
              {battle.player2?.fullName || 'Player 2'}
              {!isCreator && <span className="text-primary"> (You)</span>}
            </p>
          </div>
        </div>

        {/* Room code section */}
        {battle.status === 'running' && (
          <div className="border border-border rounded-2xl p-3 mb-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide mb-2">
              Ludo King Room Code
            </p>
            {savedCode ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono font-black text-lg text-primary tracking-widest">
                  {savedCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : isCreator ? (
              <>
                <div className="flex gap-2">
                  <input
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter code from Ludo King"
                    className="flex-1 rounded-xl bg-secondary/30 border border-border px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground placeholder:normal-case"
                  />
                  <button
                    onClick={handleSaveCode}
                    disabled={savingCode}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs disabled:opacity-60"
                  >
                    {savingCode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Share'}
                  </button>
                </div>
                {codeError && <p className="text-xs text-destructive mt-1">{codeError}</p>}
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Open Ludo King → Create Room → paste the code here to share with opponent.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Waiting for {opponentName} to share the room code…
              </p>
            )}
          </div>
        )}

        {/* Result submission */}
        {alreadySubmitted ? (
          <div className="flex items-center gap-2 rounded-xl bg-secondary/30 px-4 py-2.5">
            <span className="text-sm font-semibold">{resultLabel[battle[myResultField]]}</span>
            <span className="text-xs text-muted-foreground">Result submitted — awaiting admin review</span>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowResult(true)}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Post Result
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {showResult && (
          <ResultModal
            battle={battle}
            onClose={() => setShowResult(false)}
            onSubmitted={() => onRefresh()}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Open battle card for creator (set room code while waiting) ────────── */
const OpenBattleCreatorCard = ({ battle, onCancel, cancellingId }) => {
  const [roomCode, setRoomCode]   = useState(battle.roomCode || '');
  const [savedCode, setSavedCode] = useState(battle.roomCode || '');
  const [saving, setSaving]       = useState(false);
  const [copied, setCopied]       = useState(false);
  const [codeError, setCodeError] = useState('');

  const handleSave = async () => {
    if (!roomCode.trim()) return setCodeError('Enter a room code');
    setCodeError('');
    setSaving(true);
    try {
      const res = await api.patch(`/battles/${battle._id}/room-code`, { roomCode });
      setSavedCode(res.data.battle.roomCode);
    } catch (err) {
      setCodeError(err.response?.data?.message || 'Failed to save code');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(savedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-4"
    >
      {/* Top row — stats + cancel */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground mb-1.5">Waiting for opponent…</p>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Entry Fee</p>
              <p className="text-sm font-bold text-primary flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> {battle.entryFee}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Prize</p>
              <p className="text-sm font-bold text-green-500 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> {battle.prize}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => onCancel(battle._id)}
          disabled={cancellingId === battle._id}
          className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-60 flex-shrink-0"
        >
          {cancellingId === battle._id
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Room code section */}
      <div className="border border-border rounded-2xl p-3">
        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide mb-2">
          Ludo King Room Code
        </p>
        {savedCode ? (
          <div className="flex items-center gap-2">
            <span className="flex-1 font-mono font-black text-lg text-primary tracking-widest">
              {savedCode}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => { setSavedCode(''); setRoomCode(''); }}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              title="Change code"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter code from Ludo King"
                className="flex-1 rounded-xl bg-secondary/30 border border-border px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground placeholder:normal-case"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs disabled:opacity-60 flex items-center gap-1"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Share'}
              </button>
            </div>
            {codeError && <p className="text-xs text-destructive mt-1">{codeError}</p>}
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Open Ludo King → Create Room → enter the code here so your opponent sees it when they join.
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

/* ── Main BattlePage ─────────────────────────────────────────────────────── */
const BattlePage = () => {
  const { user, setUser } = useAuth();
  const [announcement, setAnnouncement]     = useState('');
  const [openBattles, setOpenBattles]       = useState([]);
  const [myBattles, setMyBattles]           = useState([]);
  const [runningBattles, setRunningBattles] = useState([]);
  const [entryFee, setEntryFee]             = useState('');
  const [creating, setCreating]             = useState(false);
  const [joiningId, setJoiningId]           = useState(null);
  const [cancellingId, setCancellingId]     = useState(null);
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(true);

  const myId = user?._id || user?.id;

  const fetchBattles = async () => {
    try {
      const [openRes, myRes, runningRes] = await Promise.all([
        api.get('/battles'),
        api.get('/battles/my'),
        api.get('/battles/running'),
      ]);
      setOpenBattles(openRes.data.battles);
      setMyBattles(myRes.data.battles);
      setRunningBattles(runningRes.data.battles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/admin/announcement')
      .then(res => setAnnouncement(res.data.battleMessage || ''))
      .catch(() => {});
    fetchBattles();
  }, []);

  const handleCreate = async () => {
    const fee = Number(entryFee);
    if (!fee || fee < 1) return setError('Enter a valid entry fee');
    setError('');
    setCreating(true);
    try {
      const res = await api.post('/battles', { entryFee: fee });
      setMyBattles(prev => [res.data.battle, ...prev]);
      if (setUser) setUser(u => ({ ...u, coins: res.data.newBalance }));
      setEntryFee('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create battle');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (id) => {
    setJoiningId(id);
    setError('');
    try {
      const res = await api.post(`/battles/${id}/join`);
      setOpenBattles(prev => prev.filter(b => b._id !== id));
      if (setUser) setUser(u => ({ ...u, coins: res.data.newBalance }));
      if (res.data.battle) {
        setRunningBattles(prev => [res.data.battle, ...prev]);
        setMyBattles(prev => [res.data.battle, ...prev]);
      } else {
        fetchBattles();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join battle');
    } finally {
      setJoiningId(null);
    }
  };

  const handleCancel = async (id) => {
    setCancellingId(id);
    setError('');
    try {
      await api.delete(`/battles/${id}`);
      setMyBattles(prev => prev.filter(b => b._id !== id));
      const profileRes = await api.get('/profile');
      if (setUser) setUser(profileRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel battle');
    } finally {
      setCancellingId(null);
    }
  };

  // Split battles by status for display
  const myOpenBattles   = myBattles.filter(b => b.status === 'open');
  const myActiveBattles = runningBattles.filter(b => {
    const cId = b.creator?._id || b.creator;
    const p2Id = b.player2?._id || b.player2;
    return String(cId) === String(myId) || String(p2Id) === String(myId);
  });
  const myActiveIds = new Set(myActiveBattles.map(b => b._id));
  const publicRunning = runningBattles.filter(b => !myActiveIds.has(b._id));

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Announcement */}
      {announcement && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-3 rounded-2xl px-5 py-4"
          style={{ backgroundColor: '#FEF08A', color: '#713F12' }}
        >
          <Megaphone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#A16207' }} />
          <p className="text-sm font-medium leading-snug">{announcement}</p>
        </motion.div>
      )}

      {/* Create a Battle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-5 mb-5"
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          Create a Battle!
        </h2>

        {error && (
          <p className="text-sm text-destructive mb-3 bg-destructive/10 rounded-xl px-4 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <input
            type="number"
            min="1"
            value={entryFee}
            onChange={e => setEntryFee(e.target.value)}
            placeholder="Enter amount"
            className="flex-1 rounded-xl bg-secondary/30 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleCreate}
            disabled={creating}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Set
          </motion.button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Balance: ₹{user?.coins?.toFixed(2) ?? '0.00'} &nbsp;·&nbsp; Prize = entry fee × 1.9
        </p>
      </motion.div>

      {/* My Open Battles */}
      {myOpenBattles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            My Open Battles
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {myOpenBattles.map(battle => (
                <OpenBattleCreatorCard
                  key={battle._id}
                  battle={battle}
                  onCancel={handleCancel}
                  cancellingId={cancellingId}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* My Active Battles (running / result_pending) */}
      {myActiveBattles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-5"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1 flex items-center gap-2">
            <Swords className="w-3.5 h-3.5 text-primary" />
            My Active Battles
          </h3>
          {myActiveBattles.map(battle => (
            <ActiveBattleCard
              key={battle._id}
              battle={battle}
              userId={myId}
              onRefresh={fetchBattles}
            />
          ))}
        </motion.div>
      )}

      {/* Running Battles (public feed) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        className="mb-5"
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-red-500" />
            Running Battles
            {publicRunning.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 text-[10px] font-bold">
                {publicRunning.length}
              </span>
            )}
          </h3>
          <button onClick={fetchBattles} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : publicRunning.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm glass-card rounded-2xl border border-dashed border-border">
            No battles running right now.
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {publicRunning.map((battle, i) => (
                <motion.div
                  key={battle._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    {battle.status === 'result_pending'
                      ? <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-bold uppercase">Result Pending</span>
                      : <LiveBadge />}
                    <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> ₹{battle.prize} prize
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {battle.creator?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate max-w-[80px] text-center">
                        {battle.creator?.fullName || 'Player 1'}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className="text-base font-black text-muted-foreground">VS</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Coins className="w-3 h-3" /> ₹{battle.entryFee}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-500">
                        {battle.player2?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate max-w-[80px] text-center">
                        {battle.player2?.fullName || 'Player 2'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Open Battles */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          Open Battles
        </h3>
        <button onClick={fetchBattles} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : openBattles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm glass-card rounded-2xl">
          No open battles right now. Create one!
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {openBattles.map((battle, i) => (
              <motion.div
                key={battle._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-4"
              >
                <p className="text-xs text-muted-foreground font-medium mb-3">
                  Challenge From{' '}
                  <span className="text-foreground font-bold">{battle.creator?.fullName || 'Unknown'}</span>
                </p>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide mb-1">Entry Fee</p>
                      <p className="text-base font-black text-primary flex items-center gap-1">
                        <Coins className="w-4 h-4" /> {battle.entryFee}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide mb-1">Prize</p>
                      <p className="text-base font-black text-green-500 flex items-center gap-1">
                        <Trophy className="w-4 h-4" /> {battle.prize}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => handleJoin(battle._id)}
                    disabled={joiningId === battle._id}
                    className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {joiningId === battle._id
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : 'Play'}
                  </motion.button>
                </div>
                {battle.roomCode && (
                  <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Room Code:</span>
                    <span className="font-mono font-black text-primary tracking-widest text-sm">{battle.roomCode}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default BattlePage;
