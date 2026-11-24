# Звіт — лабораторна робота №6
## Реалізація розширених можливостей та розгортання клієнтської частини

**Студент:** Чернік Михайло Богданович, ІПЗ-41
**Проєкт:** клієнтська частина платформи юридичних консультацій (`legal-consult-client-lr06`)
**Серверна частина:** `legal-consult-api-lr03` (Node.js + Express + Prisma + PostgreSQL + Socket.io)

## 1. Мета роботи

Здобути практичні навички впровадження функціональності реального часу (WebSocket), створення розширених UI-компонентів, оптимізації продуктивності та розгортання React-застосунку на хостинг-платформі.

## 2. Виконання завдань

### Рівень 1. Функціональність реального часу та базові компоненти

| № | Завдання | Реалізація |
|---|----------|------------|
| 1 | Socket.io-client | `src/services/socket.ts`: єдиний екземпляр (`autoConnect: false`), JWT у `socket.auth` під час `connectSocket`, `disconnectSocket` на вихід; URL — `VITE_SOCKET_URL` без `/api` |
| 2 | Сповіщення в реальному часі | `NotificationBell` + `useSocketEvent('notification')`; сховище `notificationsStore` (Zustand), непрочитані — селектор `selectUnreadCount` |
| 3 | Онлайн-статуси | `usePresenceEvents` (`user:online`/`user:offline`) → `onlineStore`; компонент `OnlineStatus` у шапці кабінету |
| 4 | Оновлення списків у реальному часі | подія `users:changed` → `queryClient.invalidateQueries(['users'])` на сторінці користувачів |
| 5 | Модальні вікна | `Modal` (Headless UI 2 `Dialog`: портал, focus trap, Escape, `transition` + `data-closed:`) та `ConfirmDialog` — заміна `window.confirm` на сторінках списків |
| 6 | Таби | `Tabs` на `TabGroup`/`TabList`/`Tab`/`TabPanels` — Dashboard: Огляд / Аналітика / Планувальник |
| 7 | Dropdown з пошуком | `SearchCombobox` (Headless UI `Combobox`) — вибір клієнта та юриста у формі консультації, пошук користувачів в адмін-розділі |

### Рівень 2. Розширені інтерактивні елементи

| № | Завдання | Реалізація |
|---|----------|------------|
| 8 | Drag and drop | `TaskBoard` на dnd-kit: `DndContext`, `SortableContext`, `useSortable`, `arrayMove`; працює і мишкою, і клавіатурою (`KeyboardSensor`) |
| 9 | Графіки | `StatsChart` на Recharts (`ResponsiveContainer`, LineChart/BarChart) — дані статусів консультацій з API через `useQuery` |
| 10 | Infinite scroll | каталог юристів: `useInfiniteQuery` + `IntersectionObserver` на елементі-сторожі; підтверджено 9 → 15 записів у e2e |
| 11 | Завантаження зображень | `AvatarUpload`: `<input type=file>` → preview (`URL.createObjectURL`) → обрізання `react-easy-crop` (`ImageCrop`) → canvas → `POST /api/files/upload` |
| 12 | Календар | `DateTimePicker` на `react-day-picker` — вибір запланованої дати консультації на Планувальнику та у формі |
| 13 | Rich text editor | `RichTextEditor` на Tiptap (StarterKit + placeholder) — опис у формі консультації; завантажується окремим chunkʼом через `SuspenseLatch` |
| 14 | Анімації переходів | Motion (пакет `motion`, `AnimatePresence`) у `DashboardLayout` між сторінками кабінету + CSS-переходи Tailwind на модалках |

### Рівень 3. Оптимізація та розгортання

| № | Завдання | Реалізація |
|---|----------|------------|
| 15 | Code splitting | усі сторінки — `lazy()` + `Suspense` (запасний `Loading`); чанк-мапа у README |
| 16 | Bundle size | окремі chunkи для Recharts (495 kB → лише Dashboard), Tiptap (404 kB → лише форма), react-easy-crop; tree shaking через іменовані імпорти; аналіз — `rollup-plugin-visualizer` (`BUILD_STATS=1`) |
| 17 | PWA | `vite-plugin-pwa`: маніфест (uk, standalone, іконки 192/512 + maskable), service worker, precache, NetworkFirst для `/api/files` і публічного довідника; офлайн-оболонка працює (`npm run preview` → Offline) |
| 18 | Кешування запитів | TanStack Query (staleTime, keepPreviousData) + runtime-кеш service worker; персональні ендпоінти навмисно не кешуються |
| 19 | SEO | `index.html`: title, description, lang=uk, theme-color, Open Graph + Twitter Card, apple-touch-icon |
| 20 | CI/CD | `.github/workflows/ci.yml` (lint → Prettier → Vitest → build) і `.github/workflows/deploy.yml` (Vercel; job пропускається, поки секрети не додані) |
| 21 | Розгортання | `vercel.json` (SPA-rewrite), інструкція у README; deploy виконується Actions-процесом після налаштування `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` |
| 22 | Фінальне тестування | юніт-тести 10/10, e2e 21/21 (деталі нижче), lint/prettier/typecheck/build — без помилок |

## 3. Реальний час: архітектурні рішення

1. **Одне з'єднання на застосунок.** Сокет створюється поза React і підключається лише з токеном (`connectSocket`), хук `useSocketConnection` викликається один раз у `Layout` — немає пливу підключень при кожному монтуванні компонентів.
2. **Чисті підписки.** `useSocketEvent` (з `useEffectEvent`) знімає саме власний обробник у cleanup — підписки інших компонентів на ту саму подію не зачіпаються; це перевірено тестом `NotificationBell`.
3. **Реальний час × TanStack Query.** Замість ручного редагування масивів — `invalidateQueries` на серверні події; чат consultation використовує `message:new`, сповіщення — `notification` в особистій кімнаті `user:<id>`.

## 4. Тестування

**Юніт-тести (Vitest + Testing Library) — 10 з 10:**
- `ConfirmDialog.test.tsx` — Escape, підтвердження, відображення повідомлення, стан завантаження;
- `NotificationBell.test.tsx` — подія збільшує лічильник, позначення прочитаним, зняття обробника після unmount;
- `ConsultationsListPage.test.tsx` — рендер таблиці, фільтри, інвалідація кешу;
- `useDebounce.test.tsx` — відкладене оновлення значення.

**E2E (`node reports/e2e.cjs`, Puppeteer + Chrome) — 21 з 21:**
логін → редірект; WS-handshake статус 101; таби Dashboard; графік Recharts; TaskBoard; drag-and-drop клавіатурою; завантаження аватара з crop-модалкою; список консультацій; Combobox (клієнт + юрист); Tiptap; створення консультації → редірект на деталі; доставка `message:new` у другу вкладку (інший акаунт — учасник консультації) без перезавантаження; infinite scroll юристів (9 → 15); сторінки спеціалізацій і сповіщень; мобільне меню; консоль без JS-помилок.

**Якість коду:** `tsc -b` — 0 помилок; `eslint .` — 0 error (1 допустиме попередження react-hooks про бібліотеку RHF); `prettier --check src` — OK; `npm run build` — успішно.

## 5. Вимірювання розміру збірки

```
index-*                  ~499 kB (gzip ~160 kB)  — оболонка застосунку
DashboardPage-*          ~495 kB (gzip ~144 kB)  — Recharts тільки тут
RichTextEditor-*         ~404 kB (gzip ~129 kB)  — Tiptap тільки тут
ConsultationFormPage-*   ~188 kB (gzip ~58 kB)
ImageCrop-*              ~26 kB (gzip ~8 kB)
інші сторінки            3–16 kB кожна
```

Початковий екран не завантажує графіки, редактор і роботу з зображеннями — усе розкладено за chunkами сторінок і важких модалок.

## 6. Розгортання (Vercel)

- репозиторій підключено до Vercel-схеми через GitHub Actions (`deploy.yml`): Vercel CLI → `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt`;
- для активації CD потрібні секрети `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; поки їх немає — job пропускається і CI лишається зеленим;
- змінні середовища клієнта: `VITE_API_URL=https://<api>/api`, `VITE_SOCKET_URL=https://<api>` (підставляються під час збірки); на сервері — `FRONTEND_URL` з адресою клієнта (CORS + Socket.io);
- `vercel.json` переписує всі шляхи на `index.html` — прямі переходи за URL  не дають 404.

## 7. Контрольні питання

1. **Чим WebSocket відрізняється від HTTP?** HTTP запити завжди ініціює клієнт; WebSocket — повнодуплексне з'єднання поверх одного TCP, сервер може надсилати дані без запиту. Socket.io додає перепідключення, кімнати, broadcast і резервний long-polling.
2. **Чому сокет створюється один раз, а не в кожному компоненті?** Кожне монтування компонента інакше давало б нове підключення/відключення; єдине з'єднання керується в `Layout`, компоненти лише підписуються на події.
3. **Яка поширена помилка підписок у React?** Не знімати обробник або знімати чужі: `socket.off(event)` без аргументу прибирає підписки всіх компонентів, тому знімається саме свій хендлер за посиланням (`socket.off(event, handler)`).
4. **Що дає Headless UI порівняно з "ручним" modal?** Готові доступність (портал, focus trap, Escape, aria) і поведінка без нав'язування стилів; анімація вмикається атрибутом `transition`.
5. **Чому бібліотека графіків не в основному bundle?** `React.lazy` + динамічний `import()` виділяють її в окремий chunk сторінки Dashboard; Vite/Rolldown робить це автоматично.
6. **Як працює infinite scroll у каталозі?** `useInfiniteQuery` тримає список сторінок, IntersectionObserver на "сторожі" в кінці списку тригерить `fetchNextPage`, коли користувач доскролює.
7. **Стратегії кешування service worker?** `CacheFirst` — статика; `NetworkFirst` — API (свіжість важливіша); `StaleWhileRevalidate` — швидка відповідь з кешу + оновлення у фоні. Персональні дані не кешуються довго з міркувань приватності.
8. **Що підставляється на етапі збірки?** Змінні `VITE_*` — під час build, тому після їх зміни потрібне повторне розгортання.
9. **Навіщо SPA-rewrite на Vercel?** Прямий перехід на `/users` без rewrite дає 404 — сервер не знає про client-side маршрути; rewrite Sentinel повертає `index.html` для всіх шляхів.
10. **Як CI/CD пов'язані?** CI перевіряє кожен push (lint, тести, збірка); CD розгортає у прод лише після успішного CI і тільки з `main` — плюс захисна умова, поки секрети Vercel не задані.

## 8. Висновки

У ході лабораторної роботи застосунок доведено до стану готового до продакшену: реальний час працює у чаті, сповіщеннях і статусах присутності; інтерактивні компоненти (модалки, таби, combobox, dnd, графіки, календар, crop-аватар, rich text) покривають всі завдання рівнів; збірка розбита на chunkи, PWA працює офлайн, додано SEO-метатеги. Якість підтверджено юніт- і e2e-тестами (10/10 і 21/21), чистим lint/typecheck/build; підготовлено CI та інструкцію розгортання на Vercel.
