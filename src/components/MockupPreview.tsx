import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DeviceFrame } from "./DeviceFrame";
import { DeviceColorPicker, DeviceColorTheme } from "./DeviceColorPicker";
import { VideoFormatSelector, VideoFormat } from "./VideoFormatSelector";
import { Download, Layers, Video, StopCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
    const [selectedFormat, setSelectedFormat] = useState<VideoFormat>("webm");

    const deviceRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const mediaRecordersRef = useRef<Record<string, MediaRecorder>>({});
    const chunksRef = useRef<Record<string, Blob[]>>({});
    const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Animation through navigation frames
    useEffect(() => {
      if (isVideoRecording && navigationFrames.length > 1) {
        animationIntervalRef.current = setInterval(() => {
          setCurrentFrameIndex((prev) => {
            if (prev >= navigationFrames.length - 1) {
              return 0; // Loop back
            }
            return prev + 1;
          });
        }, 2000); // Change frame every 2 seconds

        return () => {
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
          }
        };
      }
    }, [isVideoRecording, navigationFrames.length]);

    // Get current screenshot based on navigation frames or static screenshots
    const getCurrentScreenshot = (type: string) => {
      if (navigationFrames.length > 0 && isVideoRecording) {
        return navigationFrames[currentFrameIndex];
      }
      return screenshots[type as keyof typeof screenshots];
    };

    const startVideoRecording = async () => {
      const deviceTypes = ["mobile", "tablet", "laptop", "desktop"];
      chunksRef.current = {};
      mediaRecordersRef.current = {};

      for (const type of deviceTypes) {
        const element = deviceRefs.current[type];
        if (!element) continue;

        try {
          // Create a canvas to capture the device frame
          const canvas = document.createElement("canvas");
          const rect = element.getBoundingClientRect();
          canvas.width = rect.width * 2;
          canvas.height = rect.height * 2;

          chunksRef.current[type] = [];

          // Capture frames using html2canvas
          const captureFrame = async () => {
            const html2canvas = (await import("html2canvas")).default;
            const capturedCanvas = await html2canvas(element, {
              backgroundColor: null,
              scale: 2,
              useCORS: true,
              logging: false,
            });

            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(capturedCanvas, 0, 0);
            }
          };

          // Initial capture
          await captureFrame();

          // Get stream from canvas
          const stream = canvas.captureStream(30);
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm;codecs=vp9",
            videoBitsPerSecond: 5000000,
          });

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current[type].push(event.data);
            }
          };

          mediaRecordersRef.current[type] = mediaRecorder;
          mediaRecorder.start(100);

          // Continuous frame capture
          const captureInterval = setInterval(captureFrame, 100);
          (mediaRecorder as any).captureInterval = captureInterval;
        } catch (error) {
          console.error(`Error setting up recording for ${type}:`, error);
        }
      }

      setIsVideoRecording(true);
      setCurrentFrameIndex(0);

      toast({
        title: "Video recording started",
        description: "Recording device mockups with navigation...",
      });
    };

    const stopVideoRecording = async (): Promise<Record<string, Blob>> => {
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
          // Clear capture interval
          if ((recorder as any).captureInterval) {
            clearInterval((recorder as any).captureInterval);
          }

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

        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
        }
      });
    };

    useImperativeHandle(ref, () => ({
      startVideoRecording,
      stopVideoRecording,
    }));

    const downloadVideo = async (type: string, blob: Blob, format: VideoFormat = "webm") => {
      let downloadBlob = blob;
      let extension = "webm";

      if (format === "mp4") {
        try {
          toast({
            title: "Converting to MP4...",
            description: `Converting ${type} video...`,
          });
          downloadBlob = await convertWebMToMP4(blob);
          extension = "mp4";
        } catch (error) {
          console.error("Conversion failed:", error);
          toast({
            title: "Conversion failed",
            description: "Downloading as WebM instead.",
            variant: "destructive",
          });
        }
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
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} video downloading as ${extension.toUpperCase()}...`,
      });
    };

    const downloadAllVideos = async (format: VideoFormat = "webm") => {
      const videos = Object.entries(recordedVideos);
      if (videos.length === 0) {
        toast({
          title: "No videos available",
          description: "Record a video first before downloading.",
          variant: "destructive",
        });
        return;
      }

      if (format === "mp4" && !isFFmpegSupported()) {
        toast({
          title: "MP4 not supported",
          description: "Your browser doesn't support MP4 conversion. Downloading as WebM.",
          variant: "destructive",
        });
        format = "webm";
      }

      setIsConvertingAll(format === "mp4");
      
      try {
        for (let i = 0; i < videos.length; i++) {
          const [type, blob] = videos[i];
          setConversionProgress(Math.round(((i) / videos.length) * 100));
          await downloadVideo(type, blob, format);
          // Small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        toast({
          title: "All downloads complete",
          description: `Downloaded ${videos.length} video(s) as ${format.toUpperCase()}.`,
        });
      } finally {
        setIsConvertingAll(false);
        setConversionProgress(0);
      }
    };

    const hasAnyScreenshots = Object.values(screenshots).some(
      (s) => s !== null && s !== undefined
    );

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
            {isVideoRecording && (
              <span className="flex items-center gap-2 text-sm text-destructive">
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                Recording
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <DeviceColorPicker selectedTheme={colorTheme} onThemeChange={setColorTheme} />

            <AnimatePresence mode="wait">
              {isVideoRecording ? (
                <motion.div
                  key="stop"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={async () => {
                      const videos = await stopVideoRecording();
                      if (Object.keys(videos).length > 0) {
                        toast({
                          title: "Recording complete!",
                          description: "Your videos are ready to download.",
                        });
                      }
                    }}
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex gap-2"
                >
                  {hasAnyScreenshots && (
                    <Button
                      variant="default"
                      className="rounded-xl bg-primary hover:bg-primary/90"
                      onClick={startVideoRecording}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Record Video
                    </Button>
                  )}

                  {isConvertingAll ? (
                    <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-xs text-muted-foreground">Converting...</span>
                        <Progress value={conversionProgress} className="h-1.5" />
                      </div>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="rounded-xl border-primary/30 hover:border-primary hover:bg-primary/10"
                          disabled={!hasRecordedVideos}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download All
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => downloadAllVideos("webm")}
                          className="cursor-pointer"
                        >
                          <span>WebM</span>
                          <span className="ml-auto text-xs text-muted-foreground">Fast</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => downloadAllVideos("mp4")}
                          disabled={!isFFmpegSupported()}
                          className="cursor-pointer"
                        >
                          <span>MP4</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {isFFmpegSupported() ? "Universal" : "Not supported"}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
        {isVideoRecording && navigationFrames.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentFrameIndex + 1} of {navigationFrames.length}
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
