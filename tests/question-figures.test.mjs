import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { POOL } from '../frontend/src/bank.js';
const publicRoot = new URL('../frontend/public/', import.meta.url);
const mapping = JSON.parse(readFileSync(new URL('../scripts/figures/asset-map.json', import.meta.url), 'utf8'));

test('active question illustrations use existing vector assets', () => {
  for (const q of POOL.filter(q => q.image)) {
    // Векторные рисунки; исключение — отсканированные рисунки пробных экзаменов НИШ (PNG).
    assert.match(q.image, /\.svg$|^\/figures\/(opts\/[A-Za-z0-9_]+|nis\d{4})\/[A-Za-z0-9_]+\.png$/i, q.id);
    assert.ok(existsSync(new URL(q.image.slice(1), publicRoot)), `${q.id}: ${q.image}`);
  }
});
test('replacement vectors contain geometry rather than embedded scans', () => {
  assert.equal(Object.keys(mapping).length, 114);
  for (const asset of Object.values(mapping)) {
    const svg = readFileSync(new URL(asset.slice(1), publicRoot), 'utf8');
    assert.match(svg, /<svg\b[^>]*viewBox=/, asset);
    assert.doesNotMatch(svg, /<image\b|<script\b|<foreignObject\b|data:image/i, asset);
  }
});
