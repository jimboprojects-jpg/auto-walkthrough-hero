import { motion } from "framer-motion";
import { Monitor, Smartphone, Tablet, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  onPricing: () => void;
};

export const Header = ({ onPricing }: HeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center glow">
                <div className="flex items-center gap-0.5">
                  <Smartphone className="w-3 h-3 text-primary-foreground" />
                  <Monitor className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="gradient-text">MockupVid</span>
              </h1>
              <p className="text-xs text-muted-foreground">Video Mockup Generator</p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={onPricing} className="mr-4 border-primary/40 hover:bg-primary/10">
            Upgrade
          </Button>

          {/* Device icons */}
          <div className="hidden md:flex items-center gap-4 text-muted-foreground">
            <motion.div
              whileHover={{ scale: 1.1, color: "hsl(174 72% 56%)" }}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <Smartphone className="w-5 h-5" />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, color: "hsl(174 72% 56%)" }}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <Tablet className="w-5 h-5" />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, color: "hsl(174 72% 56%)" }}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <Laptop className="w-5 h-5" />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, color: "hsl(174 72% 56%)" }}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <Monitor className="w-5 h-5" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
