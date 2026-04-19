import { useNavigate } from 'react-router-dom';
import { Wallet, Users } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './ui/BottomNav';
import HamburgerMenu from './HamburgerMenu';
import { useAuth } from '../context/AuthContext';

// Wraps all protected pages with sidebar (desktop) + bottom nav (mobile)
const Layout = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />

      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <img src="/Target_ludo_logo-removebg-preview.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-base text-foreground">Target Ludo</span>
        </div>

        {/* Right-side pills */}
        <div className="flex items-center gap-2">
          {/* Wallet pill */}
          <button
            onClick={() => navigate('/add-money')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #7b1a1a 0%, #3d0a0a 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Wallet className="w-4 h-4" />
            <span>{user?.coins ?? 0}</span>
            <span className="text-white/70 font-bold">+</span>
          </button>

          {/* Referral pill */}
          <button
            onClick={() => navigate('/referral')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #7b1a1a 0%, #3d0a0a 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Users className="w-4 h-4" />
            <span>{user?.referralCount ?? 0}</span>
          </button>

          <HamburgerMenu />
        </div>
      </header>

      {/* md:ml-64 pushes content right of sidebar on desktop */}
      <main className="md:ml-64 min-h-screen pt-14 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
