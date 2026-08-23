# BIL/KTL Problem Bank (work in progress)

## Scan summary (2026-07-23)

| Source | Files | Notes |
|--------|------:|-------|
| `Desktop/аааа` | 92 PDF + 5 DOC | Not text-extracted yet (`pdftotext` missing) |
| `Downloads/2. БИЛ.КТЛ` | 139 PDF + docs | Same |
| `BIL_ТЕКСТ_вопросы_ответы.txt` | 1 | Full text for math + logic |
| `BIL_вопросы_ответы.txt` | 1 | Image MCQ (answer letters only) |

## Organized output

| File | Count | Solutions |
|------|------:|-----------|
| `math/math.md` | 1426 | 36 full step-by-step; rest need manual/OCR answers |
| `logic/logic.md` | 105 | OCR text; answers missing in source |
| `visual/visual.md` | 2259 | Letter answer + **IMAGE REQUIRED** marker |

**Total in markdown:** 3790 unique problems (deduped by text hash).

## Not included

- Қазақ / орыс / ағылшын тілі sections from TXT (language tests, not math/logic/visual).
- ~231 PDF files — require `pdftotext` or manual OCR pass.

## Rebuild

```bash
python3 tools/build_problems_bank.py
```

## Next steps

1. Install poppler (`brew install poppler`) → extract PDF text/images.
2. Match visual MCQ to PDF figure paths.
3. Batch-solve math items without `✓ —` answers.
4. Fix OCR in logic section (106 items).
