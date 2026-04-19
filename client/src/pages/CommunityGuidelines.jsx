import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '../components/UI/BottomNav';

const CommunityGuidelines = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-xl font-bold">Community Guidelines</h1>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section><h2 className="text-base font-semibold text-foreground mb-2">1. Respect All Players</h2><p>Treat everyone with kindness and respect. Harassment, hate speech, bullying, or discrimination of any kind will not be tolerated.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">2. Play Fair</h2><p>Do not use cheats, exploits, or third-party tools to gain an unfair advantage. Play the game as intended.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">3. No Spamming</h2><p>Avoid sending repetitive messages, unsolicited promotions, or irrelevant content in chat or community spaces.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">4. Protect Privacy</h2><p>Do not share personal information of other players. Respect everyone's right to privacy and anonymity.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">5. Report Violations</h2><p>If you encounter behavior that violates these guidelines, use the in-app report feature or contact our support team.</p></section>
          <section><h2 className="text-base font-semibold text-foreground mb-2">6. Consequences</h2><p>Violations may result in warnings, temporary mutes, or permanent account bans depending on severity and frequency.</p></section>
          <p className="text-xs text-muted-foreground pt-4">Last updated: March 31, 2026</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default CommunityGuidelines;
