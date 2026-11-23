const test = require('node:test');
const assert = require('node:assert/strict');
test('passport stamps are idempotent and celebrate only after the fourth station', () => {
  const { stamp, empty } = require('../core.js');
  let state = empty();
  for (const id of ['fortune','cake','climb']) {
    state = stamp(state,id).state;
    assert.equal(stamp(state,id).celebrate,false);
  }
  const result = stamp(state,'dress');
  assert.equal(result.celebrate,true);
  assert.equal(stamp(result.state,'dress').celebrate,false);
});
test('settled scores survive repeat stamping without duplicate seals', () => {
  const { stamp, empty } = require('../core.js');
  const result = stamp(stamp(empty(),'cake',{scores:[100,0,60]}).state,'cake',{scores:[0,0,0]});
  assert.deepEqual(result.state.stamps,['cake']);
  assert.deepEqual(result.state.scores,[0,0,0]);
});
