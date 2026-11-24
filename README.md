# Лабораторна робота 06 Реалізація розширених можливостей та розгортання клієнтської частини

## Автор

Чернік Михайло Богданович, група ІПЗ-41

## Опис проєкту

React-клієнт для **онлайн-платформи юридичних консультацій**. Серверна частина — окремий репозиторій `legal-consult-api-lr03` (Node.js + Express + Prisma + PostgreSQL + Socket.io). ЛР06 завершує проєкт: додає реальний час, PWA, інтерактивні компоненти, оптимізацію збірки, тести та підготовку до деплою.

## Нове в ЛР06

- Socket.io-client: одне кероване з'єднання, JWT у handshake, reconnect, replay подій, присутність користувачів, індикатор підключення та real-time лічильник непрочитаних;
- доступні модальні вікна на Headless UI: портал, focus trap, Escape, блокування фону й анімація;
- Dashboard Workspace: графік статусів (Recharts), tab-и, календар, пошукове dropdown-поле, dnd-kit для пріоритетів, rich-text нотатка й вибір аватара з preview/масштабом;
- lazy loading усіх маршрутів і окремі chunks для React, Query, Socket.io та Recharts;
- PWA: web manifest, service worker, precache статичних ресурсів і Stale-While-Revalidate для публічного довідника;
- SEO/OG meta-теги, `vercel.json`, готовий GitHub Actions workflow та Vitest-тести.

## Функціональність

- Аутентифікація JWT (login/register, refresh-on-401), сесія у Zustand з `persist` (localStorage `auth-storage`)
- Захищені маршрути (`ProtectedRoute`, редірект на `/login` із поверненням на `state.from`)
- Панель керування (Dashboard) з адаптивною бічною панеллю (згортання на desktop, overlay на mobile)
- CRUD консультацій: список (пошук + фільтр за статусом + пагінація), створення/редагування (форма з вибором юриста), детальна сторінка (зміна статусу за роллю, чат, відгук, видалення з модальним підтвердженням)
- Каталог юристів: пошук, фільтр за сферою права, сортування (рейтинг/ціна/досвід), пагінація, детальна сторінка з відгуками
- Сфери права: локальний пошук у довіднику; адмін-операції (create/edit/delete) лише для ролі ADMIN
- Сповіщення: список, фільтр непрочитаних, «прочитати все», видалення
- Валідація форм: React Hook Form + Zod 4 (`zodResolver`, `z.input`/`z.output`)
- Дані сервера: TanStack Query (`useQuery`/`useMutation`, `invalidateQueries`, `keepPreviousData`); клієнтський стан сесії: Zustand
- Сповіщення про успіх/помилки: react-hot-toast; централізована помилка Axios (interceptors + `getErrorMessage`)
- UX: скелетні індикатори (Skeleton/TableSkeleton/CardGridSkeleton), debounce-пошук, breadcrumbs, порожні стани, темна тема

## Технології

- React 19 + TypeScript 6
- Vite 8 (Rolldown)
- Tailwind CSS 4 (`@theme`, `@custom-variant dark`)
- React Router 8
- Axios (interceptors: токен із store, refresh-on-401, нормалізація помилок)
- React Hook Form 7 + Zod 4 + @hookform/resolvers
- Zustand 5 (persist) — сесія користувача
- TanStack Query 5 — дані сервера (кеш за queryKey, інвалідація)
- react-hot-toast — toast-сповіщення
- Socket.io-client, Headless UI, dnd-kit, Recharts, react-day-picker
- vite-plugin-pwa, Vitest + Testing Library
- ESLint 10 (flat config) + Prettier

## API-ендпоінти серверної частини (legal-consult-api-lr03)

| Метод | Шлях | Призначення |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` · `/api/auth/refresh` · `/api/auth/logout` · `/api/auth/me` | аутентифікація, сесія |
| GET/POST | `/api/consultations` · GET/PUT/DELETE `/api/consultations/:id` | CRUD консультацій |
| GET/POST | `/api/consultations/:id/messages` | чат консультації |
| GET | `/api/lawyers` (search, specializationId, minPrice/maxPrice, sortBy, order, page, limit) · GET `/api/lawyers/:id` | каталог юристів |
| GET | `/api/specializations` · POST/PUT/DELETE (ADMIN) | сфери права |
| GET | `/api/notifications` (unread, page, limit) · POST `/:id/read`, `/read-all` · DELETE `/:id` | сповіщення |
| POST | `/api/reviews` | відгук після завершеної консультації |
| GET | `/api/users` (лише ADMIN) | вибір клієнта у формі (адмін) |

## Встановлення та запуск

### Вимоги

- Node.js 24 LTS
- Запущена серверна частина з ЛР03 на `http://localhost:3000`

### Інструкції

```bash
git clone https://github.com/mishachernika/legal-consult-client-lr05.git
cd legal-consult-client-lr05
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:3000/api
npm run dev                  # http://localhost:5173
npm run lint                 # ESLint
npm run format:check         # Prettier
npm run build                # typecheck + продакшен-збірка
npm run preview              # перегляд збірки на :4173
npm test                     # unit-тести компонентів і хуків
```

### Тестовий обліковий запис (seed сервера ЛР03)

```
Email: admin@legal.ua   (також юристи *@legal.ua, клієнти *@example.com)
Password: password123
```

## Структура проєкту

```
src/
├── components/
│   ├── common/        # Button, Input, Select, Textarea, Card, Badge, Loading, FormField,
│   │                  # ErrorMessage, Skeleton-и, Modal, Table, Grid, List, Pagination,
│   │                  # Breadcrumbs, EmptyState, ErrorBoundary
│   ├── layout/        # Header, Footer, Layout (публічні) + DashboardLayout (sidebar кабінету)
│   └── ProtectedRoute.tsx
├── pages/             # Home, About, NotFound, Login, Register, Dashboard, Consultations*,
│                      # Lawyers*, Specializations*, Notifications
├── services/          # api.ts (Axios + інтерцептори) + auth/users/lawyers/consultations/
│                      # specializations/notifications/reviews сервіси
├── stores/            # authStore.ts (Zustand persist — сесія)
├── schemas/           # Zod-схеми форм (auth, consultation, specialization)
├── types/             # типи API (api.types.ts, auth.types.ts) — під схему Prisma сервера
├── hooks/             # useTheme, useDebounce
├── utils/             # format.ts, cn.ts, errors.ts
└── constants/         # APP_NAME, ROUTES, DASHBOARD_NAV, CONTACTS, лейбли enum'ів
```

Абсолютні імпорти `@/` — у `tsconfig.app.json` (`paths`) і `vite.config.ts` (`resolve.alias`).

## Демонстрація роботи

### 1. Вхід і валідація форм

Сторінки входу й реєстрації використовують React Hook Form + Zod. Некоректні дані не надсилаються на сервер, а помилки відображаються поруч із відповідними полями.

![Вхід до LegalConsult](reports/screenshots/lab5-login.png)

![Помилки валідації під час входу](reports/screenshots/lab5-login-validation.png)

### 2. Захищений особистий кабінет

Після входу користувач потрапляє на Dashboard. Стан сесії зберігається у Zustand, а верхня панель дозволяє змінити тему або коректно завершити сесію через API.

![Панель керування LegalConsult](reports/screenshots/lab5-dashboard.png)

![Dashboard у темній темі](reports/screenshots/lab5-dashboard-dark.png)

### 3. Консультації: повний робочий сценарій

Реалізовано серверний пошук і фільтрацію, пагінацію, створення та редагування заявок відповідно до ролі користувача, модальне підтвердження видалення, чат і відгуки після завершення консультації.

![Список консультацій із пошуком та фільтром](reports/screenshots/lab5-consultations.png)

![Валідація форми створення консультації](reports/screenshots/lab5-consultation-form-validation.png)

![Детальна сторінка консультації](reports/screenshots/lab5-consultation-detail.png)

![Чат учасників консультації](reports/screenshots/lab5-consultation-chat.png)

### 4. Каталог юристів і довідники

Каталог юристів має пошук із debounce, фільтр за сферою права, серверне сортування та пагінацію. Адміністратор може підтримувати довідник сфер права.

![Каталог юристів](reports/screenshots/lab5-lawyers.png)

![Профіль юриста з відгуками](reports/screenshots/lab5-lawyer-detail.png)

![Адміністрування сфер права](reports/screenshots/lab5-specializations.png)

### 5. Сповіщення та адаптивність

Користувач переглядає, позначає прочитаними та видаляє власні сповіщення. На малих екранах бічна панель відкривається поверх контенту.

![Список сповіщень](reports/screenshots/lab5-notifications.png)

![Мобільна бічна панель](reports/screenshots/lab5-mobile-sidebar.png)

### Перевірка якості

![Успішні lint, форматування та production build](reports/screenshots/lab5-terminal-build.png)

## CI

`.github/workflows/ci.yml` — на кожен push у `main`: `npm ci` → `npm run lint` → `npm run format:check` → `npm run build` (Node 24).

## Розгортання на Vercel

У корені є `vercel.json` для SPA routing і `.github/workflows/deploy.yml` для CI/CD. Перед першим деплоєм потрібно створити Vercel-проєкт і задати секрети GitHub Actions: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

На Vercel додайте змінні середовища:

```text
VITE_API_URL=https://<ваш-api>/api
VITE_SOCKET_URL=https://<ваш-api>
```

Після отримання URL клієнта задайте його як `FRONTEND_URL` серверної частини та перезапустіть API, щоб CORS і Socket.io приймали клієнт.

## Перевірка перед здачею

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Для інтеграційної перевірки запустіть API ЛБ03 із PostgreSQL, а потім клієнт. Перевірте в двох вкладках: створення консультації, нове повідомлення в чаті, сповіщення та статус online. Для PWA відкрийте production build, встановіть застосунок через браузер і перевірте офлайн-екран після першого завантаження.
