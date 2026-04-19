import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Wallet, History, User, Headphones, Gift, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const quickLinks = [
  { label: 'My Wallet', icon: Wallet, path: '/wallet', color: '#3A86FF' },
  { label: 'History', icon: History, path: '/history', color: '#2DC653' },
  { label: 'Profile', icon: User, path: '/profile', color: '#F4D03F' },
  { label: 'Refer & Earn', icon: Gift, path: '/refer', color: '#E63946' },
  { label: 'Support', icon: Headphones, path: '/support', color: '#A855F7' },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    api.get('/admin/announcement')
      .then(res => setAnnouncement(res.data.message || ''))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-muted-foreground text-sm">Welcome back,</p>
        <h1 className="text-3xl font-bold">{user?.fullName || 'User'}</h1>
      </motion.div>

      {/* Admin Announcement */}
      {announcement && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex items-start gap-3 rounded-2xl px-5 py-4"
          style={{ backgroundColor: '#FEF08A', color: '#713F12' }}
        >
          <Megaphone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#A16207' }} />
          <p className="text-sm font-medium leading-snug">{announcement}</p>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-1 glass-card p-6 cursor-pointer flex flex-col justify-between"
          onClick={() => navigate('/wallet')}
        >
          <div>
            <p className="text-muted-foreground text-sm mb-1">Wallet Balance</p>
            <h2 className="text-4xl font-black text-primary mb-6">
              ₹{user?.coins?.toFixed(2) ?? '0.00'}
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base"
            onClick={(e) => { e.stopPropagation(); navigate('/wallet'); }}
          >
            Add Money
          </motion.button>
        </motion.div>

        {/* Quick Links */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((item, i) => (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(item.path)}
              className="glass-card p-5 flex flex-col items-start gap-3 text-left"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: item.color + '22' }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span className="font-semibold text-sm">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
