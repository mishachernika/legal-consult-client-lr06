import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { APP_NAME, ROUTES } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import NotificationBell from '@/components/NotificationBell';
import { cn } from '@/utils/cn';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded px-2 py-1 transition-colors hover:text-primary-600',
    isActive && 'font-semibold text-primary-600'
  );

function ThemeIcon({ theme }: { theme: 'light' | 'dark' }) {
  // Іконки теми — SVG замість емодзі
  return theme === 'dark' ? (
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
  );
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md dark:bg-gray-900">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link
          to={ROUTES.home}
          className="flex items-center gap-2 text-2xl font-bold text-primary-600"
        >
          <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M16 4v22M9 26h14M16 7l-8 3.5 3.6 6.8a4.2 4.2 0 0 1-7.2 0L8 10.5 0 7m16 0 8 3.5-3.6 6.8a4.2 4.2 0 0 0 7.2 0L24 10.5 32 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="scale(0.9) translate(1.5 1.5)"
            />
          </svg>
          {APP_NAME}
        </Link>

        {/* Десктопне меню */}
        <div className="hidden items-center gap-6 md:flex">
          <NavLink to={ROUTES.home} end className={navLinkClass}>
            Головна
          </NavLink>
          <NavLink to={ROUTES.about} className={navLinkClass}>
            Про нас
          </NavLink>
          {user ? (
            <NavLink to="/dashboard" className={navLinkClass}>
              Панель ({user.name})
            </NavLink>
          ) : (
            <>
              <NavLink to={ROUTES.login} className={navLinkClass}>
                Увійти
              </NavLink>
              <NavLink to="/register" className={navLinkClass}>
                Реєстрація
              </NavLink>
            </>
          )}
          {user && <NotificationBell />}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Перемкнути тему"
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>

        {/* Кнопка мобільного меню */}
        <div className="flex items-center gap-2 md:hidden">
          {user && <NotificationBell />}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Перемкнути тему"
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ThemeIcon theme={theme} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Меню"
            aria-expanded={menuOpen}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Мобільне меню (адаптивність) */}
      {menuOpen && (
        <div className="border-t border-gray-100 px-4 py-3 md:hidden dark:border-gray-800">
          <div className="flex flex-col gap-2">
            <NavLink
              to={ROUTES.home}
              end
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Головна
            </NavLink>
            <NavLink to={ROUTES.about} className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Про нас
            </NavLink>
            {user ? (
              <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Панель ({user.name})
              </NavLink>
            ) : (
              <>
                <NavLink
                  to={ROUTES.login}
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  Увійти
                </NavLink>
                <NavLink to="/register" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Реєстрація
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
