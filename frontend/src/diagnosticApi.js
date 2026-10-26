import { auth } from './firebase.js';
import { authenticatedRequest } from './authenticatedRequest.js';

const request = (body) => authenticatedRequest(auth, '/api/diagnostic-session', { body, prefix: 'diagnostic/' });

export const diagnosticStart = (id, grade) => request({ action: 'start', id, grade });
export const diagnosticResume = (id) => request({ action: 'resume', id });
export const diagnosticAnswer = (id, index, answer) => request({ action: 'answer', id, index, answer });
