import { auth } from './firebase.js';
import { authenticatedRequest } from './authenticatedRequest.js';

const request = (body) => authenticatedRequest(auth, '/api/mock-session', { body });

export const mockCatalog = () => request({ action: 'catalog' });
export const mockStart = ({ id, school, weekKey, preview = false, excludeQuestionIds = [] }) => request({ action: 'start', id, school, weekKey, excludeQuestionIds, ...(preview ? { preview: true } : {}) });
export const mockResume = (id) => request({ action: 'resume', id });
export const mockSubmit = (id, answers) => request({ action: 'submit', id, answers }).then((data) => data.result);
export const reviewQuestionIds = (review = []) => [...new Set(review.map((item) => item?.qid).filter(Boolean))];

export const weeklyMockCheckout = () => authenticatedRequest(auth, '/api/weekly-mock-checkout');

export const mockPhase = (id, change) => request({action:'phase',id,...change});
