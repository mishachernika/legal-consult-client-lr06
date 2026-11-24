import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import toast from 'react-hot-toast';
import Button from '@/components/common/Button';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Loading from '@/components/common/Loading';
import NotificationBell from '@/components/NotificationBell';
import { APP_NAME, DASHBOARD_NAV } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { useSocketConnection } from '@/hooks/useSocketConnection';
import { usePresenceEvents } from '@/hooks/usePresenceEvents';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

// Іконки розділів бічної панелі (inline SVG)
function NavIcon({ name }: { name: string }) {
  const common = 'h-5 w-5 shrink-0';
  switch (name) {
    case 'home':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'chat':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M21 12a8 8 0 0 1-8 8H4l2.2-2.6A8 8 0 1 1 21 12z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'scale':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M12 3v18M8 21h8M12 6l-6 2 2.5 5a3.5 3.5 0 0 1-5 0L6 8l-6-2m12 0 6 2-2.5 5a3.5 3.5 0 0 0 5 0L18 8l6-2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'tag':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M3 11V4a1 1 0 0 1 1-1h7l10 10-8 8L3 11z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="7.5" r="1.5" />
        </svg>
      );
    case 'bell':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7M10.3 20a2 2 0 0 0 3.4 0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

// Розмітка особистого кабінету: адаптивна бічна панель (на desktop згортається до іконок,
// на mobile — виїжджає поверх контенту по кнопці) + верхня панель із темою і виходом.
export default function DashboardLayout() {
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false); // desktop: панель згорнута до іконок
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: панель відкрита поверх контенту

  // Одне з'єднання Socket.io на весь застосунок + присутність (онлайн-статуси)
  useSocketConnection();
  usePresenceEvents();

  // localStorage може містити застарілі дані профілю після зміни облікового запису.
  // Підтверджуємо поточну роль через токен, щоб клієнтський інтерфейс і права API не розходилися.
  useEffect(() => {
    if (!accessToken) return;
    void authService
      .me()
      .then(({ data }) => setUser(data.data))
      .catch(() => {
        // Помилку авторизації обробить спільний Axios interceptor.
      });
  }, [accessToken, setUser]);

  // Анімація переходів між сторінками (рівень 3): useOutlet() фіксує поточний
  // піддерево маршруту, тому під час exit-анімації показується саме стара сторінка.
  const location = useLocation();
  const outlet = useOutlet();

  const visibleNav = DASHBOARD_NAV.filter(
    (item) => !('adminOnly' in item && item.adminOnly) || user?.role === 'ADMIN'
  );

  async function handleLogout() {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      await authService.logout(refreshToken ?? undefined);
    } catch {
      // навіть якщо сервер не відповів — локальну сесію завершуємо в будь-якому разі
    }
    logout();
    toast.success('Ви вийшли з системи');
    navigate('/login');
  }

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-gray-800 dark:hover:text-primary-300',
      isActive &&
        'bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-200',
      collapsed && 'justify-center px-2'
    );

  const sidebarContent = (
    <>
      <Link
        to="/"
        className="flex items-center gap-2 px-3 py-4 text-xl font-bold text-primary-600"
        onClick={() => setMobileOpen(false)}
      >
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 4v22M9 26h14M16 7l-8 3.5 3.6 6.8a4.2 4.2 0 0 1-7.2 0L8 10.5 0 7m16 0 8 3.5-3.6 6.8a4.2 4.2 0 0 0 7.2 0L24 10.5 32 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="scale(0.9) translate(1.5 1.5)"
          />
        </svg>
        {!collapsed && <span className="truncate">{APP_NAME}</span>}
      </Link>
      <nav className="flex flex-col gap-1 px-2" aria-label="Розділи кабінету">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={navLink}
            title={collapsed ? item.label : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <NavIcon name={item.icon} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-2 py-3">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="hidden w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:flex dark:hover:bg-gray-800"
          aria-label={collapsed ? 'Розгорнути панель' : 'Згорнути панель'}
        >
          <svg
            className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200 md:flex dark:border-gray-800 dark:bg-gray-900',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (поверх контенту) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
            aria-label="Відкрити меню"
            onClick={() => setMobileOpen(true)}
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">Вітаємо,</p>
            <p className="truncate font-semibold">{user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Перемкнути тему"
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path
                    d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <Button size="sm" variant="secondary" onClick={handleLogout}>
              Вийти
            </Button>
          </div>
        </header>

        <main className="container mx-auto w-full flex-grow px-4 py-6">
          <ErrorBoundary>
            {/* Без mode="wait": cold-lazy chunk нової сторінки підвішує перехід,
                і стара сторінка лишалася б назавжди. Паралельний fade-in/fade-out
                (sync) показує спинер всередині нового контейнера й не блокує вихід старої. */}
            <AnimatePresence initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {/* Suspense саме тут, всередині анімаційного контейнера: lazy-чанк нової
                    сторінки показує спинер всередині свого контейнера, а не підвішує
                    перехід (інакше стара сторінка залишається на екрані назавжди) */}
                <Suspense fallback={<Loading text="Завантаження сторінки..." />}>{outlet}</Suspense>
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
