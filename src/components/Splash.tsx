import { useEffect } from "react";
import { motion } from "motion/react";
import { StoreSettings } from "../types.js";

interface SplashProps {
  storeSettings: StoreSettings;
  onComplete: () => void;
}

export default function Splash({ storeSettings, onComplete }: SplashProps) {
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
            alt={`${storeSettings.name} Logo`} 
            className="w-64 md:w-80 h-auto object-contain drop-shadow-sm" 
            src={storeSettings.logoUrl}
          />
          <h2 className="font-extrabold text-lg text-[#003e7a] tracking-tight">{storeSettings.name}</h2>
          
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
