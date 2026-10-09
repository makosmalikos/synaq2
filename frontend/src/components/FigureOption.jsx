import React from 'react';
import './FigureOption.css';

// Match the asset as well as the question ID: public and server mocks may remap IDs.
export function hasFigureOptions(question) {
  return ['/figures/bil_v1_q14.png', '/figures/bil_v1_q14.svg'].includes(question?.image)
    && question.options?.length === 5
    && question.options.every((value, index) => value === 'ABCDE'[index]);
}

export default function FigureOption({ question, value }) {
  if (!hasFigureOptions(question)) return <span>{value}</span>;
  return <img className="figure-option-art" src={`/figures/bil-half/${value}.svg`} alt="" aria-hidden="true" />;
}
