import { registerSW } from 'virtual:pwa-register';

export interface UpdateController {
  apply(): Promise<void>;
}

export function registerUpdateController(callbacks: { onNeedRefresh: () => void; onOfflineReady: () => void }): UpdateController {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh: callbacks.onNeedRefresh,
    onOfflineReady: callbacks.onOfflineReady,
    onRegisterError(error) {
      console.warn('Service worker registration failed; core workflow remains local when already loaded.', error);
    },
  });
  return { async apply() { await updateSW(true); } };
}
