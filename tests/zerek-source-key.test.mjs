import test from 'node:test';
import assert from 'node:assert/strict';
import {displayedSourceKey} from '../scripts/zerek-course-capture.mjs';
test('Visible source keys retain signs, decimal separators and fractions',()=>{
 for(const answer of ['408','-12','0,75','-0.25','3/7','-2/5'])assert.equal(displayedSourceKey('✗ ҚатеДұрыс жауап: '+answer),answer);
 assert.equal(displayedSourceKey('✓ Дұрыс!'),undefined);
});
