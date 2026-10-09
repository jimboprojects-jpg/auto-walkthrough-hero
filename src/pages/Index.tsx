import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Sparkles, Layers, Zap, Camera } from "lucide-react";
import { Header } from "@/components/Header";
import { UrlInput } from "@/components/UrlInput";
import { MockupPreview, MockupPreviewHandle } from "@/components/MockupPreview";
import { SnapshotControls } from "@/components/SnapshotControls";
import { ProgressBar } from "@/components/ProgressBar";
import { FeatureCard } from "@/components/FeatureCard";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import PaywallDialog from "@/components/PaywallDialog";
import { useToast } from "@/hooks/use-toast";
import { captureScreenshots } from "@/lib/api/screenshots";
import { autoNavigate } from "@/lib/api/navigation";

const Index = () => {
  const { toast } = useToast();
  const mockupPreviewRef = useRef<MockupPreviewHandle>(null);
  
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [siteMetadata, setSiteMetadata] = useState<{ title?: string; description?: string } | null>(null);
  const [screenshots, setScreenshots] = useState<{
    mobile?: string;
    tablet?: string;
    laptop?: string;
    desktop?: string;
  }>({});
  const [navigationFrames, setNavigationFrames] = useState<string[]>([]);
  const [navigationPages, setNavigationPages] = useState<Array<{ url: string; screenshot: string; title?: string }>>([]);
  const [capturedSnapshots, setCapturedSnapshots] = useState<Record<string, string>>({});
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const handleSubmit = useCallback(async (submittedUrl: string) => {
    setUrl(submittedUrl);
    setIsLoading(true);
    setHasSubmitted(true);
    setProgress(0);
    setStatus("Initializing capture...");
    setScreenshots({});
    setSiteMetadata(null);
    setNavigationFrames([]);
    setNavigationPages([]);
    setCapturedSnapshots({});

    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 3;
      });
    }, 800);

    try {
      // First, capture initial screenshots for all devices
      setStatus("Capturing initial screenshots...");
      const screenshotResult = await captureScreenshots(submittedUrl);
      
      if (screenshotResult.success && screenshotResult.screenshots) {
        setScreenshots(screenshotResult.screenshots);
        
        if (screenshotResult.metadata) {
          setSiteMetadata({
            title: screenshotResult.metadata.title,
            description: screenshotResult.metadata.description,
          });
        }
      }

      // Then, auto-navigate to capture multiple pages
      setStatus("Auto-navigating website...");
      const navResult = await autoNavigate(submittedUrl, 5);
      
      clearInterval(progressInterval);
      
      if (navResult.success && navResult.pages && navResult.pages.length > 0) {
        // Extract screenshots from navigation for display
        const frames = navResult.pages
          .filter(page => page.screenshot)
          .map(page => page.screenshot as string);
        
        // Store full page data for walkthrough
        const pageData = navResult.pages
          .filter(page => page.screenshot)
          .map(page => ({
            url: page.url,
            screenshot: page.screenshot as string,
            title: page.title,
          }));
        
        setNavigationFrames(frames);
        setNavigationPages(pageData);
        setProgress(100);
        setStatus("Capture complete!");
        
        toast({
          title: "Website captured!",
          description: `Captured ${frames.length} pages. Use "Page Walkthrough" tab to capture each page individually.`,
        });
      } else if (screenshotResult.success) {
        // Fallback to just screenshots if navigation failed
        setProgress(100);
        setStatus("Capture complete!");
        toast({
          title: "Screenshots captured!",
          description: "Click 'Capture Snapshots' to create PNG mockups with device frames.",
        });
      } else {
        setProgress(0);
        setStatus("Capture failed");
        toast({
          title: "Capture failed",
          description: navResult.error || "Failed to capture website. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      setStatus("Error occurred");
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  }, [toast]);

  const handleCaptureSnapshots = async () => {
    setIsCapturing(true);
    
    try {
      const snapshots = await mockupPreviewRef.current?.captureSnapshots();
      
      if (snapshots && Object.keys(snapshots).length > 0) {
        setCapturedSnapshots(snapshots);
        toast({
          title: "Snapshots captured!",
          description: `Captured ${Object.keys(snapshots).length} device mockups as PNG. Click preview to view or download.`,
        });
      } else {
        toast({
          title: "Capture failed",
          description: "No snapshots were captured. Try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to capture snapshots. Please try again.",
        variant: "destructive",
      });
    }

    setIsCapturing(false);
  };

  const handleSnapshotComplete = (snapshots: Record<string, string>) => {
    setCapturedSnapshots(snapshots);
  };

  const features = [
    {
      icon: Globe,
      title: "Auto Navigation",
      description: "Our AI navigates through your website, capturing every page and transition automatically.",
    },
    {
      icon: Layers,
      title: "Multi-Device Capture",
      description: "Generate PNG mockups for mobile, tablet, laptop, and desktop simultaneously.",
    },
    {
      icon: Camera,
      title: "PNG Export",
      description: "Export high-quality PNG snapshots with device frames, perfect for presentations and marketing.",
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
      
      <Header onPricing={() => setIsPaywallOpen(true)} />
      <PaywallDialog open={isPaywallOpen} onOpenChange={setIsPaywallOpen} />

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
            <span className="text-sm text-muted-foreground">AI-Powered Screenshot Generation</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Turn Your Website Into
            <br />
            <span className="gradient-text">Stunning Device Mockups</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Automatically capture your website across devices, generating professional
            PNG mockups with device frames for all device types.
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

        {/* Snapshot Controls & Mockups */}
        <AnimatePresence>
          {hasSubmitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!isLoading && (
                <section className="mb-12 max-w-2xl mx-auto">
                  {siteMetadata?.title && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass rounded-xl p-4 mb-6 text-center"
                    >
                      <h3 className="font-semibold text-lg">{siteMetadata.title}</h3>
                      {siteMetadata.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {siteMetadata.description}
                        </p>
                      )}
                      {navigationFrames.length > 0 && (
                        <p className="text-xs text-primary mt-2">
                          {navigationFrames.length} pages captured
                        </p>
                      )}
                    </motion.div>
                  )}
                  <SnapshotControls
                    isCapturing={isCapturing}
                    onCapture={handleCaptureSnapshots}
                  />
                </section>
              )}

              <section className="mb-16">
                <MockupPreview
                  ref={mockupPreviewRef}
                  screenshots={screenshots}
                  navigationFrames={navigationFrames}
                  navigationPages={navigationPages}
                  isCapturing={isCapturing}
                  isLoading={isLoading}
                  onCaptureComplete={handleSnapshotComplete}
                />
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
              <p className="text-muted-foreground">Generate professional device mockups in four simple steps</p>
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
        <p>© 2024 MockupVid. Generate beautiful website device mockups.</p>
      </footer>
    </div>
  );
};

export default Index;
