import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

export const UrlInput = ({ onSubmit, isLoading }: UrlInputProps) => {
  const [protocol, setProtocol] = useState("https://");
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(`${protocol}${url.trim()}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass rounded-2xl p-2 glow">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-4">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger className="w-[110px] border-0 bg-transparent focus:ring-0 text-muted-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="https://">https://</SelectItem>
                <SelectItem value="http://">http://</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="text"
              placeholder="www.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-lg"
            />
            
            <Button
              type="submit"
              disabled={!url.trim() || isLoading}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Generate
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
      
      <p className="text-center text-sm text-muted-foreground mt-4">
        Enter a website URL to capture screenshots and generate a video mockup
      </p>
    </motion.div>
  );
};
