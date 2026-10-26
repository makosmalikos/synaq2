const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

test('every Vercel includeFiles pattern fits the 256-character deployment schema', () => {
  for (const [route, value] of Object.entries(config.functions)) {
    if (value.includeFiles == null) continue;
    assert.equal(typeof value.includeFiles, 'string', route);
    assert.ok(value.includeFiles.length > 0 && value.includeFiles.length <= 256,
      `${route}: includeFiles is ${value.includeFiles.length} characters; Vercel allows 256`);
  }
});

test('shortened learning includeFiles retains the complete original source and SVG set', () => {
  const original = 'frontend/{src/{bank,data,bilLogicQuestions,bilReadingQuestions,nishScienceQuestions,nishOfficialLanguageQuestions,expandedQuestionBank,questionMetadata,topicSummary,adminTasks,grading,curriculumData,platformDiagnostic}.js,public/figures/synaq-editions/*.svg}';
  const files = pattern => [...fs.globSync(pattern, { cwd: root })].sort();
  const expected = files(original);
  assert.ok(expected.includes('frontend/src/bank.js'));
  assert.ok(expected.includes('frontend/src/nishOfficialLanguageQuestions.js'));
  assert.ok(expected.some(file => file.endsWith('.svg')));
  assert.deepEqual(files(config.functions['api/learning.js'].includeFiles), expected);
});
