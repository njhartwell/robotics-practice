"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LEVELS } from "@/lib/gamification/levels";

interface LevelUpModalProps {
  newLevel: number | null;
  onClose: () => void;
}

export function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  if (newLevel === null) return null;
  const levelDef = LEVELS[newLevel];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="bg-surface rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Level Up!</h2>
          <div className="text-5xl font-bold text-accent mb-2">
            {levelDef.level}
          </div>
          <p className="text-lg font-semibold text-primary mb-4">
            {levelDef.name}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors"
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
