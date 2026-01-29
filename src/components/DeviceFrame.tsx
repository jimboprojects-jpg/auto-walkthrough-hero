import { motion } from "framer-motion";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeviceColorTheme, getThemeColors } from "./DeviceColorPicker";

interface DeviceFrameProps {
  type: "mobile" | "tablet" | "laptop" | "desktop";
  screenshot?: string;
  isLoading?: boolean;
  colorTheme?: DeviceColorTheme;
  onDownload?: () => void;
  hasSnapshot?: boolean;
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

const deviceConfigs: Record<DeviceFrameProps["type"], DeviceConfig> = {
  mobile: {
    width: 180,
    height: 360,
    bezel: 12,
    borderRadius: 24,
    notch: true,
  },
  tablet: {
    width: 280,
    height: 380,
    bezel: 16,
    borderRadius: 20,
    notch: false,
  },
  laptop: {
    width: 400,
    height: 260,
    bezel: 12,
    borderRadius: 12,
    notch: false,
    hasBase: true,
  },
  desktop: {
    width: 480,
    height: 300,
    bezel: 16,
    borderRadius: 8,
    notch: false,
    hasStand: true,
  },
};

export const DeviceFrame = ({ type, screenshot, isLoading, colorTheme = "space-gray", onDownload, hasSnapshot }: DeviceFrameProps) => {
  const config = deviceConfigs[type];
  const themeColors = getThemeColors(colorTheme);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: type === "mobile" ? 0 : type === "tablet" ? 0.1 : type === "laptop" ? 0.2 : 0.3 }}
    >
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
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full z-10" />
        )}

        {/* Screen area */}
        <div
          className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: config.borderRadius - 8,
            background: "#0f0f14",
          }}
        >
          {isLoading ? (
            <div className="w-full h-full flex flex-col p-3 gap-2 bg-secondary/30">
              {/* Skeleton header */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-2 w-12 ml-auto" />
              </div>
              {/* Skeleton nav */}
              <Skeleton className="h-6 w-full rounded" />
              {/* Skeleton hero */}
              <Skeleton className="h-16 w-full rounded flex-shrink-0" />
              {/* Skeleton content blocks */}
              <div className="flex gap-2 flex-1">
                <Skeleton className="h-full w-1/2 rounded" />
                <Skeleton className="h-full w-1/2 rounded" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-1/3 rounded" />
                <Skeleton className="h-8 w-1/3 rounded" />
                <Skeleton className="h-8 w-1/3 rounded" />
              </div>
            </div>
          ) : screenshot ? (
            <img
              src={screenshot}
              alt={`${type} preview`}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/50">
              <div className="text-center text-muted-foreground">
                <div className="text-sm font-medium capitalize">{type}</div>
                <div className="text-xs mt-1">No preview</div>
              </div>
            </div>
          )}
        </div>

        {/* Home button for tablet */}
        {type === "tablet" && (
          <div 
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2"
            style={{ borderColor: themeColors.border }}
          />
        )}
      </div>

      {/* Laptop base */}
      {config.hasBase && (
        <div
          className="mx-auto"
          style={{
            width: config.width + 60,
            height: 16,
            background: themeColors.gradient,
            borderRadius: "0 0 8px 8px",
            marginTop: -4,
          }}
        >
          <div
            className="mx-auto"
            style={{
              width: 80,
              height: 4,
              background: themeColors.accent,
              borderRadius: "0 0 4px 4px",
            }}
          />
        </div>
      )}

      {/* Desktop stand */}
      {config.hasStand && (
        <div className="flex flex-col items-center -mt-1">
          <div
            style={{
              width: 60,
              height: 60,
              background: themeColors.gradient,
            }}
          />
          <div
            style={{
              width: 120,
              height: 12,
              background: themeColors.gradient,
              borderRadius: "0 0 6px 6px",
            }}
          />
        </div>
      )}

      {/* Device label and preview button */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-sm font-medium text-muted-foreground capitalize">{type}</span>
        {hasSnapshot && onDownload && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-primary/10"
            onClick={handleDownload}
            title={`Preview ${type} snapshot`}
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};
