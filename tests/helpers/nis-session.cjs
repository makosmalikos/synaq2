const assert = require('node:assert/strict');

// Use the same public phase transitions as the player; never mutate session state.
async function completeNisPhases(post, id, answers = {}) {
  for (let phase = 0; phase < 4; phase++) {
    if (phase === 3) {
      const begun = await post({ action: 'phase', id, op: 'begin-day2' });
      assert.equal(begun.status, 200, JSON.stringify(begun.body));
    }
    const [first, last] = [[1, 40], [41, 100], [101, 120], [121, 180]][phase];
    const selected = Object.fromEntries(Object.entries(answers).filter(([key]) => Number(key) >= first && Number(key) <= last));
    const advanced = await post({ action: 'phase', id, op: 'advance', phase, revision: 1, answers: selected });
    assert.equal(advanced.status, 200, JSON.stringify(advanced.body));
  }
}
module.exports = { completeNisPhases };
