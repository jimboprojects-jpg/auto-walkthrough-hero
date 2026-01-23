import { motion } from "framer-motion";

interface DeviceFrameProps {
  type: "mobile" | "tablet" | "laptop" | "desktop";
  screenshot?: string;
  isRecording?: boolean;
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

export const DeviceFrame = ({ type, screenshot, isRecording }: DeviceFrameProps) => {
  const config = deviceConfigs[type];

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
          background: "linear-gradient(145deg, #2a2a3a 0%, #1a1a24 100%)",
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
          {screenshot ? (
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

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 right-2 flex items-center gap-2 glass px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                <span className="text-[10px] text-destructive font-medium">REC</span>
              </div>
              <div className="absolute inset-0 border-2 border-primary/50 rounded-lg animate-pulse-glow" />
            </div>
          )}
        </div>

        {/* Home button for tablet */}
        {type === "tablet" && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-muted" />
        )}
      </div>

      {/* Laptop base */}
      {config.hasBase && (
        <div
          className="mx-auto"
          style={{
            width: config.width + 60,
            height: 16,
            background: "linear-gradient(145deg, #2a2a3a 0%, #1a1a24 100%)",
            borderRadius: "0 0 8px 8px",
            marginTop: -4,
          }}
        >
          <div
            className="mx-auto"
            style={{
              width: 80,
              height: 4,
              background: "#3a3a4a",
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
              background: "linear-gradient(145deg, #2a2a3a 0%, #1a1a24 100%)",
            }}
          />
          <div
            style={{
              width: 120,
              height: 12,
              background: "linear-gradient(145deg, #2a2a3a 0%, #1a1a24 100%)",
              borderRadius: "0 0 6px 6px",
            }}
          />
        </div>
      )}

      {/* Device label */}
      <div className="text-center mt-4">
        <span className="text-sm font-medium text-muted-foreground capitalize">{type}</span>
      </div>
    </motion.div>
  );
};
