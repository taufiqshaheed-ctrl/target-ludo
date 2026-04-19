import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Mail, HelpCircle } from 'lucide-react';
import BottomNav from '../components/UI/BottomNav';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';

const faqs = [
  {
    q: 'How do I start a game?',
    a: 'Tap "New Game" on the home screen, choose the number of players (2, 3, or 4), assign human or AI to each slot, and hit "Start Game". You can also tap "Quick Play" for an instant 2-player match.',
  },
  {
    q: 'What are the rules of Ludo?',
    a: 'Each player has 4 tokens in their home base. Roll a 6 to bring a token onto the board. Tokens move clockwise along the track. Land on an opponent\'s token to send it back home. Safe squares (marked with a star) protect tokens from capture. Get all 4 tokens to the center to win. Rolling a 6 grants an extra turn.',
  },
  {
    q: 'How do I move my tokens?',
    a: 'After rolling the dice, tokens with valid moves will glow. Tap the token you want to move. If only one token can move, it moves automatically. On desktop you can also click the token.',
  },
  {
    q: 'What happens when I roll a 6?',
    a: 'Rolling a 6 lets you either bring a new token out of your home base or move an existing token 6 steps. You also get a bonus roll. Three consecutive 6s will forfeit your turn.',
  },
  {
    q: 'What are safe squares?',
    a: 'Safe squares are marked with a ★ symbol on the board. Tokens on a safe square cannot be captured by opponents. Each player\'s starting square is also a safe square.',
  },
  {
    q: 'What is a blockade?',
    a: 'When two of your tokens occupy the same square, they form a blockade. Opponent tokens cannot pass through or land on a blockade.',
  },
  {
    q: 'How does capturing work?',
    a: 'If your token lands on a square occupied by an opponent\'s token (and it\'s not a safe square), the opponent\'s token is sent back to their home base and must re-enter the board with a 6.',
  },
  {
    q: 'How do I win the game?',
    a: 'Move all 4 of your tokens from your home base, around the board, up your home column, and into the center finish area. The first player to finish all 4 tokens wins!',
  },
  {
    q: 'Can I play against the computer?',
    a: 'Yes! During game setup, toggle any player slot to "AI" and the computer will play that color. The AI uses smart strategy — prioritizing finishing, capturing, and entering new tokens.',
  },
  {
    q: 'How do I add money to my wallet?',
    a: 'Go to Account → Wallet and tap "Add Money". Choose a preset amount or enter a custom amount, then complete payment via your preferred method. Funds appear instantly.',
  },
  {
    q: 'How do referrals work?',
    a: 'Go to Account → Refer & Earn to find your unique referral code. Share it with friends — when they sign up and play their first game, you both earn bonus coins.',
  },
  {
    q: 'How do I withdraw my winnings?',
    a: 'Navigate to Account → Wallet and tap "Withdraw". Enter the amount and your payment details. Withdrawals are processed within 24–48 hours. Minimum withdrawal amount applies.',
  },
  {
    q: 'Is my account data safe?',
    a: 'Yes. We use industry-standard encryption to protect your data. Read our Privacy Policy for full details on how your information is stored and used.',
  },
  {
    q: 'How do I report a player?',
    a: 'If you encounter unfair play or misconduct, visit Account → Support → Email Us with the player\'s name and details. Our team reviews every report within 24 hours.',
  },
  {
    q: 'Can I change my username or avatar?',
    a: 'Yes! Go to Account → Profile to update your display name, avatar, email, and phone number at any time.',
  },
];

const SupportPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-xl font-bold">Support</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <motion.button whileTap={{ scale: 0.97 }} className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-2">
            <MessageCircle className="w-8 h-8 text-primary" />
            <span className="text-sm font-semibold text-foreground">Live Chat</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-2">
            <Mail className="w-8 h-8 text-primary" />
            <span className="text-sm font-semibold text-foreground">Email Us</span>
          </motion.button>
        </div>

        <h2 className="font-semibold mb-3 text-foreground flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" /> FAQs
        </h2>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-xl px-4 overflow-hidden">
              <AccordionTrigger className="text-sm text-foreground text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <BottomNav />
    </div>
  );
};

export default SupportPage;
