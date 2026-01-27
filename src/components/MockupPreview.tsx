import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DeviceFrame } from "./DeviceFrame";
import { DeviceColorPicker, DeviceColorTheme } from "./DeviceColorPicker";
import { Download, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { convertWebMToMP4, isFFmpegSupported } from "@/lib/videoConverter";

interface MockupPreviewProps {
  screenshots: {
    mobile?: string;
    tablet?: string;
    laptop?: string;
    desktop?: string;
  };
  navigationFrames?: string[];
  isRecording?: boolean;
  isLoading?: boolean;
  onRecordingComplete?: (videos: Record<string, Blob>) => void;
}

export interface MockupPreviewHandle {
  startVideoRecording: () => void;
  stopVideoRecording: () => Promise<Record<string, Blob>>;
}

export const MockupPreview = forwardRef<MockupPreviewHandle, MockupPreviewProps>(
  ({ screenshots, navigationFrames = [], isRecording, isLoading, onRecordingComplete }, ref) => {
    const { toast } = useToast();
    const [colorTheme, setColorTheme] = useState<DeviceColorTheme>("space-gray");
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [recordedVideos, setRecordedVideos] = useState<Record<string, Blob>>({});
    const [isConvertingAll, setIsConvertingAll] = useState(false);
    const [conversionProgress, setConversionProgress] = useState(0);

    const deviceRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const mediaRecordersRef = useRef<Record<string, MediaRecorder>>({});
    const chunksRef = useRef<Record<string, Blob[]>>({});
    const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const frameCapturingRef = useRef<boolean>(false);
    const captureIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

    // Animation through navigation frames - synchronized with video capture
    useEffect(() => {
      if (isVideoRecording && navigationFrames.length > 1) {
        // Change frame every 3 seconds to give time for proper capture
        animationIntervalRef.current = setInterval(() => {
          setCurrentFrameIndex((prev) => {
            const nextIndex = prev + 1;
            if (nextIndex >= navigationFrames.length) {
              return 0; // Loop back
            }
            return nextIndex;
          });
        }, 3000);

        return () => {
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
          }
        };
      }
    }, [isVideoRecording, navigationFrames.length]);

    // Get current screenshot based on navigation frames or static screenshots
    const getCurrentScreenshot = (type: string) => {
      if (navigationFrames.length > 0 && (isVideoRecording || isRecording)) {
        return navigationFrames[currentFrameIndex];
      }
      return screenshots[type as keyof typeof screenshots];
    };

    const startVideoRecording = async () => {
      const deviceTypes = ["mobile", "tablet", "laptop", "desktop"];
      chunksRef.current = {};
      mediaRecordersRef.current = {};
      captureIntervalsRef.current = {};
      frameCapturingRef.current = true;

      // Start recording for each device
      for (const type of deviceTypes) {
        const element = deviceRefs.current[type];
        if (!element) continue;

        try {
          // Create a canvas to capture the device frame
          const canvas = document.createElement("canvas");
          const rect = element.getBoundingClientRect();
          canvas.width = Math.max(rect.width * 2, 640);
          canvas.height = Math.max(rect.height * 2, 480);

          chunksRef.current[type] = [];

          const ctx = canvas.getContext("2d");

          // Capture frames using html2canvas
          const captureFrame = async () => {
            if (!frameCapturingRef.current) return;
            
            try {
              const html2canvas = (await import("html2canvas")).default;
              const capturedCanvas = await html2canvas(element, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
              });

              if (ctx && frameCapturingRef.current) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(capturedCanvas, 0, 0, canvas.width, canvas.height);
              }
            } catch (error) {
              console.error(`Frame capture error for ${type}:`, error);
            }
          };

          // Initial capture
          await captureFrame();

          // Get stream from canvas
          const stream = canvas.captureStream(30);
          
          // Try VP9 first, fall back to VP8
          let mimeType = "video/webm;codecs=vp9";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "video/webm;codecs=vp8";
          }
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "video/webm";
          }

          const mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 5000000,
          });

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current[type].push(event.data);
            }
          };

          mediaRecordersRef.current[type] = mediaRecorder;
          mediaRecorder.start(100);

          // Continuous frame capture every 150ms
          captureIntervalsRef.current[type] = setInterval(captureFrame, 150);
        } catch (error) {
          console.error(`Error setting up recording for ${type}:`, error);
        }
      }

      setIsVideoRecording(true);
      setCurrentFrameIndex(0);
    };

    const stopVideoRecording = async (): Promise<Record<string, Blob>> => {
      frameCapturingRef.current = false;

      // Clear all capture intervals
      Object.values(captureIntervalsRef.current).forEach(clearInterval);
      captureIntervalsRef.current = {};

      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }

      return new Promise((resolve) => {
        const videos: Record<string, Blob> = {};
        const recorders = Object.entries(mediaRecordersRef.current);
        let completedCount = 0;

        if (recorders.length === 0) {
          setIsVideoRecording(false);
          resolve({});
          return;
        }

        for (const [type, recorder] of recorders) {
          recorder.onstop = () => {
            const chunks = chunksRef.current[type] || [];
            if (chunks.length > 0) {
              videos[type] = new Blob(chunks, { type: "video/webm" });
            }
            completedCount++;

            if (completedCount === recorders.length) {
              setRecordedVideos(videos);
              setIsVideoRecording(false);
              onRecordingComplete?.(videos);
              resolve(videos);
            }
          };

          if (recorder.state !== "inactive") {
            recorder.stop();
          } else {
            completedCount++;
            if (completedCount === recorders.length) {
              setRecordedVideos(videos);
              setIsVideoRecording(false);
              resolve(videos);
            }
          }
        }
      });
    };

    useImperativeHandle(ref, () => ({
      startVideoRecording,
      stopVideoRecording,
    }));

    // Auto-convert to MP4 and download
    const downloadVideo = async (type: string, blob: Blob) => {
      let downloadBlob = blob;
      let extension = "mp4";

      if (isFFmpegSupported()) {
        try {
          toast({
            title: "Converting to MP4...",
            description: `Converting ${type} video...`,
          });
          downloadBlob = await convertWebMToMP4(blob);
        } catch (error) {
          console.error("Conversion failed:", error);
          toast({
            title: "Conversion failed",
            description: "Could not convert to MP4. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: "MP4 conversion not available",
          description: "Your browser doesn't support MP4 conversion.",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mockup-${type}-${colorTheme}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} video downloading as MP4...`,
      });
    };

    const downloadAllVideos = async () => {
      const videos = Object.entries(recordedVideos);
      if (videos.length === 0) {
        toast({
          title: "No videos available",
          description: "Record a video first before downloading.",
          variant: "destructive",
        });
        return;
      }

      if (!isFFmpegSupported()) {
        toast({
          title: "MP4 conversion not available",
          description: "Your browser doesn't support MP4 conversion. Try Chrome or Firefox.",
          variant: "destructive",
        });
        return;
      }

      setIsConvertingAll(true);
      setConversionProgress(0);

      try {
        for (let i = 0; i < videos.length; i++) {
          const [type, blob] = videos[i];
          setConversionProgress(Math.round((i / videos.length) * 100));
          await downloadVideo(type, blob);
          // Small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        setConversionProgress(100);

        toast({
          title: "All downloads complete",
          description: `Downloaded ${videos.length} video(s) as MP4.`,
        });
      } catch (error) {
        console.error("Download error:", error);
        toast({
          title: "Download failed",
          description: "Some videos could not be downloaded.",
          variant: "destructive",
        });
      } finally {
        setIsConvertingAll(false);
        setConversionProgress(0);
      }
    };

    const hasRecordedVideos = Object.keys(recordedVideos).length > 0;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full"
      >
        {/* Section header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Device Mockups</h2>
            {(isVideoRecording || isRecording) && (
              <span className="flex items-center gap-2 text-sm text-destructive">
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                Recording
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <DeviceColorPicker selectedTheme={colorTheme} onThemeChange={setColorTheme} />

            {/* Only show download button - no record/stop buttons here */}
            {isConvertingAll ? (
              <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <div className="flex flex-col gap-1 min-w-[100px]">
                  <span className="text-xs text-muted-foreground">Converting to MP4...</span>
                  <Progress value={conversionProgress} className="h-1.5" />
                </div>
              </div>
            ) : (
              hasRecordedVideos && (
                <Button
                  variant="outline"
                  className="rounded-xl border-primary/30 hover:border-primary hover:bg-primary/10"
                  onClick={downloadAllVideos}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All (MP4)
                </Button>
              )
            )}
          </div>
        </div>

        {/* Device grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end justify-items-center">
          {(["mobile", "tablet", "laptop", "desktop"] as const).map((type) => (
            <div
              key={type}
              ref={(el) => {
                deviceRefs.current[type] = el;
              }}
            >
              <DeviceFrame
                type={type}
                screenshot={getCurrentScreenshot(type)}
                isRecording={isRecording || isVideoRecording}
                isLoading={isLoading}
                colorTheme={colorTheme}
                onDownload={
                  recordedVideos[type]
                    ? () => downloadVideo(type, recordedVideos[type])
                    : undefined
                }
                hasVideo={!!recordedVideos[type]}
              />
            </div>
          ))}
        </div>

        {/* Navigation frame indicator */}
        {(isVideoRecording || isRecording) && navigationFrames.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Navigating: Page {currentFrameIndex + 1} of {navigationFrames.length}
              </span>
              <div className="flex gap-1">
                {navigationFrames.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentFrameIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }
);

MockupPreview.displayName = "MockupPreview";
