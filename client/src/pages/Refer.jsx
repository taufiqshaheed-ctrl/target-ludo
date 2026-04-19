import { motion } from 'framer-motion';
import { Copy, Share2, Gift } from 'lucide-react';
import { useState } from 'react';

const Refer = () => {
  const [copied, setCopied] = useState(false);
  const code = 'LUDO2026';

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Refer & Earn</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invite Friends</h2>
          <p className="text-muted-foreground text-sm">
            Share your referral code and earn <span className="text-primary font-semibold">₹100</span> for each friend who joins!
          </p>
        </motion.div>

        {/* Code & Share */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 flex flex-col justify-between gap-6"
        >
          <div>
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Your Referral Code</p>
            <div className="flex items-center justify-between bg-background/50 rounded-xl px-5 py-4 border border-border">
              <span className="text-2xl font-black tracking-widest text-primary">{code}</span>
              <motion.button whileTap={{ scale: 0.9 }} onClick={copyCode} className="p-2 rounded-lg bg-secondary">
                <Copy className="w-5 h-5 text-foreground" />
              </motion.button>
            </div>
            {copied && <p className="text-xs text-green-500 mt-2">Copied to clipboard!</p>}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" /> Share with Friends
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Refer;
