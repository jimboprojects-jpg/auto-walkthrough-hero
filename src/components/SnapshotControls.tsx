import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SnapshotControlsProps {
  isCapturing: boolean;
  onCapture: () => void;
}

export const SnapshotControls = ({
  isCapturing,
  onCapture,
}: SnapshotControlsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-2xl p-6 glow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Capture device mockup snapshots
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Button
          onClick={onCapture}
          disabled={isCapturing}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
        >
          {isCapturing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Capturing...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Capture Snapshots
            </>
          )}
        </Button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-center text-sm text-muted-foreground"
      >
        Takes PNG snapshots of all device frames
      </motion.p>
    </motion.div>
  );
};
