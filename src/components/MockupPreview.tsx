import { motion } from "framer-motion";
import { DeviceFrame } from "./DeviceFrame";
import { Download, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

interface MockupPreviewProps {
  screenshots: {
    mobile?: string;
    tablet?: string;
    laptop?: string;
    desktop?: string;
  };
  isRecording?: boolean;
  isLoading?: boolean;
}

// Helper to convert base64 or data URL to blob
const dataURLToBlob = async (dataURL: string): Promise<Blob> => {
  const response = await fetch(dataURL);
  return response.blob();
};

// Helper to download a single screenshot
const downloadScreenshot = async (type: string, screenshot: string) => {
  try {
    const blob = await dataURLToBlob(screenshot);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mockup-${type}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading screenshot:", error);
  }
};

export const MockupPreview = ({ screenshots, isRecording, isLoading }: MockupPreviewProps) => {
  const { toast } = useToast();

  const handleDownloadSingle = (type: string, screenshot: string) => {
    downloadScreenshot(type, screenshot);
    toast({
      title: "Download started",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} screenshot downloading...`,
    });
  };

  const handleDownloadAll = async () => {
    const availableScreenshots = Object.entries(screenshots).filter(
      ([, value]) => value !== null && value !== undefined
    );

    if (availableScreenshots.length === 0) {
      toast({
        title: "No screenshots available",
        description: "Capture screenshots first before downloading.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Preparing ZIP file",
      description: "Creating your download package...",
    });

    try {
      const zip = new JSZip();

      for (const [type, screenshot] of availableScreenshots) {
        if (screenshot) {
          const blob = await dataURLToBlob(screenshot);
          zip.file(`mockup-${type}.png`, blob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mockup-screenshots.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download complete",
        description: `Downloaded ${availableScreenshots.length} screenshot(s) as ZIP.`,
      });
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast({
        title: "Download failed",
        description: "Failed to create ZIP file. Try downloading individually.",
        variant: "destructive",
      });
    }
  };

  const hasAnyScreenshots = Object.values(screenshots).some(
    (s) => s !== null && s !== undefined
  );

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
          onClick={handleDownloadAll}
          disabled={!hasAnyScreenshots}
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
          isLoading={isLoading}
          onDownload={handleDownloadSingle}
        />
        <DeviceFrame
          type="tablet"
          screenshot={screenshots.tablet}
          isRecording={isRecording}
          isLoading={isLoading}
          onDownload={handleDownloadSingle}
        />
        <DeviceFrame
          type="laptop"
          screenshot={screenshots.laptop}
          isRecording={isRecording}
          isLoading={isLoading}
          onDownload={handleDownloadSingle}
        />
        <DeviceFrame
          type="desktop"
          screenshot={screenshots.desktop}
          isRecording={isRecording}
          isLoading={isLoading}
          onDownload={handleDownloadSingle}
        />
      </div>
    </motion.div>
  );
};
