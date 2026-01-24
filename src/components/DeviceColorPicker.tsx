import { motion } from "framer-motion";
import { Palette } from "lucide-react";

export type DeviceColorTheme = "space-gray" | "silver" | "gold";

interface DeviceColorPickerProps {
  selectedTheme: DeviceColorTheme;
  onThemeChange: (theme: DeviceColorTheme) => void;
}

const themes: { id: DeviceColorTheme; label: string; colors: string[] }[] = [
  {
    id: "space-gray",
    label: "Space Gray",
    colors: ["#2a2a3a", "#1a1a24"],
  },
  {
    id: "silver",
    label: "Silver",
    colors: ["#d4d4d8", "#a1a1aa"],
  },
  {
    id: "gold",
    label: "Gold",
    colors: ["#d4a574", "#b8956a"],
  },
];

export const DeviceColorPicker = ({ selectedTheme, onThemeChange }: DeviceColorPickerProps) => {
  return (
    <div className="flex items-center gap-3">
      <Palette className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Theme:</span>
      <div className="flex gap-2">
        {themes.map((theme) => (
          <motion.button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
              selectedTheme === theme.id
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-muted"
            }`}
            style={{
              background: `linear-gradient(145deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 100%)`,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={theme.label}
          >
            {selectedTheme === theme.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-primary rounded-full" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export const getThemeColors = (theme: DeviceColorTheme) => {
  const themeData = themes.find((t) => t.id === theme);
  return {
    gradient: `linear-gradient(145deg, ${themeData?.colors[0] || "#2a2a3a"} 0%, ${themeData?.colors[1] || "#1a1a24"} 100%)`,
    accent: theme === "space-gray" ? "#3a3a4a" : theme === "silver" ? "#e4e4e7" : "#c9a882",
    border: theme === "space-gray" ? "#3a3a4a" : theme === "silver" ? "#d4d4d8" : "#c9a882",
  };
};
