import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileVideo, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { convertWebMToMP4, isFFmpegSupported } from "@/lib/videoConverter";
import { useToast } from "@/hooks/use-toast";

export type VideoFormat = "webm" | "mp4";

interface VideoFormatSelectorProps {
  videoBlob: Blob;
  filename: string;
  onDownload: (blob: Blob, format: VideoFormat) => void;
}

export const VideoFormatSelector = ({
  videoBlob,
  filename,
  onDownload,
}: VideoFormatSelectorProps) => {
  const { toast } = useToast();
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleDownloadWebM = () => {
    onDownload(videoBlob, "webm");
    setIsOpen(false);
  };

  const handleDownloadMP4 = async () => {
    if (!isFFmpegSupported()) {
      toast({
        title: "MP4 conversion not supported",
        description:
          "Your browser doesn't support the required features. Try using Chrome or Firefox.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);
    setIsOpen(false);

    try {
      toast({
        title: "Converting to MP4...",
        description: "This may take a moment. Please wait.",
      });

      const mp4Blob = await convertWebMToMP4(videoBlob, (progress) => {
        setConversionProgress(progress.progress);
      });

      onDownload(mp4Blob, "mp4");

      toast({
        title: "Conversion complete!",
        description: "Your MP4 video is ready.",
      });
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion failed",
        description: "Failed to convert video to MP4. Try downloading as WebM instead.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  const ffmpegSupported = isFFmpegSupported();

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isConverting ? (
          <motion.div
            key="converting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 glass px-4 py-2 rounded-xl"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="text-xs text-muted-foreground">Converting...</span>
              <Progress value={conversionProgress} className="h-1.5" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="selector"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-primary/30 hover:border-primary hover:bg-primary/10"
                >
                  <FileVideo className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDownloadWebM}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">WebM</span>
                      <span className="text-xs text-muted-foreground">
                        Smaller file, Chrome/Firefox
                      </span>
                    </div>
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadMP4}
                  disabled={!ffmpegSupported}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">MP4</span>
                      <span className="text-xs text-muted-foreground">
                        {ffmpegSupported
                          ? "Universal compatibility"
                          : "Not supported in this browser"}
                      </span>
                    </div>
                    {ffmpegSupported ? (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
