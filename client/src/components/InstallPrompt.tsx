import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="glass-panel rounded-xl p-4 flex items-center gap-3 shadow-lg border border-primary/20">
        <Download className="w-8 h-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Install Sleep App</p>
          <p className="text-xs text-muted-foreground">Add to home screen for offline access</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            data-testid="pwa-dismiss-btn"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleInstall}
            data-testid="pwa-install-btn"
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
