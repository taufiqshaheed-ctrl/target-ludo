import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import api from '../services/api';
import KYCModal from '../components/KYCModal';

const LudoHome = () => {
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState('');
  const [carouselImages, setCarouselImages] = useState([]);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const autoplay = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);

  useEffect(() => {
    api.get('/admin/announcement')
      .then(res => setAnnouncement(res.data.message || ''))
      .catch(() => {});
    api.get('/admin/carousel')
      .then(res => setCarouselImages(res.data.images || []))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {announcement && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-3 rounded-2xl px-5 py-4"
          style={{ backgroundColor: '#FEF08A', color: '#713F12' }}
        >
          <Megaphone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#A16207' }} />
          <p className="text-sm font-medium leading-snug">{announcement}</p>
        </motion.div>
      )}

      {/* Carousel */}
      {carouselImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4 relative"
        >
          <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
            <div className="flex">
              {carouselImages.map(img => (
                <div key={img._id} className="flex-none w-full h-36">
                  <img src={img.url} alt="banner" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          {carouselImages.length > 1 && (
            <>
              <button
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={async () => {
          try {
            const res = await api.get('/kyc/status');
            if (res.data.status === 'approved') {
              navigate('/battle');
            } else {
              setKycModalOpen(true);
            }
          } catch {
            setKycModalOpen(true);
          }
        }}
        className="glass-card overflow-hidden rounded-2xl cursor-pointer"
      >
        <img
          src="/homeludopic.png"
          alt="Target Ludo"
          className="w-full object-cover"
        />
      </motion.div>
      <KYCModal
        open={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        onApproved={() => { setKycModalOpen(false); navigate('/battle'); }}
      />
    </div>
  );
};

export default LudoHome;
