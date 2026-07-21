# Backend data (`backend/data/`)

The **canonical question bank** lives in `frontend/src/data.js` and is wired through `frontend/src/bank.js`.

These backend files exist for:

- `backend/routes/training.js` — legacy REST `/api/training/*` on Vercel
- `backend/routes/mock.js` — `/api/mock/*` (РФМШ fixed variants from `mockVariants.js`)

When updating tasks for the app, edit **`frontend/src/data.js`** only.  
Re-sync `backend/data/bilQuestions.js` / `questions.js` only if the Express training API must mirror changes.
