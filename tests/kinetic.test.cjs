const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

let cached;
function rules() {
  if (cached) return cached;
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../kinetic.js'), 'utf8'), {window, AbortController, setTimeout, clearTimeout});
  assert.equal(typeof window.kinetic.cake, 'function');
  assert.equal(typeof window.kinetic.climb, 'function');
  return cached = window.kinetic.rules;
}

test('pointer traverses a repeating triangle at 1.4, 1.2 and 1.0 seconds per leg', () => {
  const {position} = rules();
  [1400, 1200, 1000].forEach((leg, i) => {
    assert.equal(position(i, 0), 0);
    assert.equal(position(i, leg / 2), 50);
    assert.equal(position(i, leg), 100);
    assert.equal(position(i, leg * 1.5), 50);
    assert.equal(position(i, leg * 2), 0);
  });
});

test('score windows include their edges and 0 is a valid result', () => {
  const {scoreFor} = rules();
  assert.deepEqual([39, 40, 45, 46, 50, 54, 55, 60, 61].map(scoreFor), [0, 60, 60, 100, 100, 100, 60, 60, 0]);
});

test('one round counts down, locks feedback, times out and ends after three tries', () => {
  const {cakeStart, cakeStep, cakeFlip} = rules();
  const game = cakeStart();
  cakeFlip(game);
  cakeStep(game, 2999);
  assert.equal(game.phase, 'countdown');
  cakeStep(game, 701);
  cakeFlip(game);
  cakeFlip(game);
  assert.equal(game.phase, 'feedback');
  assert.deepEqual(Array.from(game.scores), [100]);
  cakeStep(game, 799);
  assert.equal(game.phase, 'feedback');
  cakeStep(game, 1);
  assert.equal(game.phase, 'aim');
  cakeStep(game, 5000);
  assert.equal(game.phase, 'feedback');
  cakeStep(game, 800 + 5000 + 800);
  assert.equal(game.phase, 'done');
  assert.deepEqual(Array.from(game.scores), [100, 0, 0]);
});

test('rankings accept only 2–12 characters, keep zeros, break ties by submission order and reject duplicates', () => {
  const {addRanking, ranking} = rules();
  const entries = [];
  assert.equal(addRanking(entries, '甲', 0, 'A'), false);
  assert.equal(addRanking(entries, '一'.repeat(13), 0, 'A'), false);
  assert.equal(addRanking(entries, ' 🐉甲 ', 0, 'A'), true);
  assert.equal(addRanking(entries, '零分', 0, 'B'), true);
  assert.equal(addRanking(entries, '第一', 100, 'C'), true);
  assert.equal(addRanking(entries, '改分', 100, 'A'), false);
  assert.deepEqual(Array.from(ranking(entries), entry => entry.name), ['第一', '🐉甲', '零分']);
});

test('climbing and recovering use the documented per-second rates', () => {
  const {climbStart, climbStep} = rules();
  const game = climbStart();
  climbStep(game, 4, true);
  assert.equal(game.height, 36);
  assert.equal(game.stamina, 20);
  climbStep(game, 1, false);
  assert.equal(game.height, 36);
  assert.equal(game.stamina, 45);
});

test('fatigue halts climbing until released and stamina reaches 40', () => {
  const {climbStart, climbStep} = rules();
  const game = climbStart();
  climbStep(game, 7, true);
  assert.equal(game.height, 45);
  assert.equal(game.stamina, 0);
  assert.equal(game.tired, true);
  climbStep(game, 1, false);
  climbStep(game, 1, true);
  assert.equal(game.stamina, 25);
  assert.equal(game.height, 45);
  climbStep(game, 0.6, false);
  assert.equal(game.tired, false);
  climbStep(game, 1, true);
  assert.equal(game.height, 54);
});

test('climb caps at the summit and stops consuming stamina there', () => {
  const {climbStart, climbStep} = rules();
  const game = Object.assign(climbStart(), {height: 99});
  climbStep(game, 2, true);
  assert.equal(game.height, 100);
  assert.ok(game.stamina > 97);
  climbStep(game, 2, false);
  assert.ok(game.stamina < 100);
});

test('poems accept a 1–30 character theme and supply four five-character lines with English', () => {
  const {poemFor} = rules();
  assert.equal(poemFor('  '), null);
  assert.equal(poemFor('山'.repeat(31)), null);
  const poems = [' 毕业 ', '想家', '远方的朋友', '我的春天'].map(poemFor);
  for (const poem of poems) {
    assert.equal(poem.lines.length, 4);
    for (const line of poem.lines) assert.match(line, /^\p{Script=Han}{5}$/u);
    assert.equal(poem.english.length, 4);
    for (const line of poem.english) assert.match(line, /[a-z A-Z]+/);
  }
  assert.equal(poems[0].topic, '毕业');
  assert.notEqual(poems[0].lines.join(''), poems[1].lines.join(''));
});

const validPoem = JSON.stringify({lines: ['春风穿石径', '云影落松间', '独立青峰上', '新晴满远山'], english: 'Spring wind crosses the path.\nClouds wander among pines.'});

test('online response requires exactly four five-Han lines and English text', () => {
  const {parseOnlinePoem} = rules();
  const poem = parseOnlinePoem(`\`\`\`json\n${validPoem}\n\`\`\``, '旅行');
  assert.equal(poem.topic, '旅行');
  assert.equal(poem.lines.length, 4);
  assert.equal(poem.english.length, 2);
  for (const invalid of ['not JSON', validPoem.replace('春风穿石径', '春风穿石。'), validPoem.replace('Spring wind crosses the path.\\nClouds wander among pines.', '山中春色'), JSON.stringify({lines: ['春风穿石径'], english: 'Spring wind'})]) {
    assert.throws(() => parseOnlinePoem(invalid, '旅行'));
  }
});

test('online request retries invalid output once within its original deadline', async () => {
  const {requestOnlinePoem} = rules();
  const controller = new AbortController();
  const calls = [];
  const poem = await requestOnlinePoem(async (messages, options) => {
    calls.push({messages, options});
    return calls.length === 1 ? '{}' : validPoem;
  }, '毕业', controller.signal);
  assert.equal(poem.topic, '毕业');
  assert.equal(calls.length, 2);
  assert.ok(calls[0].options.timeout <= 12000);
  assert.ok(calls[1].options.timeout <= calls[0].options.timeout);
  assert.equal(calls[0].options.signal, calls[1].options.signal);
  assert.match(calls[0].messages.find(message => message.role === 'user').content, /毕业/);
});

test('two invalid replies fail rather than silently selecting an offline sample', async () => {
  const {requestOnlinePoem} = rules();
  let attempts = 0;
  await assert.rejects(requestOnlinePoem(async () => { attempts++; return '{}'; }, '毕业', new AbortController().signal));
  assert.equal(attempts, 2);
});

test('online deadline aborts even if the proxy never resolves', async () => {
  const {requestOnlinePoem} = rules();
  let signal;
  const result = requestOnlinePoem((_messages, options) => {
    signal = options.signal;
    return new Promise(() => {});
  }, '毕业', new AbortController().signal, 20);
  await assert.rejects(result, /超时/);
  assert.equal(signal.aborted, true);
});
