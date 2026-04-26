import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Clock, XCircle, CheckCircle2,
  Upload, Loader2, ChevronDown, FileText,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DOC_TYPES = [
  { value: 'aadhar',          label: 'Aadhaar Card' },
  { value: 'pan',             label: 'PAN Card' },
  { value: 'passport',        label: 'Passport' },
  { value: 'driving_license', label: 'Driving Licence' },
];

const StatusBanner = ({ status, adminNote }) => {
  const config = {
    approved: {
      icon: CheckCircle2,
      bg: 'bg-green-500/10 border-green-500/30',
      text: 'text-green-600 dark:text-green-400',
      title: 'KYC Approved',
      body: 'Your identity has been verified. You can now play battles.',
    },
    pending: {
      icon: Clock,
      bg: 'bg-amber-400/10 border-amber-400/30',
      text: 'text-amber-600 dark:text-amber-400',
      title: 'Under Review',
      body: 'Your documents are being reviewed. This usually takes up to 24 hours.',
    },
    rejected: {
      icon: XCircle,
      bg: 'bg-destructive/10 border-destructive/30',
      text: 'text-destructive',
      title: 'KYC Rejected',
      body: adminNote || 'Your submission was rejected. Please re-submit with valid documents.',
    },
  };
  const c = config[status];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-4 ${c.bg}`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${c.text}`} />
      <div>
        <p className={`font-bold text-sm ${c.text}`}>{c.title}</p>
        <p className={`text-xs mt-0.5 ${c.text} opacity-80`}>{c.body}</p>
      </div>
    </div>
  );
};

const ImageUploadField = ({ label, fieldName, preview, onChange }) => (
  <div>
    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</p>
    <label className="block cursor-pointer">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => onChange(fieldName, e.target.files?.[0])}
      />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border aspect-video bg-secondary/20">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
            <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/50">Change</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/10 hover:bg-secondary/20 transition-colors aspect-video">
          <Upload className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Tap to upload</span>
        </div>
      )}
    </label>
  </div>
);

const KYCPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [kycData, setKycData]   = useState(null);   // current KYC record from server
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  // Form state
  const [docType,   setDocType]   = useState('aadhar');
  const [docNumber, setDocNumber] = useState('');
  const [files, setFiles]         = useState({ frontImage: null, backImage: null, selfie: null });
  const [previews, setPreviews]   = useState({ frontImage: '', backImage: '', selfie: '' });

  useEffect(() => {
    api.get('/kyc/status')
      .then(res => {
        setKycData(res.data);
        if (res.data.docType) setDocType(res.data.docType);
        if (res.data.docNumber) setDocNumber(res.data.docNumber);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFile = (field, file) => {
    if (!file) return;
    setFiles(f => ({ ...f, [field]: file }));
    const url = URL.createObjectURL(file);
    setPreviews(p => ({ ...p, [field]: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!docNumber.trim()) return setError('Document number is required.');
    if (!files.frontImage) return setError('Front image of your document is required.');

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('docType', docType);
      form.append('docNumber', docNumber.trim());
      if (files.frontImage) form.append('frontImage', files.frontImage);
      if (files.backImage)  form.append('backImage',  files.backImage);
      if (files.selfie)     form.append('selfie',     files.selfie);

      await api.post('/kyc/submit', form);
      setKycData({ status: 'pending', docType, docNumber });
      setSuccess(true);
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const showForm = !kycData || kycData.status === 'not_submitted' || kycData.status === 'rejected';

  return (
    <div className="p-4 md:p-10 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">KYC Verification</h1>
          <p className="text-xs text-muted-foreground">Required to play battles</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* Status banner */}
          {kycData?.status && kycData.status !== 'not_submitted' && (
            <StatusBanner status={kycData.status} adminNote={kycData.adminNote} />
          )}

          {/* Approved: go play button */}
          {kycData?.status === 'approved' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/battle')}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #c0392b 0%, #7b1a1a 100%)' }}
            >
              <FileText className="w-5 h-5" /> Go to Battle
            </motion.button>
          )}

          {/* Pending: no form */}
          {kycData?.status === 'pending' && !success && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <p>Check back later or contact support if it takes too long.</p>
            </div>
          )}

          {/* Success message after just submitting */}
          {success && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="font-bold text-foreground">Documents Submitted!</p>
              <p className="text-sm text-muted-foreground">
                Admin will review and approve your KYC within 24 hours.
              </p>
            </div>
          )}

          {/* KYC submission form */}
          {showForm && !success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
                <h2 className="font-semibold text-sm text-foreground">Submit Your Documents</h2>

                {/* Document type */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Document Type</label>
                  <div className="relative">
                    <select
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-border bg-secondary/20 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                    >
                      {DOC_TYPES.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Document number */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Document Number</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={e => setDocNumber(e.target.value)}
                    placeholder="Enter document number"
                    className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Image uploads */}
                <ImageUploadField
                  label="Front of Document *"
                  fieldName="frontImage"
                  preview={previews.frontImage}
                  onChange={handleFile}
                />
                <ImageUploadField
                  label="Back of Document (if applicable)"
                  fieldName="backImage"
                  preview={previews.backImage}
                  onChange={handleFile}
                />
                <ImageUploadField
                  label="Selfie with Document"
                  fieldName="selfie"
                  preview={previews.selfie}
                  onChange={handleFile}
                />
              </div>

              {error && (
                <p className="text-xs text-destructive border border-destructive/20 bg-destructive/10 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #c0392b 0%, #7b1a1a 100%)' }}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                {submitting ? 'Submitting…' : kycData?.status === 'rejected' ? 'Re-submit Documents' : 'Submit for Verification'}
              </motion.button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default KYCPage;
