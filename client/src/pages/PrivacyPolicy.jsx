import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '../components/ui/BottomNav';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section><h2 className="text-base font-semibold text-foreground mb-2">1. Information We Collect</h2><p>We collect information you provide directly, such as your name, email, and profile details. We also collect usage data including game statistics and device information.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">2. How We Use Your Information</h2><p>Your information is used to provide and improve the game experience, personalize content, communicate updates, and ensure fair play across the platform.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">3. Data Sharing</h2><p>We do not sell your personal data. We may share anonymized, aggregated data with analytics partners to improve our services.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">4. Data Security</h2><p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">5. Cookies & Local Storage</h2><p>We use local storage to save your game progress and preferences. No third-party tracking cookies are used.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">6. Your Rights</h2><p>You may request access to, correction of, or deletion of your personal data at any time by contacting our support team.</p></section>
          <p className="text-xs text-muted-foreground pt-4">Last updated: March 31, 2026</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PrivacyPolicy;
