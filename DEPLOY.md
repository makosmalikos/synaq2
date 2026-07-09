# Деплой на Vercel — простой путь (один проект)

Проект собран как **одно приложение** (Vite + папка `api/` внутри `frontend`).
Vercel больше НЕ будет предлагать разбивать на два сервиса.

## Шаги

1. Залей содержимое этого архива в свой GitHub-репозиторий (замени старые файлы).
2. В Vercel: **Add New → Project** → выбери репозиторий.
3. **Root Directory** → нажми **Edit** → выбери папку **`frontend`**. Это главное отличие.
   - Framework определится сам как **Vite**. Экрана с двумя сервисами не будет.
4. Открой **Environment Variables** и добавь 6 ключей Firebase (`VITE_FIREBASE_*`)
   из `frontend/.env.example`. Если ключей пока нет — пропусти, откроется демо-режим.
5. Нажми **Deploy**.

Проверка: после деплоя открой `https://твой-проект.vercel.app/api/health` —
должно показать `{"ok":true,"service":"synaq-api"}`. Значит backend работает.

## Firebase (когда будут ключи)
- Authentication → Sign-in method: включи **Email/Password** и **Google**.
- Authentication → Settings → Authorized domains: добавь домен Vercel.
- Firestore: создай базу, опубликуй правила из `firestore.rules`.

## Локальный запуск
```bash
cd frontend
npm install
npm run dev:api   # API на :4000 (в отдельном терминале)
npm run dev       # сайт на :5173
```
