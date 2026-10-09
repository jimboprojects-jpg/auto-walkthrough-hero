import { useState } from "react";
import { Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type PaywallDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const plans = [
  {
    name: "Free Basic",
    price: "$0",
    cadence: "forever",
    description: "Try the core capture workflow.",
    features: ["3 captures each month", "Multi-device screenshots", "PNG exports"],
  },
  {
    name: "Starter",
    price: "$9",
    cadence: "/month",
    description: "Everything you need for regular walkthroughs.",
    features: ["30 captures each month", "Animated videos up to 720p", "Music library"],
    popular: true,
  },
  {
    name: "Premium",
    price: "$29",
    cadence: "/month",
    description: "Ship polished product videos without limits.",
    features: ["Unlimited captures", "1080p animated videos", "Music library + AI voice-over"],
  },
];

export function PaywallDialog({ open, onOpenChange }: PaywallDialogProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState("Starter");

  const handleCheckout = () => {
    const checkoutUrl = import.meta.env.VITE_PADDLE_STARTER_CHECKOUT_URL as string | undefined;
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      return;
    }

    toast({
      title: "Checkout is almost ready",
      description: "Connect your Paddle checkout link to start the Starter plan.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-border/70 bg-card/95 p-0 shadow-2xl backdrop-blur-xl">
        <div className="p-6 pb-4 sm:p-8 sm:pb-5">
          <DialogHeader className="text-left">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Crown className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Unlock MockupVid</span>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl">Make every capture presentation-ready.</DialogTitle>
            <DialogDescription className="max-w-2xl text-sm leading-6">
              Start free with 3 captures a month, or upgrade for animated walkthroughs, music, and more room to create.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-4 px-6 pb-6 sm:grid-cols-3 sm:px-8 sm:pb-8">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.name;
            return (
              <button
                key={plan.name}
                type="button"
                onClick={() => setSelectedPlan(plan.name)}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-5 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]"
                    : "border-border/70 bg-background/30 hover:border-primary/50 hover:bg-secondary/40",
                )}
                aria-pressed={isSelected}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Most popular
                  </span>
                )}
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{plan.description}</p>
                  </div>
                  {isSelected && <Check className="h-5 w-5 shrink-0 text-primary" />}
                </div>
                <div className="mb-5 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.cadence}</span>
                </div>
                <ul className="mt-auto space-y-3 border-t border-border/60 pt-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-xs text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 bg-background/30 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Cancel anytime. Secure billing through Paddle.
          </p>
          <Button
            className="w-full gap-2 sm:w-auto"
            disabled={selectedPlan === "Free Basic"}
            onClick={handleCheckout}
          >
            {selectedPlan === "Free Basic" ? "Current plan" : `Continue with ${selectedPlan}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PaywallDialog;
