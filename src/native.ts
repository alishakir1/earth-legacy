import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';

declare global {
  interface Window {
    EarthStorage: {get(key: string): string | null; set(key: string, value: string): void; flush(): Promise<void>};
    erthBack?: () => boolean;
    earthPause?: () => void;
  }
}
const keys = ['erth-progress-v1', 'erth-language', 'earth-settings-v1'];
const native = Capacitor.isNativePlatform();
let writes = Promise.resolve();
let backupFailed = false;
function queueBackup(key: string, value: string) {
  if (!native) return;
  // Serialize snapshots, including reset, to prevent an older save winning a race.
  writes = writes.then(() => Preferences.set({key, value})).catch(() => {
    backupFailed = true;
    console.warn('Native progress backup unavailable; browser save retained.');
  });
}
window.EarthStorage = {
  get: key => localStorage.getItem(key),
  set(key, value) {localStorage.setItem(key, value); queueBackup(key, value);},
  flush: () => writes
};

async function loadScript(src: string) {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src; script.onload = () => resolve(); script.onerror = () => reject(new Error('Game asset could not load'));
    document.body.append(script);
  });
}

async function start() {
  document.documentElement.dataset.platform = Capacitor.getPlatform();
  if (native) {
    for (const key of keys) {
      const local = localStorage.getItem(key);
      if (local !== null) queueBackup(key, local);
      else {
        try {const {value} = await Preferences.get({key}); if (value !== null) localStorage.setItem(key, value);}
        catch {console.warn('Native backup restore unavailable.');}
      }
    }
  }
  for (const script of ['vendor/d3.min.js', 'app.js', 'puzzle.js', 'experience.js', 'chronicle.js', 'earth.js']) await loadScript(script);
  if (native) {
    await App.addListener('appStateChange', ({isActive}) => {
      if (!isActive) window.earthPause?.();
      // Retry the latest state after a transient backup failure.
      if (isActive && backupFailed) {backupFailed = false; for (const key of keys) {const value = localStorage.getItem(key); if (value !== null) queueBackup(key, value);}}
    });
    if (Capacitor.getPlatform() === 'android') {
      await App.addListener('backButton', () => {if (!window.erthBack?.()) void App.exitApp();});
    }
    document.addEventListener('click', event => {
      const anchor = (event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || !anchor.href.startsWith('https://') || new URL(anchor.href).origin === location.origin) return;
      event.preventDefault();
      void Browser.open({url: anchor.href}).catch(() => console.warn('Source link could not open.'));
    });
  }
}
document.addEventListener('visibilitychange', () => {if (document.hidden) window.earthPause?.();});
void start().catch(() => {
  const status = document.getElementById('loadStatus');
  if (status) status.textContent = 'تعذر تحميل اللعبة. أعد فتح التطبيق. / Could not load the game. Please reopen the app.';
  document.getElementById('splash')?.classList.add('hidden');
  document.getElementById('language')?.classList.remove('hidden');
});
