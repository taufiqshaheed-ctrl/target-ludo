import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wallet, Users, History, UserCircle, LogOut, ShieldCheck, LayoutDashboard, FileText, ArrowLeftRight, Play, IndianRupee, ArrowUpRight, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const pillStyle = {
  background: 'linear-gradient(135deg, #7b1a1a 0%, #3d0a0a 100%)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const userTabs = [
  { label: 'Home', icon: Home, path: '/ludo-home' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/home' },
  { label: 'My Wallet', icon: Wallet, path: '/wallet' },
  { label: 'Refer & Earn', icon: Users, path: '/refer' },
  { label: 'History', icon: History, path: '/history' },
  { label: 'Profile', icon: UserCircle, path: '/profile' },
];

const adminTabs = [
  { label: 'Dashboard',          icon: LayoutDashboard, path: '/admin' },
  { label: 'Users',              icon: Users,           path: '/admin/users' },
  { label: 'Transactions',       icon: ArrowLeftRight,  path: '/admin/transactions' },
  { label: 'KYC Submissions',    icon: FileText,        path: '/admin/kyc' },
  { label: 'Deposit Requests',   icon: IndianRupee,     path: '/admin/deposits' },
  { label: 'Withdrawals',        icon: ArrowUpRight,    path: '/admin/withdrawals' },
  { label: 'Battle Management',  icon: Swords,          path: '/admin/battles' },
  { label: 'Profile',            icon: UserCircle,      path: '/profile' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const tabs = user?.role === 'admin' ? adminTabs : userTabs;

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-card border-r border-border fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <img src="/Target_ludo_logo-removebg-preview.png" alt="Logo" className="w-10 h-10 object-contain" />
        <span className="font-bold text-lg text-foreground">Target Ludo</span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{user?.fullName || 'User'}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
        </div>
        {user?.role === 'admin' && (
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
        )}
      </div>

      {/* Wallet + Referral pills — only for regular users */}
      {user?.role !== 'admin' && (
        <div className="flex gap-2 px-4 py-3 border-b border-border">
          {/* Wallet pill → add money */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/add-money')}
            style={pillStyle}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold"
          >
            <Wallet className="w-4 h-4" />
            <span>₹{(user?.coins ?? 0).toLocaleString('en-IN')}</span>
            <span className="text-white/60 font-bold text-base leading-none">+</span>
          </motion.button>

          {/* Referral pill → refer page */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/refer')}
            style={pillStyle}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold"
          >
            <Users className="w-4 h-4" />
            <span>{user?.referralCount ?? 0}</span>
          </motion.button>
        </div>
      )}

      {/* Play button — only for regular users */}
      {user?.role !== 'admin' && (
        <div className="px-4 py-3 border-b border-border">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => user?.kycStatus === 'approved' ? navigate('/battle') : navigate('/kyc')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white text-base"
            style={{
              background: 'linear-gradient(135deg, #c0392b 0%, #7b1a1a 100%)',
              boxShadow: '0 0 20px 4px rgba(192,57,43,0.35)',
            }}
          >
            <Play className="w-5 h-5 fill-white" />
            PLAY NOW
          </motion.button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {tabs.map((tab) => {
          const active = tab.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(tab.path);
          return (
            <motion.button
              key={tab.path}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(tab.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              {tab.label}
            </motion.button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </motion.button>
      </div>
    </aside>
  );
};

export default Sidebar;
