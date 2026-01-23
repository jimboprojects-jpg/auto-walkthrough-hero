import { motion } from "framer-motion";
import { Play, Pause, Square, RotateCcw, Video, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const RecordingControls = ({
  isRecording,
  isPaused,
  duration,
  onStart,
  onPause,
  onStop,
  onReset,
}: RecordingControlsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-2xl p-6 glow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
          <span className="text-sm font-medium text-muted-foreground">
            {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-lg">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <Button
            onClick={onStart}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        ) : (
          <>
            <Button
              onClick={onPause}
              size="lg"
              variant="secondary"
              className="rounded-xl transition-all duration-300 hover:scale-105"
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              )}
            </Button>
            
            <Button
              onClick={onStop}
              size="lg"
              variant="destructive"
              className="rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </>
        )}
        
        {duration > 0 && !isRecording && (
          <Button
            onClick={onReset}
            size="lg"
            variant="outline"
            className="rounded-xl transition-all duration-300 hover:scale-105"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Video className="w-4 h-4 text-primary" />
          <span>Capturing navigation across all devices...</span>
        </motion.div>
      )}
    </motion.div>
  );
};
