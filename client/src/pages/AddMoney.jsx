import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  IndianRupee, ArrowRight, Megaphone, X,
  CheckCircle2, Loader2, Copy, QrCode,
  ImagePlus, Trash2,
} from 'lucide-react';
import api from '../services/api';

const PRESETS = [100, 250, 500, 2000];
const MIN = 10;
const MAX = 200000;
const API_ORIGIN = import.meta.env.VITE_API_URL || '';

/* ── QR Payment Modal ──────────────────────────────────────────────────── */
const QRModal = ({ amount, onClose }) => {
  const screenshotInputRef = useRef(null);

  const [qrImageUrl, setQrImageUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);

  // step: 'qr' → user scans QR; 'screenshot' → user uploads proof; 'done' → success
  const [step, setStep] = useState('qr');

  const [screenshot, setScreenshot] = useState(null);   // File object
  const [preview, setPreview]       = useState('');     // object URL for preview
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    api.get('/deposits/payment-settings')
      .then(res => {
        setQrImageUrl(res.data.qrImageUrl || '');
        setUpiId(res.data.upiId || '');
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  // Clean up object URL to avoid memory leaks
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const copyUPI = () => {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setPreview('');
    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!screenshot) { setError('Please attach your payment screenshot.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const form = new FormData();
      form.append('amount', String(amount));
      form.append('screenshot', screenshot);
      await api.post('/deposits', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        /* Mobile: fixed height so footer is always on screen.
           sm+: auto height with a max so it behaves like a centred modal. */
        className="w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl
                   flex flex-col h-[88dvh] sm:h-auto sm:max-h-[88dvh]"
      >
        {/* ── Header (never scrolls) ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">
              {step === 'qr' ? 'Scan & Pay' : step === 'screenshot' ? 'Upload Proof' : 'Request Sent'}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Body (scrollable middle) ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">

          {/* Amount pill */}
          <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 flex-shrink-0">
            <IndianRupee className="w-5 h-5 text-primary" />
            <span className="text-2xl font-extrabold text-primary">
              {amount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* ── Step: done ── */}
          {step === 'done' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 py-6 text-center"
            >
              <CheckCircle2 className="w-14 h-14 text-green-500" />
              <p className="font-bold text-foreground text-lg">Request Submitted!</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your payment screenshot has been sent to admin. Your wallet will be credited after verification — usually within a few minutes.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
              >
                Done
              </button>
            </motion.div>
          )}

          {/* ── Step: qr ── */}
          {step === 'qr' && (
            <>
              {loadingSettings ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {qrImageUrl ? (
                    <div className="flex justify-center">
                      <img
                        src={`${API_ORIGIN}${qrImageUrl}`}
                        alt="Payment QR"
                        /* Smaller on mobile so UPI row + instruction + button all fit */
                        className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-2xl border border-border bg-white p-2"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-secondary/30 border border-dashed border-border">
                      <QrCode className="w-10 h-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">QR code not set by admin yet</p>
                    </div>
                  )}

                  {upiId && (
                    <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-secondary/30 border border-border">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">UPI ID</p>
                        <p className="text-sm font-semibold text-foreground font-mono truncate">{upiId}</p>
                      </div>
                      <button
                        onClick={copyUPI}
                        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center leading-relaxed px-1">
                    Pay exactly <span className="font-semibold text-foreground">₹{amount.toLocaleString('en-IN')}</span> using the QR or UPI ID above, then tap the button below.
                  </p>
                </>
              )}
            </>
          )}

          {/* ── Step: screenshot ── */}
          {step === 'screenshot' && (
            <>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Upload your payment confirmation screenshot so admin can verify and credit your wallet.
              </p>

              {preview ? (
                <div className="relative rounded-2xl overflow-hidden border border-border">
                  <img src={preview} alt="Payment screenshot" className="w-full max-h-56 object-contain bg-secondary/20" />
                  <button
                    onClick={removeScreenshot}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => screenshotInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed border-border bg-secondary/20 hover:bg-secondary/40 transition-colors w-full"
                >
                  <ImagePlus className="w-10 h-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Tap to upload screenshot</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG — max 5 MB</p>
                  </div>
                </button>
              )}

              <input
                ref={screenshotInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleScreenshotChange}
              />

              {error && <p className="text-destructive text-sm text-center">{error}</p>}
            </>
          )}
        </div>

        {/* ── Footer (always visible at bottom, clears the fixed BottomNav on mobile) ── */}
        {step !== 'done' && (
          <div className="px-5 pt-3 border-t border-border flex-shrink-0 bg-card pb-6 sm:pb-6"
               style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))' }}>
            {step === 'qr' && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('screenshot')}
                disabled={loadingSettings}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 text-sm sm:text-base"
                style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #06b6d4 100%)' }}
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                I Have Paid — Upload Screenshot
              </motion.button>
            )}

            {step === 'screenshot' && (
              <div className="flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={submitting || !screenshot}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' }}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {submitting ? 'Submitting…' : 'Submit for Verification'}
                </motion.button>
                <button
                  onClick={() => setStep('qr')}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold text-muted-foreground border border-border hover:border-primary/50 transition-colors"
                >
                  ← Back to QR
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ── AddMoney Page ─────────────────────────────────────────────────────── */
const AddMoney = () => {
  const [amount, setAmount]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [error, setError]         = useState('');
  const [showQR, setShowQR]       = useState(false);

  useEffect(() => {
    api.get('/admin/announcement')
      .then(res => setAnnouncement(res.data.walletMessage || ''))
      .catch(() => {});
  }, []);

  const handlePreset = (val) => { setSelected(val); setAmount(String(val)); setError(''); };
  const handleInput  = (val) => { setAmount(val); setSelected(null); setError(''); };

  const handleNext = () => {
    const num = Number(amount);
    if (!amount || isNaN(num))  { setError('Please enter an amount.'); return; }
    if (num < MIN)              { setError(`Minimum amount is ₹${MIN}.`); return; }
    if (num > MAX)              { setError(`Maximum amount is ₹${MAX.toLocaleString('en-IN')}.`); return; }
    setShowQR(true);
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="flex-1 w-full max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

          {announcement && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm leading-relaxed"
            >
              <Megaphone className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
              <p>{announcement}</p>
            </motion.div>
          )}

          <h1 className="text-2xl font-extrabold text-foreground">Choose Amount To Add</h1>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-foreground text-base">Enter Amount</label>
            <div className="flex items-center gap-2 border-2 border-border rounded-xl px-4 py-3 bg-card focus-within:border-primary transition-colors">
              <IndianRupee className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                type="number"
                min={MIN}
                max={MAX}
                value={amount}
                onChange={e => handleInput(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent outline-none text-foreground text-lg font-semibold placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex justify-between text-sm font-semibold text-foreground mt-1 px-1">
              <span>Min: {MIN}</span>
              <span>Max: {MAX.toLocaleString('en-IN')}</span>
            </div>
            {error && <p className="text-destructive text-sm px-1">{error}</p>}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {PRESETS.map(val => (
              <motion.button
                key={val}
                whileTap={{ scale: 0.94 }}
                onClick={() => handlePreset(val)}
                className={`flex items-center justify-center gap-1 py-4 rounded-xl text-sm font-bold transition-colors ${
                  selected === val ? 'bg-blue-600 text-white' : 'bg-foreground text-background'
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                {val.toLocaleString('en-IN')}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={handleNext}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 mt-2"
            style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #06b6d4 100%)' }}
          >
            Next <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showQR && <QRModal amount={Number(amount)} onClose={() => setShowQR(false)} />}
      </AnimatePresence>
    </>
  );
};

export default AddMoney;
