"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface XpToastProps {
  amount: number | null;
  onComplete?: () => void;
}

export function XpToast({ amount, onComplete }: XpToastProps) {
  useEffect(() => {
    if (amount && amount > 0) {
      const timer = setTimeout(() => onComplete?.(), 1500);
      return () => clearTimeout(timer);
    }
  }, [amount, onComplete]);

  return (
    <AnimatePresence>
      {amount && amount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-8 right-8 bg-accent text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg z-50"
        >
          +{amount} XP!
        </motion.div>
      )}
    </AnimatePresence>
  );
}
