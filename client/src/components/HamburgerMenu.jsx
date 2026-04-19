import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, UserCircle, Gamepad2, Wallet, History, Headphones, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { label: { en: 'Profile', hi: 'प्रोफ़ाइल' }, icon: UserCircle, path: '/profile' },
  { label: { en: 'Play', hi: 'खेलें' }, icon: Gamepad2, path: '/ludo-home' },
  { label: { en: 'Wallet', hi: 'वॉलेट' }, icon: Wallet, path: '/wallet' },
  { label: { en: 'History', hi: 'इतिहास' }, icon: History, path: '/history' },
  { label: { en: 'Support', hi: 'सहायता' }, icon: Headphones, path: '/support' },
  { label: { en: 'Legal Terms', hi: 'कानूनी शर्तें' }, icon: FileText, path: '/legal' },
];

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNav = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="fixed top-0 right-0 z-50 h-full w-72 bg-card border-l border-border flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Language Toggle */}
              <div className="px-5 py-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  {lang === 'en' ? 'Language' : 'भाषा'}
                </p>
                <div className="flex items-center bg-secondary/40 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setLang('en')}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      lang === 'en'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLang('hi')}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      lang === 'hi'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    हिंदी
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.path}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleNav(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.label[lang]}
                  </motion.button>
                ))}
              </nav>

              {/* Logout */}
              <div className="px-3 py-4 border-t border-border">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  {lang === 'en' ? 'Logout' : 'लॉग आउट'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HamburgerMenu;
