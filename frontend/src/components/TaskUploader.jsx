import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `
Ты — ИИ-ассистент по образовательному контексту.
Твоя задача: точно распознавать и переписывать текст с фото, сканов и документов в текстовый формат.

Контекст:
- Задачи для подготовки к экзаменам и олимпиадам (казахский, русский, английский языки).

Формат и требования к оформлению:
1. Сохраняй оригинальную структуру, нумерацию заданий и абзацы.
2. Сохраняй варианты ответов (A, B, C, D и т.д.) в том же виде, как на изображении.
3. Формулы оформляй в формате LaTeX (например, $E = mc^2$ или $$\\frac{a}{b}$$).

Границы:
- Разрешено исправлять ТОЛЬКО явные грамматические/описки (если буква плохо пропечаталась).
- НЕ перефразируй и не меняй смысл.
- НЕ добавляй решения, пояснения или стороннюю информацию.
- Переписывай ровно то, что изображено.
`;

export default function TaskUploader() {
  const [apiKey, setApiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [filename, setFilename] = useState('');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: 'Ожидание', badgeClass: 'bg-secondary' });
  const [extractedText, setExtractedText] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', alertClass: '' });
  const [githubUrl, setGithubUrl] = useState('');

  const fileToGenerativePart = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setAlert({ show: false, message: '', alertClass: '' });
    setGithubUrl('');
    setLoading(true);
    setStatus({ text: 'Распознавание...', badgeClass: 'bg-warning text-dark' });

    try {
      // 1. Извлечение текста через Gemini AI API
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      const imagePart = await fileToGenerativePart(imageFile);
      const result = await model.generateContent([
        'Перепиши текст с этого изображения, строго соблюдая все инструкции.',
        imagePart,
      ]);

      const text = result.response.text();
      setExtractedText(text);

      // 2. Отправка результата в GitHub API
      setStatus({ text: 'Загрузка на GitHub...', badgeClass: 'bg-warning text-dark' });

      const repoOwner = 'makosmalikos';
      const repoName = 'synaq2';
      const pathInRepo = `tasks/${filename.trim()}`;
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${pathInRepo}`;

      const contentEncoded = btoa(unescape(encodeURIComponent(text)));

      const githubResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: `Автоматическое добавление задачи: ${filename}`,
          content: contentEncoded,
        }),
      });

      const githubData = await githubResponse.json();

      if (githubResponse.ok) {
        setStatus({ text: 'Успешно завершено', badgeClass: 'bg-success' });
        setAlert({
          show: true,
          message: 'Файл успешно создан и сохранен в репозитории!',
          alertClass: 'alert-success',
        });
        setGithubUrl(githubData.content.html_url);
      } else {
        throw new Error(`Ошибка GitHub API: ${githubData.message || 'Не удалось загрузить файл'}`);
      }
    } catch (error) {
      console.error(error);
      setStatus({ text: 'Ошибка', badgeClass: 'bg-danger' });
      setAlert({
        show: true,
        message: error.message || 'Произошла ошибка при обработке запроса.',
        alertClass: 'alert-danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 pb-5">
      <div className="row mb-4">
        <div className="col-12 text-center">
          <h2 className="fw-bold text-primary">
            <i className="fa-solid fa-graduation-cap me-2"></i>ИИ-Ассистент: Загрузка задач в GitHub
          </h2>
          <p className="text-muted">
            Автоматическое оцифрование сканов/фото (каз, рус, англ) и сохранение отдельным файлом в репозиторий
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Форма */}
        <div className="col-lg-5">
          <div className="card h-100 shadow-sm border-0 rounded-3">
            <div className="card-header bg-primary text-white font-weight-bold">
              <i className="fa-solid fa-sliders me-2"></i>Параметры и Загрузка
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="apiKey" className="form-label fw-semibold">Gemini API Key</label>
                  <input
                    type="password"
                    className="form-control"
                    id="apiKey"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="githubToken" className="form-label fw-semibold">GitHub Access Token</label>
                  <input
                    type="password"
                    className="form-control"
                    id="githubToken"
                    placeholder="ghp_..."
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    required
                  />
                </div>

                <hr className="my-4" />

                <div className="mb-3">
                  <label htmlFor="imageInput" className="form-label fw-semibold">Выберите фото или скан задачи</label>
                  <input
                    className="form-control"
                    type="file"
                    id="imageInput"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="filenameInput" className="form-label fw-semibold">Имя файла на GitHub</label>
                  <div className="input-group">
                    <span className="input-group-text">tasks/</span>
                    <input
                      type="text"
                      className="form-control"
                      id="filenameInput"
                      placeholder="task_math_01.md"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-text">
                    Файл сохранится в папку <code>tasks/</code> репозитория <code>makosmalikos/synaq2</code>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Обработка...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles me-2"></i>Распознать и отправить
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Результат */}
        <div className="col-lg-7">
          <div className="card h-100 shadow-sm border-0 rounded-3">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <span><i className="fa-solid fa-file-lines me-2"></i>Результат обработки</span>
              <span className={`badge ${status.badgeClass} rounded-pill px-3 py-2`}>
                {status.text}
              </span>
            </div>
            <div className="card-body d-flex flex-column">
              {alert.show && (
                <div className={`alert ${alert.alertClass} mb-3`} role="alert">
                  {alert.message}
                </div>
              )}

              <label className="form-label fw-semibold">Распознанный текст (Markdown/LaTeX):</label>
              <div
                className="p-3 bg-white border rounded font-monospace flex-grow-1"
                style={{
                  minHeight: '250px',
                  maxHeight: '450px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {extractedText ? (
                  extractedText
                ) : (
                  <span className="text-muted">Текст задачи появится здесь после обработки...</span>
                )}
              </div>

              {githubUrl && (
                <div className="mt-3">
                  <a href={githubUrl} target="_blank" rel="noreferrer" className="btn btn-outline-success w-100">
                    <i className="fa-brands fa-github me-2"></i>Открыть файл в GitHub
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
