import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  status: string;
}

export const ProgressBar = ({ progress, status }: ProgressBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass rounded-2xl p-6 glow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{status}</span>
        <span className="text-sm font-mono text-primary">{Math.round(progress)}%</span>
      </div>
      
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: "var(--gradient-primary)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }}
        />
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span className={progress >= 0 ? "text-primary" : ""}>Initializing</span>
        <span className={progress >= 25 ? "text-primary" : ""}>Capturing</span>
        <span className={progress >= 50 ? "text-primary" : ""}>Processing</span>
        <span className={progress >= 75 ? "text-primary" : ""}>Rendering</span>
        <span className={progress >= 100 ? "text-primary" : ""}>Complete</span>
      </div>
    </motion.div>
  );
};
