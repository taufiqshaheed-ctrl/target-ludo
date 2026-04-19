import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '../components/ui/BottomNav';

const TermsOfService = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section><h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h2><p>By accessing or using Ludo Master, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">2. Eligibility</h2><p>You must be at least 13 years old to use this service. By using the app, you represent that you meet this age requirement.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">3. User Accounts</h2><p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">4. Fair Play</h2><p>Users must not use any cheats, bots, or exploits. Any form of manipulation of game outcomes is strictly prohibited and may result in account suspension.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">5. Virtual Currency</h2><p>Any in-app coins or credits are virtual items with no real-world monetary value. They cannot be exchanged, transferred, or refunded except as described in our Refund Policy.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">6. Termination</h2><p>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">7. Changes to Terms</h2><p>We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.</p></section>
          <p className="text-xs text-muted-foreground pt-4">Last updated: March 31, 2026</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default TermsOfService;
