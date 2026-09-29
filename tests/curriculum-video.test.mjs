import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const curriculum = readFileSync(new URL('../frontend/src/Curriculum.jsx', import.meta.url), 'utf8');
const video = readFileSync(new URL('../frontend/src/CurriculumVideoLesson.jsx', import.meta.url), 'utf8');

test('place-value pilot is attached only to the first grade-three review lesson', () => {
  assert.match(curriculum, /topic\.key==='g3-review-1'/);
  assert.match(curriculum, /<CurriculumVideoLesson lang=\{lang\} onComplete=/);
});

test('number-comparison video is attached to the next grade-three lesson', () => {
  assert.match(curriculum, /topic\.key==='g3-review-2'/);
  assert.match(curriculum, /lesson="compare-100"/);
  assert.match(video, /47 саны 32 санынан үлкен/);
  assert.match(video, /54 меньше 59/);
  assert.match(curriculum, /import\.meta\.env\.DEV&&auth\.currentUser\?\.email==='therayisl@synaq\.kids'/);
  assert.match(curriculum, /localVideoPreview&&t\.key==='g3-review-2'/);
});

test('pilot explains the topic first and only then opens separate exercises', () => {
  assert.match(video, /46 = 40 \+ 6/);
  assert.doesNotMatch(video, /58 санында неше ондық бар/);
  assert.doesNotMatch(video, /Сколько десятков в числе 58/);
  assert.match(video, /onComplete/);
  assert.match(video, /place-value-natural/);
  assert.match(video, /compare-100-natural/);
  assert.match(video, /<audio ref=\{audioRef\}/);
  for (const locale of ['kk', 'ru']) {
    for (let scene = 1; scene <= 5; scene += 1) {
      const audio = new URL(`../frontend/public/audio/curriculum/place-value-natural/${locale}-${scene}.mp3`, import.meta.url);
      assert.ok(statSync(audio).size > 1000, `missing narration: ${locale}-${scene}`);
      const comparisonAudio = new URL(`../frontend/public/audio/curriculum/compare-100-natural/${locale}-${scene}.mp3`, import.meta.url);
      assert.ok(statSync(comparisonAudio).size > 1000, `missing comparison narration: ${locale}-${scene}`);
    }
  }
});
