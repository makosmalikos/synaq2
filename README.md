# Synaq — мектеп сынағына дайындық

Монорепо для приложения подготовки к вступительным экзаменам в **РФМШ / НИШ / БИЛ** (7 класс).
Дизайн сохранён из исходного макета. Формат ответов — **открытый** (как на РФМШ), а не выбор из вариантов.

- **Frontend** — React + Vite (`frontend/`)
- **Backend** — Node + Express, serverless на Vercel (`backend/` + `api/[...path].js`)
- **Auth / DB** — Firebase Authentication + Firestore
- **Контент** — 240 задач из 8 официальных вариантов РФМШ-2025 (нұсқа 1–5, 7–9), одновременно и банк тренажёра, и 8 полных мок-тестов

## Роли и вход

- **Ата-ана (родитель)** — вход через **Google** или email/пароль. Создаёт семью, выбирает школу, добавляет ребёнка.
- **Оқушы (ребёнок)** — родитель генерирует **КОД + PIN**; ребёнок входит ими, без почты. Технически это служебный аккаунт `код@synaq.kids`, создаваемый через вторичный экземпляр Firebase (родитель не разлогинивается).

## Быстрый старт (локально)

```bash
# 1) Backend (порт 4000)
cd backend && npm install && npm run dev

# 2) Frontend (порт 5173, проксирует /api → 4000)
cd frontend && npm install && npm run dev
```

Откройте http://localhost:5173. Без ключей Firebase приложение работает в **демо-режиме**
(можно посмотреть весь UI; авторизация и сохранение результатов имитируются).

## Настройка Firebase (для реальной авторизации)

1. Создайте проект в [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Sign-in method**: включите **Email/Password** и **Google**.
3. **Firestore Database**: создайте базу (production mode, регион `eur3`).
4. Опубликуйте правила: `firebase deploy --only firestore:rules` (или вставьте `firestore.rules` в консоли).
5. **Project settings → Your apps → Web**: скопируйте конфиг в `frontend/.env` (см. `frontend/.env.example`).
6. Перезапустите `npm run dev` во `frontend`.

## Деплой на Vercel

Импортируйте репозиторий в Vercel. Настройки уже заданы в `vercel.json`:
- сборка фронтенда → `frontend/dist`;
- все `/api/*` обслуживает Express-функция `api/[...path].js`.

Во вкладке **Settings → Environment Variables** добавьте те же `VITE_FIREBASE_*`.
В **Authentication → Settings → Authorized domains** добавьте домен Vercel.

## Структура

```
synaq/
├─ api/[...path].js      # вход Vercel → Express
├─ backend/              # Express API (тренажёр, мок-тесты, проверка ответов)
│  ├─ app.js
│  ├─ data/              # topics.js, bank.js, variants.json (240 задач)
│  ├─ lib/check.js       # нормализация и проверка открытых ответов
│  └─ routes/            # training.js, mock.js
├─ frontend/             # React + Vite (дизайн, экраны, Firebase-клиент)
│  └─ src/
│     ├─ lib/            # firebase.js, api.js, auth.js, ui.js
│     └─ screens/        # Auth, ChildApp, ParentApp
├─ firestore.rules
└─ vercel.json
```

## О задачах

240 задач разобраны и по каждой посчитан ответ. **5 задач** зависят от конкретного
рисунка/узора в оригинальном PDF и помечены флагом `verify` — их ответы стоит сверить с
официальным ключом РФМШ (в приложении они показываются как «проверяется по ключу» и не влияют на балл).
Вариант №6 в исходных файлах отсутствовал — включены 8 вариантов: 1, 2, 3, 4, 5, 7, 8, 9.

Список отмеченных задач: см. `backend/data/VERIFY.md`.
