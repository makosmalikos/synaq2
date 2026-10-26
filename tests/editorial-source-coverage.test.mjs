import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileEditorialCoverage} from '../scripts/editorial/source-coverage.mjs';

test('an authored draft and an untouched duplicate cannot be counted as verified coverage',()=>{
 const rows=['a','b','c'].map(key=>({key}));
 const aliases=new Map([['source#a',new Set(['a'])]]);
 const duplicates=new Map([['b',['a']]]);
 const draft={editionId:'draft-one',sourceRefs:[{sourceFile:'source',sourceId:'a'}]};
 const report=reconcileEditorialCoverage(rows,aliases,[],[draft],duplicates);
 assert.deepEqual(report.records.map(r=>r.status),['draft_edition','pending_adaptation','pending_adaptation']);
 const approved=reconcileEditorialCoverage(rows,aliases,[draft],[],duplicates);
 assert.deepEqual(approved.records.map(r=>r.status),['linked_verified_edition','duplicate_with_verified_edition','pending_adaptation']);
});

test('unresolved references and cycles stay visible instead of completing the archive',()=>{
 const missing={editionId:'missing',sourceRefs:[{sourceFile:'source',sourceId:'unknown'}]};
 const result=reconcileEditorialCoverage([{key:'a'},{key:'b'}],new Map(),[missing],[],new Map([['a',['b']],['b',['a']]]));
 assert.equal(result.unresolved.length,1);
 assert.ok(result.records.every(r=>r.status==='pending_adaptation'));
});
