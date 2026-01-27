import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeviceColorTheme, getThemeColors } from "./DeviceColorPicker";
import { convertWebMToMP4, isFFmpegSupported, getBestVideoFormat } from "@/lib/videoConverter";
import { useToast } from "@/hooks/use-toast";

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoBlob: Blob | null;
  deviceType: "mobile" | "tablet" | "laptop" | "desktop";
  colorTheme: DeviceColorTheme;
}

type DeviceConfig = {
  width: number;
  height: number;
  bezel: number;
  borderRadius: number;
  notch: boolean;
  hasBase?: boolean;
  hasStand?: boolean;
};

const deviceConfigs: Record<string, DeviceConfig> = {
  mobile: {
    width: 220,
    height: 440,
    bezel: 14,
    borderRadius: 28,
    notch: true,
  },
  tablet: {
    width: 340,
    height: 460,
    bezel: 18,
    borderRadius: 24,
    notch: false,
  },
  laptop: {
    width: 500,
    height: 320,
    bezel: 14,
    borderRadius: 14,
    notch: false,
    hasBase: true,
  },
  desktop: {
    width: 580,
    height: 360,
    bezel: 18,
    borderRadius: 10,
    notch: false,
    hasStand: true,
  },
};

export const VideoPreviewModal = ({
  isOpen,
  onClose,
  videoBlob,
  deviceType,
  colorTheme,
}: VideoPreviewModalProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const config = deviceConfigs[deviceType];
  const themeColors = getThemeColors(colorTheme);

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isOpen, videoUrl]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = async () => {
    if (!videoBlob) return;

    setIsDownloading(true);
    const format = getBestVideoFormat();

    try {
      let downloadBlob = videoBlob;
      let extension = format.extension;

      if (format.canConvertToMP4) {
        toast({
          title: "Converting to MP4...",
          description: "This may take a moment...",
        });
        downloadBlob = await convertWebMToMP4(videoBlob);
        extension = "mp4";
      }

      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mockup-${deviceType}-${colorTheme}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `${deviceType} video downloading as ${extension.toUpperCase()}...`,
      });
    } catch (error) {
      console.error("Download error:", error);
      
      // Fallback to WebM download
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mockup-${deviceType}-${colorTheme}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded as WebM",
        description: "MP4 conversion failed, downloaded as WebM instead.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || !videoBlob) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative flex flex-col items-center gap-6 p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full hover:bg-destructive/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Device Frame with Video */}
          <div className="relative">
            {/* Device frame */}
            <div
              className="relative device-shadow"
              style={{
                width: config.width,
                height: config.height,
                padding: config.bezel,
                borderRadius: config.borderRadius,
                background: themeColors.gradient,
              }}
            >
              {/* Notch for mobile */}
              {config.notch && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-10" />
              )}

              {/* Screen area with video */}
              <div
                className="relative w-full h-full overflow-hidden bg-black"
                style={{
                  borderRadius: config.borderRadius - 8,
                }}
              >
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    muted
                    onClick={togglePlayPause}
                  />
                )}

                {/* Play/Pause overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="w-12 h-12 text-white" />
                  ) : (
                    <Play className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>

              {/* Home button for tablet */}
              {deviceType === "tablet" && (
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2"
                  style={{ borderColor: themeColors.border }}
                />
              )}
            </div>

            {/* Laptop base */}
            {config.hasBase && (
              <div
                className="mx-auto"
                style={{
                  width: config.width + 80,
                  height: 20,
                  background: themeColors.gradient,
                  borderRadius: "0 0 10px 10px",
                  marginTop: -4,
                }}
              >
                <div
                  className="mx-auto"
                  style={{
                    width: 100,
                    height: 5,
                    background: themeColors.accent,
                    borderRadius: "0 0 5px 5px",
                  }}
                />
              </div>
            )}

            {/* Desktop stand */}
            {config.hasStand && (
              <div className="flex flex-col items-center -mt-1">
                <div
                  style={{
                    width: 70,
                    height: 70,
                    background: themeColors.gradient,
                  }}
                />
                <div
                  style={{
                    width: 140,
                    height: 14,
                    background: themeColors.gradient,
                    borderRadius: "0 0 8px 8px",
                  }}
                />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium capitalize">{deviceType} Preview</span>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="rounded-xl"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download {isFFmpegSupported() ? "MP4" : "Video"}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
