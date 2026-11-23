const test = require('node:test');
const assert = require('node:assert/strict');
const settings = require('../api-settings.js');

test('a blank DeepSeek URL uses the official endpoint only with a key', () => {
  assert.equal(settings.textEndpoint({textKey:''}), '');
  assert.equal(settings.textEndpoint({textKey:'sk-test'}), 'https://api.deepseek.com/chat/completions');
  assert.equal(settings.textEndpoint({textKey:'sk-test',textEndpoint:'/api/text'}), '/api/text');
});
test('secure absolute URLs or same-origin paths are accepted; unsafe and ambiguous URLs are rejected', () => {
  assert.equal(settings.endpoint(' https://ex.test/api '),'https://ex.test/api');
  assert.equal(settings.endpoint('http://127.0.0.1:8765/api'),'http://127.0.0.1:8765/api');
  for(const url of ['//ex.test/api','/\\ex.test/api','http://ex.test/api','data:text/html,ok','https://person:secret@ex.test','https://ex.test/#path','https://ex.test/?token=secret','/api?token=secret']) assert.throws(()=>settings.endpoint(url));
});
test('remembered settings include URLs and model but never API keys', () => {
  assert.deepEqual(settings.remembered({textEndpoint:'/api/text',textModel:'deepseek-chat',imageEndpoint:'/api/image',textKey:'secret',imageKey:'secret'}),{textEndpoint:'/api/text',textModel:'deepseek-chat',imageEndpoint:'/api/image'});
});
test('modelsEndpoint derives /models URLs from chat endpoints or bases', () => {
  assert.equal(settings.modelsEndpoint(''), 'https://api.deepseek.com/models');
  assert.equal(settings.modelsEndpoint('https://api.deepseek.com/chat/completions'), 'https://api.deepseek.com/models');
  assert.equal(settings.modelsEndpoint('https://proxy.test/v1/chat/completions'), 'https://proxy.test/v1/models');
  assert.equal(settings.modelsEndpoint('https://proxy.test/v1/images/generations'), 'https://proxy.test/v1/models');
  assert.equal(settings.modelsEndpoint('https://api.deepseek.com/'), 'https://api.deepseek.com/models');
  assert.equal(settings.modelsEndpoint('/api/v1/chat/completions'), '/api/v1/models');
});
test('parseModels extracts unique non-empty model IDs from standard payloads', () => {
  assert.deepEqual(settings.parseModels({data:[{id:'deepseek-chat'},{id:'deepseek-reasoner'},{id:'deepseek-chat'}]}), ['deepseek-chat','deepseek-reasoner']);
  assert.deepEqual(settings.parseModels({models:[{name:'model-a'},'model-b']}), ['model-a','model-b']);
  assert.deepEqual(settings.parseModels(null), []);
});
