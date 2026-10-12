# Backend data (`backend/data/`)

The **canonical question bank** lives in `frontend/src/data.js` and is wired through `frontend/src/bank.js`.

These backend files exist for:

- `backend/routes/training.js` and `backend/routes/mock.js` — legacy REST handlers. They are **not mounted** any more (they returned answers without authentication). Kept only as reference; do not mount them again without authentication.

When updating tasks for the app, edit **`frontend/src/data.js`** only.  
Re-sync `backend/data/bilQuestions.js` / `questions.js` only if the Express training API must mirror changes.
