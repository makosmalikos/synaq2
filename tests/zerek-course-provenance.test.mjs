import test from 'node:test';
import assert from 'node:assert/strict';
import { courseAdaptationMetadata } from '../scripts/zerek-course-provenance.mjs';

const figure = { sourceAdapted: true, method: 'adapted_from_source_solution', visualReview: 'verified', adaptationNote: 'Distractors 3 and 4 were reconstructed.' };
const record = { sourceAdapted: true, adaptationNote: figure.adaptationNote, figureAdaptations: [figure] };

test('published adaptation keeps its disclosure without changing the source record', () => {
  const snapshot = structuredClone(record);
  assert.deepEqual(courseAdaptationMetadata(record), { sourceAdapted: true, adaptationNote: figure.adaptationNote });
  assert.deepEqual(record, snapshot);
  assert.deepEqual(courseAdaptationMetadata({}), {});
});

test('an adapted figure cannot be published after losing its flag, review or disclosure', () => {
  for (const invalid of [
    { ...record, sourceAdapted: undefined },
    { ...record, adaptationNote: ' ' },
    { ...record, figureAdaptations: [] },
    { ...record, figureAdaptations: [{ ...figure, visualReview: 'pending' }] },
    { ...record, figureAdaptations: [{ ...figure, adaptationNote: undefined }] },
  ]) assert.throws(() => courseAdaptationMetadata(invalid), /Adapted course figure/);
});
