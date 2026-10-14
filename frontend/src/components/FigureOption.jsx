import React from 'react';
import './FigureOption.css';

const LEGACY_IMAGES = ['/figures/bil_v1_q14.png', '/figures/bil_v1_q14.svg'];
// Картинки-варианты: /figures/opts/<папка>/A.png … E.png, общий рисунок задачи — q.png.
const OPTS_RE = /^\/figures\/opts\/([^/]+)\/([^/]+)\.png$/;
const letterOptions = (question) => question?.options?.length >= 2
  && question.options.every((value, index) => value === 'ABCDEFGH'[index]);

// Match the asset as well as the question ID: public and server mocks may remap IDs.
export function hasFigureOptions(question) {
  if (LEGACY_IMAGES.includes(question?.image)) {
    return question.options?.length === 5 && question.options.every((value, index) => value === 'ABCDE'[index]);
  }
  return OPTS_RE.test(question?.image || '') && letterOptions(question);
}

// Общий рисунок над вариантами (если он есть).
export function mainFigureSrc(question) {
  if (!question?.image) return null;
  if (!hasFigureOptions(question)) return question.image;
  const m = OPTS_RE.exec(question.image);
  return m && m[2] === 'q' ? question.image : null;
}

export default function FigureOption({ question, value }) {
  if (!hasFigureOptions(question)) return <span>{value}</span>;
  const m = OPTS_RE.exec(question.image);
  if (m) return <img className="figure-option-art" src={`/figures/opts/${m[1]}/${value}.png`} alt="" aria-hidden="true" />;
  return <img className="figure-option-art" src={`/figures/bil-half/${value}.svg`} alt="" aria-hidden="true" />;
}
