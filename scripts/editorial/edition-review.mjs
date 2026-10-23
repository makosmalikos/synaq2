import crypto from 'node:crypto';

export function canonicalEdition(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalEdition).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalEdition(value[key])).join(',') + '}';
  }
  if (typeof value === 'number' && !Number.isFinite(value)) throw Error('Invalid edition number');
  return JSON.stringify(value);
}
export const editionHash = row => crypto.createHash('sha256').update(canonicalEdition(row), 'utf8').digest('hex');
