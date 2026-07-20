# Synaq — подготовка к РФМШ · НИШ · БИЛ

Онлайн-платформа для детей 10–12 лет: тренировка по темам, мок-тесты, дуэли с другом, AI-разбор ошибок (Gemini).

**Репозиторий:** [github.com/makosmalikos/synaq2](https://github.com/makosmalikos/synaq2)

## Быстрый старт

```bash
# Терминал 1 — бэкенд (опционально, фронт работает и без него)
cd backend && npm install && npm start    # http://localhost:4000

# Терминал 2 — приложение
cd frontend && npm install && npm run dev  # http://localhost:5173
```

Фронт хранит банк задач локально (`frontend/src/data.js`, `bank.js`). Бэкенд нужен для legacy API и локальной разработки.

## Что внутри

| Модуль | Описание |
|--------|----------|
| **frontend/** | React + Vite — тренировка, мок-тесты, дуэль, прогресс, кабинет родителя |
| **backend/** | Express API — банк задач, генераторы похожих задач |
| **api/** | Vercel serverless — Gemini (`/api/explain`), оплата, Express-прокси |
| **landing/** | Waitlist-лендинг (отдельный деплой) |
| **firestore.rules** | Правила Firebase (семьи, результаты, дуэли, кэш разборов) |

## Дуэль (real-time)

1. Ребёнок открывает **Дуэль** → «Дуэль құру»
2. Копирует ссылку вида `https://ваш-домен/app?duel=ABC123`
3. Друг входит по ссылке → попадает в комнату
4. Хост нажимает **Бастау** → 10 задач (половина из банка, половина — сгенерированные «похожие»)
5. 45 секунд на раунд, счёт в реальном времени через Firestore

После деплоя опубликуйте обновлённые `firestore.rules` в Firebase Console.

## Gemini (AI-разбор)

Разбор ошибок идёт через `/api/explain` (модель `gemini-2.0-flash`).

**Vercel → Settings → Environment Variables:**

| Переменная | Значение |
|------------|----------|
| `GEMINI_API_KEY` | Ключ с [aistudio.google.com](https://aistudio.google.com) |
| `FIREBASE_WEB_KEY` | (опционально) Web API key Firebase для проверки токена |

Готовые разборы кэшируются в Firestore (`explanations/{qid_lang}`).

## Деплой на Vercel (один проект)

1. Импортируй репозиторий на [vercel.com](https://vercel.com)
2. **Root Directory** — корень (там `vercel.json`)
3. Добавь `GEMINI_API_KEY` в Environment Variables
4. Deploy

Firebase (один раз):

1. Authentication → Email/Password + Google
2. Firestore → production, регион eur3
3. Rules → вставь `firestore.rules` → Publish
4. Authorized domains → добавь `*.vercel.app` и свой домен

Подробнее: `FIREBASE_SETUP.md`, `Synaq_BRD_PRD_TRD.md`.

## Локальная разработка API

```bash
cd backend && npm start          # :4000
cd frontend && npm run dev       # прокси /api → :4000
```

На Vercel фронт ходит на `/api/explain` и `/api/training/*` на том же домене.

## Структура банка (backend/data/)

- `topics.js` — 12 тем (математика + логика)
- `questions.js` — 8 вариантов РФМШ-2025 (~250 задач)
- `generators.js` — генераторы похожих задач (куры/овцы, проценты, отношения, трубы)
- `bilQuestions.js`, `nishQuestions.js` — БИЛ и НИШ

## Автор

Подготовка к вступительным экзаменам в элитные школы Казахстана.
