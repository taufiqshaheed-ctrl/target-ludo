import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '../components/ui/BottomNav';

const RefundPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-xl font-bold">Refund Policy</h1>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section><h2 className="text-base font-semibold text-foreground mb-2">1. Eligibility for Refunds</h2><p>Refunds may be requested within 7 days of purchase for unused virtual currency or premium features. Used items are non-refundable.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">2. How to Request a Refund</h2><p>Contact our support team via the in-app Support page or email us at support@ludomaster.app with your transaction ID and reason for the request.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">3. Processing Time</h2><p>Refund requests are reviewed within 3–5 business days. Approved refunds will be credited to the original payment method within 7–10 business days.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">4. Non-Refundable Items</h2><p>Tournament entry fees, consumed boosters, and promotional credits are non-refundable under any circumstances.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">5. Disputes</h2><p>If you disagree with a refund decision, you may escalate the matter through our support team for further review.</p></section>
          <p className="text-xs text-muted-foreground pt-4">Last updated: March 31, 2026</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default RefundPolicy;
