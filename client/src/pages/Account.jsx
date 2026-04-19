import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Wallet, History, Headphones, Languages, FileText } from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { label: 'My Profile', icon: User, path: '/profile', color: 'bg-muted' },
  { label: 'My Wallet', icon: Wallet, path: '/wallet', color: 'bg-primary/20' },
  { label: 'History', icon: History, path: '/history', color: 'bg-muted' },
  { label: 'Support', icon: Headphones, path: '/support', color: 'bg-primary/20' },
  { label: 'Legal Terms', icon: FileText, path: '/legal', color: 'bg-primary/20' },
];

const Account = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Account</h1>

      <div className="glass-card overflow-hidden">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.98 }}
            whileHover={{ backgroundColor: 'hsl(var(--secondary) / 0.5)' }}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-4 p-5 w-full text-left border-b border-border transition-colors"
          >
            <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-base font-semibold text-foreground">{item.label}</span>
          </motion.button>
        ))}

        {/* Language toggle */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: menuItems.length * 0.05 }}
          className="flex items-center gap-4 p-5"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Languages className="w-5 h-5 text-primary" />
          </div>
          <div className="flex rounded-full border border-primary/40 overflow-hidden">
            <button
              onClick={() => setLang('en')}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${lang === 'en' ? 'bg-primary/30 text-primary' : 'text-muted-foreground'}`}
            >
              English
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${lang === 'hi' ? 'bg-primary/30 text-primary' : 'text-muted-foreground'}`}
            >
              Hindi
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Account;
