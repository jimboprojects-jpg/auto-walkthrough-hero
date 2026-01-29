import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { DeviceColorTheme, getThemeColors } from "./DeviceColorPicker";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  deviceType: "mobile" | "tablet" | "laptop" | "desktop";
  colorTheme: DeviceColorTheme;
}

export const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageUrl,
  deviceType,
  colorTheme,
}: ImagePreviewModalProps) => {
  const themeColors = getThemeColors(colorTheme);

  const handleDownload = () => {
    if (!imageUrl) return;

    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `mockup-${deviceType}-${colorTheme}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        <DialogTitle className="sr-only">
          {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Preview
        </DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: themeColors.gradient }}
            />
            <span className="font-medium capitalize">{deviceType} Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image display */}
        <div className="p-8 flex items-center justify-center bg-secondary/20 min-h-[400px]">
          <img
            src={imageUrl}
            alt={`${deviceType} mockup`}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
