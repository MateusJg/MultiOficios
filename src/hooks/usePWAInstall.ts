import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPwaPrompt) {
      return window.__deferredPwaPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isInsideIframe, setIsInsideIframe] = useState(false);

  // Direct standalone URL for MultiOficios
  const directAppUrl = typeof window !== 'undefined'
    ? (window.location.origin.includes('ais-')
        ? 'https://ais-pre-oklo5564gsvng6nawjuvqd-576261061267.us-east1.run.app'
        : window.location.href)
    : 'https://ais-pre-oklo5564gsvng6nawjuvqd-576261061267.us-east1.run.app';

  useEffect(() => {
    // Detect standalone mode (already running as installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect if running inside iframe (e.g. AI Studio console preview)
    const inIframe = window.self !== window.top;
    setIsInsideIframe(inIframe);

    // Detect device OS & environment
    const ua = (window.navigator.userAgent || '').toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    const inApp = /fban|fbav|instagram|threads|line|whatsapp|micromessenger|snapchat|gsa|wv/.test(ua);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsInAppBrowser(inApp);

    // Check if early listener captured beforeinstallprompt
    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
    }

    const handlePromptReady = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__deferredPwaPrompt = null;
    };

    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'manual_guide'> => {
    const promptToUse = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);
    if (promptToUse) {
      try {
        await promptToUse.prompt();
        const { outcome } = await promptToUse.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') window.__deferredPwaPrompt = null;
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('Error invoking native install prompt:', err);
      }
    }
    return 'manual_guide';
  };

  return {
    canPromptDirectly: !!deferredPrompt || (typeof window !== 'undefined' && !!window.__deferredPwaPrompt),
    isInstallable: true,
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInsideIframe,
    directAppUrl,
    install,
  };
}
