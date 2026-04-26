import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Clock, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const DOC_TYPES = [
  { value: 'aadhar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving Licence' },
];

const KYCModal = ({ open, onClose, onApproved }) => {
  const [kycStatus, setKycStatus] = useState(null);
  const [docType, setDocType] = useState('aadhar');
  const [docNumber, setDocNumber] = useState('');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const frontRef = useRef();
  const backRef = useRef();
  const selfieRef = useRef();

  useEffect(() => {
    if (!open) return;
    setError('');
    setSubmitted(false);
    api.get('/kyc/status')
      .then(res => setKycStatus(res.data))
      .catch(() => setKycStatus({ status: 'not_submitted' }));
  }, [open]);

  const handleSubmit = async () => {
    if (!docNumber.trim()) return setError('Please enter your document number');
    if (!frontImage) return setError('Please upload the front image of your document');
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('docType', docType);
      formData.append('docNumber', docNumber.trim());
      if (frontImage) formData.append('frontImage', frontImage);
      if (backImage) formData.append('backImage', backImage);
      if (selfie) formData.append('selfie', selfie);

      await api.post('/kyc/submit', formData);
      setSubmitted(true);
      setKycStatus({ status: 'pending' });
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const FileInput = ({ label, inputRef, value, onChange }) => (
    <div>
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-secondary/20 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        <Upload className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{value ? value.name : `Upload ${label}`}</span>
        {value && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 ml-auto" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => onChange(e.target.files?.[0] || null)}
      />
    </div>
  );

  // Returns true when the submit footer should be visible
  const showFooter =
    kycStatus &&
    (kycStatus.status === 'not_submitted' || kycStatus.status === 'rejected');

  const renderBody = () => {
    if (!kycStatus) {
      return (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (kycStatus.status === 'approved') {
      onApproved?.();
      return null;
    }

    if (kycStatus.status === 'pending') {
      return (
        <div className="text-center py-8 px-2">
          <div className="w-16 h-16 rounded-full bg-amber-400/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="font-bold text-lg mb-2">KYC Under Review</h3>
          <p className="text-sm text-muted-foreground">
            {submitted
              ? 'Your KYC has been submitted successfully. Our team will review it shortly.'
              : 'Your KYC is being reviewed by our team. You will be notified once it is approved.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Rejection banner */}
        {kycStatus.status === 'rejected' && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 bg-destructive/10 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">KYC Rejected</p>
              {kycStatus.adminNote && (
                <p className="text-xs mt-0.5">{kycStatus.adminNote}</p>
              )}
              <p className="text-xs mt-1 opacity-75">Please correct the details and resubmit.</p>
            </div>
          </div>
        )}

        {/* Doc type */}
        <div>
          <label className="text-xs text-muted-foreground font-medium block mb-1">Document Type</label>
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {DOC_TYPES.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Doc number */}
        <div>
          <label className="text-xs text-muted-foreground font-medium block mb-1">Document Number</label>
          <input
            type="text"
            value={docNumber}
            onChange={e => setDocNumber(e.target.value)}
            placeholder="Enter your document number"
            className="w-full rounded-xl bg-secondary/30 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
        </div>

        <FileInput label="Front Image" inputRef={frontRef} value={frontImage} onChange={setFrontImage} />
        <FileInput label="Back Image" inputRef={backRef} value={backImage} onChange={setBackImage} />
        <FileInput label="Selfie with Document" inputRef={selfieRef} value={selfie} onChange={setSelfie} />

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{error}</p>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="kyc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet on mobile, centered modal on sm+ */}
          <motion.div
            key="kyc-modal"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-14 z-50 sm:inset-0 sm:bottom-0 sm:flex sm:items-center sm:justify-center sm:p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border flex flex-col max-h-[92dvh] sm:max-h-[88vh]">

              {/* Header — always visible */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base leading-tight">KYC Verification</h2>
                    <p className="text-xs text-muted-foreground">Required to play battles</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {renderBody()}
              </div>

              {/* Sticky submit footer — only when form is shown */}
              {showFooter && (
                <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-card">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Submit KYC
                      </>
                    )}
                  </motion.button>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KYCModal;
