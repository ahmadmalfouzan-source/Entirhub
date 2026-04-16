import { create } from 'zustand';

interface PWAStoreState {
  deferredPrompt: any | null;
  isInstallable: boolean;
  setDeferredPrompt: (prompt: any) => void;
  clearDeferredPrompt: () => void;
}

export const usePWAStore = create<PWAStoreState>((set) => ({
  deferredPrompt: null,
  isInstallable: false,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt, isInstallable: true }),
  clearDeferredPrompt: () => set({ deferredPrompt: null, isInstallable: false }),
}));
