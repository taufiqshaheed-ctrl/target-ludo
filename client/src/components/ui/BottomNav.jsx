import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wallet, History, UserCircle, LayoutDashboard, IndianRupee, ArrowUpRight, Swords, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const userLeftTabs  = [
  { label: 'Home',    icon: Home,       path: '/ludo-home' },
  { label: 'Wallet',  icon: Wallet,     path: '/wallet'    },
];
const userRightTabs = [
  { label: 'History', icon: History,    path: '/history'   },
  { label: 'Account', icon: UserCircle, path: '/account'   },
];

const adminTabs = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin'              },
  { label: 'Deposits',  icon: IndianRupee,     path: '/admin/deposits'     },
  { label: 'Withdraws', icon: ArrowUpRight,    path: '/admin/withdrawals'  },
  { label: 'Battles',   icon: Swords,          path: '/admin/battles'      },
  { label: 'Profile',   icon: UserCircle,      path: '/profile'            },
];

const NavTab = ({ tab, active, navigate }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={() => navigate(tab.path)}
    className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-semibold transition-colors ${
      active ? 'text-primary' : 'text-muted-foreground'
    }`}
  >
    <tab.icon className="w-5 h-5" />
    <span>{tab.label}</span>
  </motion.button>
);

const BottomNav = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return (
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {adminTabs.map(tab => (
            <NavTab
              key={tab.path}
              tab={tab}
              active={location.pathname === tab.path}
              navigate={navigate}
            />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="relative flex items-center h-14 max-w-lg mx-auto">

        {/* Left tabs */}
        {userLeftTabs.map(tab => (
          <NavTab
            key={tab.path}
            tab={tab}
            active={location.pathname === tab.path}
            navigate={navigate}
          />
        ))}

        {/* Centre Play button — floats above the bar */}
        <div className="flex-1 flex items-center justify-center relative">
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => user?.kycStatus === 'approved' ? navigate('/battle') : navigate('/kyc')}
            className="absolute -top-6 flex flex-col items-center gap-0.5"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #c0392b 0%, #7b1a1a 100%)',
                boxShadow: '0 0 18px 4px rgba(192,57,43,0.45)',
              }}
            >
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-[10px] font-bold text-primary leading-none mt-0.5">PLAY</span>
          </motion.button>
        </div>

        {/* Right tabs */}
        {userRightTabs.map(tab => (
          <NavTab
            key={tab.path}
            tab={tab}
            active={location.pathname === tab.path}
            navigate={navigate}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
