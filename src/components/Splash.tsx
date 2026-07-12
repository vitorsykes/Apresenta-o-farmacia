import { useEffect } from "react";
import { motion } from "motion/react";

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="bg-[#fbf9f8] h-screen w-screen flex flex-col items-center justify-center m-0 p-0 overflow-hidden relative select-none">
      <main className="flex-1 flex flex-col items-center justify-center w-full h-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="flex flex-col items-center justify-center space-y-6"
        >
          <img 
            alt="Vitalidade Farmácia Logo" 
            className="w-64 md:w-80 h-auto object-contain drop-shadow-sm" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6i7zlH0ucNVZqyQTI4kAbRn88Nay0-Xb7uNMDNj4gBGdRRYCZndzvuuDZq_difdf81jjJLBsQZwY8vZH61S28d91z2xvNEH5T9WQfc3Xr1o1Z8qPHEGLswjYnYaMNEs0Il7E8dTkpIQ8TjacNq1SkgxtAeECAdDHZZkJcusluJU7xkUw6R3-kd1BV1NWma9nLv5nASikysOsVscfpQ-L22Sm3iu2Gi8oPuu4bJAfUf8Bq5QluPkB0"
          />
          
          <div className="pt-8 flex space-x-2 items-center justify-center">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              className="w-3 h-3 rounded-full bg-[#003e7a]"
            />
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.15 }}
              className="w-3 h-3 rounded-full bg-[#003e7a]"
            />
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
              className="w-3 h-3 rounded-full bg-[#003e7a]"
            />
          </div>
        </motion.div>
      </main>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-[#d5e3ff]/20 rounded-full blur-[120px] absolute" />
      </div>

      <div className="absolute bottom-6 w-full text-center z-10 pointer-events-none">
        <p className="font-sans text-sm text-[#424751]/50 font-medium tracking-wide">v2.4.1</p>
      </div>
    </div>
  );
}
