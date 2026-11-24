import { toast } from 'react-hot-toast';

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

// PWA-інтеграція (рівень 3, завдання 7): offline-тумблер у шапці не потрібен —
// стан мережі показуємо toast-ом, оновлення сервіс-воркера — через prompt().
// Викликається один раз у main.tsx.
export function setupPwa(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    toast.success("З'єднання з інтернетом відновлено", { id: 'online' });
  });
  window.addEventListener('offline', () => {
    toast.error('Офлайн-режим: дані можуть бути застарілими', { id: 'offline', duration: 6000 });
  });

  // Оновлення нового сервіс-воркера: не застосовуємо автоматично,
  // пропонуємо користувачеві перезавантажити сторінку.
  void navigator.serviceWorker
    .getRegistration()
    .then((registration) => {
      registration?.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Доступна нова версія застосунку. Перезавантажте сторінку, щоб оновити.', {
              icon: '🔄',
              duration: 8000,
            });
          }
        });
      });
    })
    .catch(() => undefined);

  // Підказка встановити PWA (Android/Chromium; iOS встановлюється через «Поділитися»)
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    if (isStandalone() || sessionStorage.getItem('pwa-install-dismissed')) return;
    toast(
      'LegalConsult можна встановити як застосунок (меню браузера → «Встановити застосунок»).',
      { icon: '📲', duration: 8000, id: 'pwa-install' }
    );
  });
}
