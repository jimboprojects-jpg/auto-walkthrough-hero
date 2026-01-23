import { motion } from "framer-motion";
import { DeviceFrame } from "./DeviceFrame";
import { Download, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MockupPreviewProps {
  screenshots: {
    mobile?: string;
    tablet?: string;
    laptop?: string;
    desktop?: string;
  };
  isRecording?: boolean;
}

export const MockupPreview = ({ screenshots, isRecording }: MockupPreviewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Device Mockups</h2>
        </div>
        
        <Button
          variant="outline"
          className="rounded-xl border-primary/30 hover:border-primary hover:bg-primary/10"
        >
          <Download className="w-4 h-4 mr-2" />
          Download All
        </Button>
      </div>

      {/* Device grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end justify-items-center">
        <DeviceFrame
          type="mobile"
          screenshot={screenshots.mobile}
          isRecording={isRecording}
        />
        <DeviceFrame
          type="tablet"
          screenshot={screenshots.tablet}
          isRecording={isRecording}
        />
        <DeviceFrame
          type="laptop"
          screenshot={screenshots.laptop}
          isRecording={isRecording}
        />
        <DeviceFrame
          type="desktop"
          screenshot={screenshots.desktop}
          isRecording={isRecording}
        />
      </div>
    </motion.div>
  );
};
