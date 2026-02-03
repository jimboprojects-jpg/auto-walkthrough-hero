import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeviceFrame } from "./DeviceFrame";
import { DeviceColorTheme } from "./DeviceColorPicker";
import { ImagePreviewModal } from "./ImagePreviewModal";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";

interface NavigationCarouselProps {
  pages: Array<{
    url: string;
    screenshot: string;
    title?: string;
  }>;
  colorTheme: DeviceColorTheme;
  deviceType: "mobile" | "tablet" | "laptop" | "desktop";
}

export const NavigationCarousel = ({
  pages,
  colorTheme,
  deviceType,
}: NavigationCarouselProps) => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [capturedSnapshots, setCapturedSnapshots] = useState<Record<number, string>>({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? pages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === pages.length - 1 ? 0 : prev + 1));
  };

  const captureCurrentPage = async () => {
    if (!frameRef.current) return;
    
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(frameRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      setCapturedSnapshots((prev) => ({ ...prev, [currentIndex]: dataUrl }));
      
      toast({
        title: "Page captured!",
        description: `Page ${currentIndex + 1} of ${pages.length} captured as PNG.`,
      });
    } catch (error) {
      console.error("Capture error:", error);
      toast({
        title: "Capture failed",
        description: "Failed to capture this page.",
        variant: "destructive",
      });
    }
    setIsCapturing(false);
  };

  const captureAllPages = async () => {
    if (!frameRef.current) return;
    
    setIsCapturing(true);
    const snapshots: Record<number, string> = {};
    
    for (let i = 0; i < pages.length; i++) {
      setCurrentIndex(i);
      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      try {
        const canvas = await html2canvas(frameRef.current, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
        });
        snapshots[i] = canvas.toDataURL("image/png");
      } catch (error) {
        console.error(`Capture error for page ${i}:`, error);
      }
    }
    
    setCapturedSnapshots(snapshots);
    toast({
      title: "All pages captured!",
      description: `${Object.keys(snapshots).length} pages captured as PNG.`,
    });
    setIsCapturing(false);
  };

  const downloadAllSnapshots = async () => {
    const snapshotEntries = Object.entries(capturedSnapshots);
    if (snapshotEntries.length === 0) {
      toast({
        title: "No snapshots",
        description: "Capture pages first before downloading.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      
      for (const [index, dataUrl] of snapshotEntries) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const pageTitle = pages[Number(index)]?.title || `page-${Number(index) + 1}`;
        const safeName = pageTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
        zip.file(`${deviceType}-${safeName}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `walkthrough-${deviceType}-${colorTheme}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download complete",
        description: `Downloaded ${snapshotEntries.length} page snapshots as ZIP.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to create ZIP file.",
        variant: "destructive",
      });
    }
    setIsDownloadingAll(false);
  };

  if (pages.length === 0) return null;

  const currentPage = pages[currentIndex];
  const hasCapturedCurrent = !!capturedSnapshots[currentIndex];
  const totalCaptured = Object.keys(capturedSnapshots).length;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Carousel navigation */}
      <div className="flex items-center gap-4 w-full justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={isCapturing}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Page {currentIndex + 1} of {pages.length}
          </span>
          {hasCapturedCurrent && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Captured
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={isCapturing}
          className="rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Page title */}
      {currentPage.title && (
        <p className="text-xs text-muted-foreground text-center truncate max-w-[200px]">
          {currentPage.title}
        </p>
      )}

      {/* Device frame with current page */}
      <div ref={frameRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DeviceFrame
              type={deviceType}
              screenshot={currentPage.screenshot}
              isLoading={false}
              colorTheme={colorTheme}
              onDownload={hasCapturedCurrent ? () => setPreviewIndex(currentIndex) : undefined}
              hasSnapshot={hasCapturedCurrent}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex gap-1.5 flex-wrap justify-center max-w-[200px]">
        {pages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            disabled={isCapturing}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex
                ? "bg-primary w-4"
                : capturedSnapshots[idx]
                ? "bg-primary/50"
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={captureCurrentPage}
          disabled={isCapturing}
          className="text-xs"
        >
          {isCapturing ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Eye className="w-3 h-3 mr-1" />
          )}
          Capture Page
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={captureAllPages}
          disabled={isCapturing}
          className="text-xs"
        >
          {isCapturing ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : null}
          Capture All ({pages.length})
        </Button>

        {totalCaptured > 0 && (
          <Button
            size="sm"
            onClick={downloadAllSnapshots}
            disabled={isDownloadingAll}
            className="text-xs"
          >
            {isDownloadingAll ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Download className="w-3 h-3 mr-1" />
            )}
            Download ({totalCaptured})
          </Button>
        )}
      </div>

      {/* Preview modal */}
      <ImagePreviewModal
        isOpen={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
        imageUrl={previewIndex !== null ? capturedSnapshots[previewIndex] : null}
        deviceType={deviceType}
        colorTheme={colorTheme}
      />
    </div>
  );
};
