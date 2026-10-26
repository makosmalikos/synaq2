import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {buildEditions, verifyEdition} from '../scripts/editorial/bil4-native-pyramid-models.mjs';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
const [row] = buildEditions();

test('BIL4 fifty source questions have local Standard+ editions including own native pyramid', () => {
  const dir = new URL('../problems/editorial/batches/', import.meta.url);
  const rows = fs.readdirSync(dir).filter(n => /^bil4-.*\.json$/.test(n))
    .flatMap(n => JSON.parse(fs.readFileSync(new URL(n, dir))).editions);
  assert.equal(rows.length, 50);
  assert.deepEqual(rows.map(r => Number(r.sourceRefs[0].sourceId)).sort((a,b) => a-b), Array.from({length:50}, (_,i) => i+1));
  assert.ok(rows.every(r => r.minimumPlan === 'pro'));
  assert.equal(verifyEdition(row).answer, 'E');
  const svg = fs.readFileSync(new URL('../frontend/public' + row.image, import.meta.url), 'utf8');
  assert.doesNotMatch(svg, /<(?:image|script|foreignObject)\b|href=|data:image/);
  assert.equal((svg.match(/id="[A-E]-face-/g) || []).length, 25);
});

test('BIL4 pyramid review signature binds full condition solution choices source access and geometry', () => {
  for (const key of ['statement','solution','answer','minimumPlan','modelId','figureSha256'])
    assert.throws(() => verifyEdition({...row, [key]: row[key] + ' changed'}));
  assert.throws(() => verifyEdition({...row, options: [...row.options].reverse()}));
  const changed = structuredClone(row);
  changed.sourceRefs[0].sourceId = '0';
  assert.throws(() => verifyEdition(changed));
});

test('BIL4 pyramid actual face folding rejects overlap and invalid changed geometry', () => {
  const p = spawnSync('python3', ['scripts/editorial/review-bil4-native-pyramid.py'], {
    cwd: new URL('..', import.meta.url), encoding:'utf8', timeout:30000
  });
  assert.equal(p.status, 0, p.stderr);
  const s = JSON.parse(p.stdout);
  assert.equal(s.verified, 1);
  assert.equal(s.actualNetFacePolygonsChecked, 25);
  assert.equal(s.sourceValidNet, 'B');
  assert.equal(s.newValidNet, 'E');
  assert.equal(s.validUpdatedHashActualWholeNetSwapTarget, 'A');
  assert.equal(s.updatedHashMalformedIsoscelesTriangleRejected, true);
  assert.equal(s.separateHumanReviewer, false);
});

test('BIL4 pyramid signed evidence covers four invalid nets and one complete five-face folding', () => {
  const report = JSON.parse(fs.readFileSync(new URL('../problems/editorial/reviews/bil4-native-pyramid.json', import.meta.url)));
  assert.equal(report.entries[0].sha256, editionHash(row));
  assert.equal(report.entries[0].figureReview.sha256, row.figureSha256);
  const {savedSource, rewritten} = report.evidence[0];
  assert.equal(savedSource.sourceReferenceSizesNotClaimedMeasuredRasterMetrics, true);
  assert.equal(savedSource.uniqueValidNet, 'B');
  const nets = rewritten.allFiveActualCandidateNetFoldingProofs;
  for (const key of ['A','B','C']) assert.equal(nets[key].failure.reason, 'two_actual_faces_fold_onto_same_pyramid_face');
  assert.equal(nets.D.failure.reason, 'triangle_would_need_to_cover_square_base');
  assert.equal(nets.E.allFiveDistinctPyramidFacesCovered, true);
  assert.ok(Object.values(nets).every(n => n.allFiveActualFacePolygonsCounted === 5 && n.allActualFaceInteriorsPairwiseDisjoint));
  assert.equal(rewritten.allEightActualBodyWireEdgesAndFiveEndpointIncidencesChecked, true);
  assert.equal(rewritten.validUpdatedHashActualWholeNetSwapTarget, 'A');
});
