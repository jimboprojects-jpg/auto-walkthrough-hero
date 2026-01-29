import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { DeviceFrame } from "./DeviceFrame";
import { DeviceColorPicker, DeviceColorTheme } from "./DeviceColorPicker";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { Download, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import JSZip from "jszip";

interface MockupPreviewProps {
  screenshots: {
    mobile?: string;
    tablet?: string;
    laptop?: string;
    desktop?: string;
  };
  navigationFrames?: string[];
  isCapturing?: boolean;
  isLoading?: boolean;
  onCaptureComplete?: (snapshots: Record<string, string>) => void;
}

export interface MockupPreviewHandle {
  captureSnapshots: () => Promise<Record<string, string>>;
}

export const MockupPreview = forwardRef<MockupPreviewHandle, MockupPreviewProps>(
  ({ screenshots, navigationFrames = [], isCapturing, isLoading, onCaptureComplete }, ref) => {
    const { toast } = useToast();
    const [colorTheme, setColorTheme] = useState<DeviceColorTheme>("space-gray");
    const [capturedSnapshots, setCapturedSnapshots] = useState<Record<string, string>>({});
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    // Image preview modal state
    const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "laptop" | "desktop" | null>(null);

    const deviceRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const captureSnapshots = async (): Promise<Record<string, string>> => {
      const deviceTypes = ["mobile", "tablet", "laptop", "desktop"];
      const snapshots: Record<string, string> = {};

      for (const type of deviceTypes) {
        const element = deviceRefs.current[type];
        if (!element) continue;

        try {
          const canvas = await html2canvas(element, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
          });

          snapshots[type] = canvas.toDataURL("image/png");
        } catch (error) {
          console.error(`Snapshot capture error for ${type}:`, error);
        }
      }

      setCapturedSnapshots(snapshots);
      onCaptureComplete?.(snapshots);
      return snapshots;
    };

    useImperativeHandle(ref, () => ({
      captureSnapshots,
    }));

    // Download single snapshot
    const downloadSnapshot = (type: string, dataUrl: string) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `mockup-${type}-${colorTheme}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} snapshot downloading...`,
      });
    };

    // Open image preview modal
    const openImagePreview = (type: "mobile" | "tablet" | "laptop" | "desktop") => {
      if (capturedSnapshots[type]) {
        setPreviewDevice(type);
      }
    };

    const downloadAllSnapshots = async () => {
      const snapshots = Object.entries(capturedSnapshots);
      if (snapshots.length === 0) {
        toast({
          title: "No snapshots available",
          description: "Capture snapshots first before downloading.",
          variant: "destructive",
        });
        return;
      }

      setIsDownloadingAll(true);
      setDownloadProgress(0);

      try {
        const zip = new JSZip();

        for (let i = 0; i < snapshots.length; i++) {
          const [type, dataUrl] = snapshots[i];
          setDownloadProgress(Math.round(((i + 1) / snapshots.length) * 80));

          // Convert data URL to blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          zip.file(`mockup-${type}-${colorTheme}.png`, blob);
        }

        setDownloadProgress(90);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        setDownloadProgress(100);

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mockups-${colorTheme}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Download complete",
          description: `Downloaded ${snapshots.length} snapshots as ZIP.`,
        });
      } catch (error) {
        console.error("Download error:", error);
        toast({
          title: "Download failed",
          description: "Some snapshots could not be downloaded.",
          variant: "destructive",
        });
      } finally {
        setIsDownloadingAll(false);
        setDownloadProgress(0);
      }
    };

    const hasCapturedSnapshots = Object.keys(capturedSnapshots).length > 0;

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
            {isCapturing && (
              <span className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                Capturing...
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <DeviceColorPicker selectedTheme={colorTheme} onThemeChange={setColorTheme} />

            {isDownloadingAll ? (
              <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <div className="flex flex-col gap-1 min-w-[100px]">
                  <span className="text-xs text-muted-foreground">Creating ZIP...</span>
                  <Progress value={downloadProgress} className="h-1.5" />
                </div>
              </div>
            ) : (
              hasCapturedSnapshots && (
                <Button
                  variant="outline"
                  className="rounded-xl border-primary/30 hover:border-primary hover:bg-primary/10"
                  onClick={downloadAllSnapshots}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All (ZIP)
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
                screenshot={screenshots[type]}
                isLoading={isLoading}
                colorTheme={colorTheme}
                onDownload={
                  capturedSnapshots[type]
                    ? () => openImagePreview(type)
                    : undefined
                }
                hasSnapshot={!!capturedSnapshots[type]}
              />
            </div>
          ))}
        </div>

        {/* Navigation frame indicator */}
        {navigationFrames.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {navigationFrames.length} pages captured
              </span>
            </div>
          </motion.div>
        )}

        {/* Image Preview Modal */}
        <ImagePreviewModal
          isOpen={previewDevice !== null}
          onClose={() => setPreviewDevice(null)}
          imageUrl={previewDevice ? capturedSnapshots[previewDevice] : null}
          deviceType={previewDevice || "mobile"}
          colorTheme={colorTheme}
        />
      </motion.div>
    );
  }
);

MockupPreview.displayName = "MockupPreview";
