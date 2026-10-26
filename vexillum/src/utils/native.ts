import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();
export const isAndroid =
  Capacitor.getPlatform() === 'android' ||
  (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent));


/**
 * Initialize native device capabilities (StatusBar, SplashScreen)
 */
export async function initNativeApp() {
  if (!isNative) return;

  try {
    // Style status bar with light text for dark background
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#020617' });
    }
  } catch (e) {
    console.debug('StatusBar configuration not supported', e);
  }

  try {
    // Hide the native splash screen smoothly after app is ready
    await SplashScreen.hide();
  } catch (e) {
    console.debug('SplashScreen hide not supported', e);
  }
}

let hapticsEnabled = typeof localStorage !== 'undefined'
  ? localStorage.getItem('fwf_haptics_enabled') !== 'false'
  : true;

/**
 * Native Haptic Feedback Helpers
 */
export const nativeHaptics = {
  isEnabled: () => hapticsEnabled,
  toggle: () => {
    hapticsEnabled = !hapticsEnabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fwf_haptics_enabled', String(hapticsEnabled));
    }
    if (hapticsEnabled) {
      nativeHaptics.light();
    }
    return hapticsEnabled;
  },
  light: async () => {
    if (!isNative || !hapticsEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
  },
  medium: async () => {
    if (!isNative || !hapticsEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
  },
  heavy: async () => {
    if (!isNative || !hapticsEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {}
  },
  success: async () => {
    if (!isNative || !hapticsEnabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {}
  },
  error: async () => {
    if (!isNative || !hapticsEnabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {}
  },
};
