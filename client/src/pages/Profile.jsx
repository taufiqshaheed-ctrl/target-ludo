import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, ShieldCheck, Calendar, LogOut,
  AtSign, CheckCircle2, XCircle, Loader2, Pencil, Check, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const [kycStatus, setKycStatus] = useState(null);

  // Username state
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameCheck, setUsernameCheck] = useState(null); // { available, message }
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    api.get('/kyc/status')
      .then(res => setKycStatus(res.data.status))
      .catch(() => setKycStatus(null));
  }, []);

  const startEdit = () => {
    setUsernameInput(user?.username || '');
    setUsernameCheck(null);
    setEditingUsername(true);
  };

  const cancelEdit = () => {
    setEditingUsername(false);
    setUsernameCheck(null);
  };

  const handleUsernameChange = (val) => {
    setUsernameInput(val);
    setUsernameCheck(null);
    clearTimeout(debounceRef.current);
    if (!val.trim()) return;
    debounceRef.current = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const res = await api.get('/profile/username/check', { params: { username: val } });
        setUsernameCheck(res.data);
      } catch {
        setUsernameCheck(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
  };

  const saveUsername = async () => {
    if (!usernameCheck?.available) return;
    setUsernameSaving(true);
    try {
      const res = await api.patch('/profile/username', { username: usernameInput });
      setUser(res.data);
      setEditingUsername(false);
      setUsernameCheck(null);
    } catch (err) {
      setUsernameCheck({ available: false, message: err.response?.data?.message || 'Failed to save' });
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  const details = [
    { icon: User, label: 'Full Name', value: user?.fullName || '—' },
    { icon: Mail, label: 'Email', value: user?.email || '—' },
    { icon: Phone, label: 'Phone', value: user?.phone || 'Not added' },
    { icon: ShieldCheck, label: 'Role', value: user?.role === 'admin' ? 'Admin' : 'User' },
    { icon: Calendar, label: 'Member Since', value: memberSince },
  ];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="md:col-span-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 flex flex-col items-center text-center"
          >
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                {initials}
              </div>
              {kycStatus === 'approved' && (
                <div
                  title="KYC Verified"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-card"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold">{user?.fullName || '—'}</h2>

            {/* Username display */}
            {user?.username && (
              <p className="text-primary text-sm font-medium mt-0.5">@{user.username}</p>
            )}

            <p className="text-muted-foreground text-sm mt-1 break-all">{user?.email || '—'}</p>

            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary capitalize">
                {user?.role || 'user'}
              </span>
              {kycStatus === 'approved' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> KYC Verified
                </span>
              )}
              {kycStatus === 'pending' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> KYC Pending
                </span>
              )}
              {kycStatus === 'rejected' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-destructive/15 text-destructive flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> KYC Rejected
                </span>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleLogout}
              className="mt-6 w-full py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm border border-destructive/20 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Logout
            </motion.button>
          </motion.div>
        </div>

        {/* Details card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 glass-card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Account Details</h3>
          </div>

          {/* Username row */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-border">
            <AtSign className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground text-sm block sm:hidden mb-1">Username</span>
              {editingUsername ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm hidden sm:block mr-1">Username</span>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={usernameInput}
                        onChange={e => handleUsernameChange(e.target.value)}
                        placeholder="e.g. coolplayer99"
                        maxLength={20}
                        className="flex-1 rounded-xl bg-secondary/30 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground font-mono min-w-0"
                      />
                      {/* Check indicator */}
                      <div className="flex-shrink-0 w-5">
                        {usernameChecking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {!usernameChecking && usernameCheck?.available === true && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {!usernameChecking && usernameCheck?.available === false && <XCircle className="w-4 h-4 text-destructive" />}
                      </div>
                      {/* Save / Cancel */}
                      <button
                        onClick={saveUsername}
                        disabled={!usernameCheck?.available || usernameSaving}
                        className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
                      >
                        {usernameSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={cancelEdit} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {usernameCheck && (
                    <p className={`text-xs pl-1 ${usernameCheck.available ? 'text-green-500' : 'text-destructive'}`}>
                      {usernameCheck.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground pl-1">3–20 chars · letters, numbers, underscores</p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 flex-1 min-w-0">
                    <span className="text-muted-foreground text-sm hidden sm:block sm:w-32 flex-shrink-0">Username</span>
                    <span className="text-foreground text-sm font-mono font-medium sm:text-right truncate">
                      {user?.username ? `@${user.username}` : <span className="text-muted-foreground not-italic font-sans">Not set</span>}
                    </span>
                  </div>
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex-shrink-0"
                  >
                    <Pencil className="w-3 h-3" /> {user?.username ? 'Change' : 'Set'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Static details */}
          {details.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-4 px-6 py-4 ${i < details.length - 1 ? 'border-b border-border' : ''}`}
            >
              <item.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-muted-foreground text-sm">{item.label}</span>
                <span className="text-foreground text-sm font-medium break-all sm:text-right">{item.value}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
