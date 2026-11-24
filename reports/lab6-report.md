# Звіт — лабораторна робота №6

## Реалізовано

1. Socket.io-client із JWT, reconnect, replay подій, online-status і інвалідацією TanStack Query.
2. Реальні сповіщення та оновлення консультацій/юристів/чатів без ручного оновлення сторінки.
3. Headless UI `Dialog`: фокус, Escape, aria-modal і анімації.
4. Tab-и, пошуковий інструмент, drag-and-drop через dnd-kit, календар, rich-text нотатка, preview аватара.
5. Recharts на Dashboard для статистики статусів консультацій.
6. Lazy routes, manual chunks, PWA/service worker, кешування, SEO та Open Graph.
7. Vitest-тести для модального вікна й debounce; CI/CD конфігурація Vercel підготовлена локально.

## Перевірка

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Деплой не виконувався, оскільки проєкт навмисно не підключався до GitHub/Vercel. Після створення репозиторію достатньо додати секрети, описані у README, та виконати push у `main`.
