import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Globe, Sparkles, Layers, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { UrlInput } from "@/components/UrlInput";
import { MockupPreview } from "@/components/MockupPreview";
import { RecordingControls } from "@/components/RecordingControls";
import { ProgressBar } from "@/components/ProgressBar";
import { FeatureCard } from "@/components/FeatureCard";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [screenshots, setScreenshots] = useState<{
    mobile?: string;
    tablet?: string;
    laptop?: string;
    desktop?: string;
  }>({});

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const handleSubmit = useCallback(async (submittedUrl: string) => {
    setUrl(submittedUrl);
    setIsLoading(true);
    setHasSubmitted(true);
    setProgress(0);
    setStatus("Initializing capture...");

    // Simulate capture process
    const stages = [
      { progress: 25, status: "Capturing mobile view...", delay: 800 },
      { progress: 50, status: "Capturing tablet view...", delay: 600 },
      { progress: 75, status: "Capturing laptop view...", delay: 600 },
      { progress: 100, status: "Capturing desktop view...", delay: 600 },
    ];

    for (const stage of stages) {
      await new Promise((resolve) => setTimeout(resolve, stage.delay));
      setProgress(stage.progress);
      setStatus(stage.status);
    }

    // Set demo screenshots (in real app, these would come from actual captures)
    setScreenshots({
      mobile: `https://api.microlink.io/?url=${encodeURIComponent(submittedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=375&viewport.height=667`,
      tablet: `https://api.microlink.io/?url=${encodeURIComponent(submittedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=768&viewport.height=1024`,
      laptop: `https://api.microlink.io/?url=${encodeURIComponent(submittedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1366&viewport.height=768`,
      desktop: `https://api.microlink.io/?url=${encodeURIComponent(submittedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1920&viewport.height=1080`,
    });

    setIsLoading(false);
    setStatus("Ready to record");
    
    toast({
      title: "Screenshots captured!",
      description: "You can now start recording the navigation video.",
    });
  }, [toast]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    toast({
      title: "Recording started",
      description: "Navigate through your website to capture the video.",
    });
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    toast({
      title: "Recording stopped",
      description: `Video captured: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`,
    });
  };

  const handleResetRecording = () => {
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
  };

  const features = [
    {
      icon: Globe,
      title: "Automatic Navigation",
      description: "Our AI navigates through your website, capturing every interaction and transition.",
    },
    {
      icon: Layers,
      title: "Multi-Device Capture",
      description: "Generate mockups for mobile, tablet, laptop, and desktop simultaneously.",
    },
    {
      icon: Video,
      title: "HD Video Export",
      description: "Export stunning HD videos perfect for presentations and marketing.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Capture and process your entire website in under a minute.",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundEffects />
      
      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered Video Generation</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Turn Your Website Into
            <br />
            <span className="gradient-text">Stunning Video Mockups</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Automatically capture and record your website's navigation, generating professional
            video mockups across all device types in minutes.
          </p>
        </motion.section>

        {/* URL Input */}
        <section className="mb-12">
          <UrlInput onSubmit={handleSubmit} isLoading={isLoading} />
        </section>

        {/* Progress Bar */}
        <AnimatePresence>
          {isLoading && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 max-w-2xl mx-auto"
            >
              <ProgressBar progress={progress} status={status} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Recording Controls & Mockups */}
        <AnimatePresence>
          {hasSubmitted && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <section className="mb-12 max-w-2xl mx-auto">
                <RecordingControls
                  isRecording={isRecording}
                  isPaused={isPaused}
                  duration={duration}
                  onStart={handleStartRecording}
                  onPause={handlePauseRecording}
                  onStop={handleStopRecording}
                  onReset={handleResetRecording}
                />
              </section>

              <section className="mb-16">
                <MockupPreview screenshots={screenshots} isRecording={isRecording} />
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Section */}
        {!hasSubmitted && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl font-semibold mb-2">How It Works</h2>
              <p className="text-muted-foreground">Generate professional mockup videos in four simple steps</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={0.5 + index * 0.1}
                />
              ))}
            </div>
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© 2024 MockupVid. Generate beautiful website video mockups.</p>
      </footer>
    </div>
  );
};

export default Index;
