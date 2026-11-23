const assert = require('node:assert/strict');
const test = require('node:test');
const { drawFortune, validatePhoto, coverCrop, portraitSvg, parseOnlineBlessing } = require('../craft.js');

test('rank bands are 30%, 50%, and 20% for every theme', () => {
  for (const theme of ['学业', '友情', '未来', '日常', '随机']) {
    const counts = { 上上签: 0, 中平签: 0, 下下签: 0 };
    for (let n = 0; n < 100; n++) {
      const values = [n / 100, .6, .2];
      counts[drawFortune(theme, () => values.shift()).rank]++;
    }
    assert.deepEqual(counts, { 上上签: 30, 中平签: 50, 下下签: 20 }, theme);
  }
});

test('random resolves to a themed local blessing without changing rank', () => {
  const values = [.8, .25, 0];
  const result = drawFortune('随机', () => values.shift());
  assert.equal(result.theme, '友情');
  assert.equal(result.rank, '下下签');
  assert.equal(result.label, '本地签文·仅供娱乐');
  assert.ok(result.verse.length && result.blessing.length);
});

test('every offline fortune includes an English verse and blessing', () => {
  for (const theme of ['学业', '友情', '未来', '日常']) {
    for (const tier of [0, .5, .9]) {
      for (const choice of [0, .9]) {
        const values = [tier, choice];
        const result = drawFortune(theme, () => values.shift());
        assert.match(result.verseEn, /[A-Za-z]+ [A-Za-z]+/);
        assert.match(result.blessingEn, /[A-Za-z]+ [A-Za-z]+/);
      }
    }
  }
});

test('online blessing accepts two bounded Chinese text fields, not markup or rank overrides', () => {
  const safe = { verse: '清茶二盏，闲话半窗。', blessing: '愿你和朋友分享一件小小的开心事。' };
  assert.deepEqual(parseOnlineBlessing(JSON.stringify(safe)), safe);
  assert.equal(parseOnlineBlessing(JSON.stringify({ ...safe, rank: '上上签' })), null);
  assert.equal(parseOnlineBlessing(JSON.stringify({ ...safe, verse: '<b>祝福</b>' })), null);
  assert.equal(parseOnlineBlessing(JSON.stringify({ ...safe, blessing: '春'.repeat(66) })), null);
  assert.equal(parseOnlineBlessing('无法生成'), null);
});

test('online blessing optionally accepts a complete safe English pair without allowing extra keys', () => {
  const chinese = { verse: '清茶二盏，闲话半窗。', blessing: '愿你和朋友分享一件小小的开心事。' };
  const bilingual = { ...chinese, verseEn: 'Two cups of tea by the window.', blessingEn: 'Share a little joy with a friend.' };
  assert.deepEqual(parseOnlineBlessing(JSON.stringify(bilingual)), bilingual);
  for (const invalid of [{ ...bilingual, rank: '上上签' }, { ...bilingual, verseEn: '<b>Spring</b>' },
    { ...bilingual, blessingEn: 'Spring\nblessing' }, { ...bilingual, verseEn: 'Spring\n' }, { ...bilingual, blessingEn: 'a'.repeat(201) },
    { ...chinese, verseEn: bilingual.verseEn }]) {
    assert.equal(parseOnlineBlessing(JSON.stringify(invalid)), null);
  }
});

test('photo validator accepts one nonempty JPG or PNG up to 10 MiB', () => {
  const jpg = { type: 'image/jpeg', size: 10 * 1024 * 1024 };
  assert.equal(validatePhoto([jpg]), '');
  assert.equal(validatePhoto([{ type: 'image/png', size: 1 }]), '');
  for (const files of [[], [jpg, jpg], [{ ...jpg, size: jpg.size + 1 }],
    [{ ...jpg, size: 0 }], [{ ...jpg, type: 'image/svg+xml' }]]) {
    assert.ok(validatePhoto(files));
  }
});

test('cover crop fills the head aperture without stretching', () => {
  assert.deepEqual(coverCrop(800, 400, 200, 200), [200, 0, 400, 400]);
  assert.deepEqual(coverCrop(400, 800, 200, 200), [0, 200, 400, 400]);
  assert.deepEqual(coverCrop(200, 300, 100, 150), [0, 0, 200, 300]);
});

test('portraits are distinct standalone SVGs and the photo overlay leaves out the sample face', () => {
  const floral = portraitSvg('floral');
  const paper = portraitSvg('paper');
  assert.match(floral, /^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(floral, /花胜春衣/);
  assert.match(paper, /剪彩人胜/);
  assert.match(floral, /aria-label="花胜春衣.*Spring Blossoms/);
  assert.match(paper, /aria-label="剪彩人胜.*Paper-Cut Charms/);
  assert.notEqual(floral, paper);
  assert.match(floral, /data-part="sample-face"/);
  assert.doesNotMatch(portraitSvg('floral', 'overlay'), /data-part="sample-face"|<image/);
});
