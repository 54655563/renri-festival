(() => {
  const official = 'https://api.deepseek.com/chat/completions';
  function endpoint(value) {
    const address = String(value ?? '').trim();
    if (!address) return '';
    if (/[\\\s#?]/.test(address)) throw Error('Invalid endpoint');
    if (/^\/(?!\/)/.test(address)) return address;
    const parsed = new URL(address);
    const loopback = ['localhost','127.0.0.1','[::1]'].includes(parsed.hostname);
    if (parsed.username || parsed.password || (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback))) throw Error('Invalid endpoint');
    return parsed.href;
  }
  function textEndpoint(settings) {return settings.textEndpoint || (settings.textKey ? official : '');}
  function modelsEndpoint(value) {
    const target = endpoint(value) || official;
    if (/\/(?:chat\/completions|images\/generations)$/i.test(target)) return target.replace(/\/(?:chat\/completions|images\/generations)$/i, '/models');
    if (/\/models$/i.test(target)) return target;
    return `${target.replace(/\/+$/, '')}/models`;
  }
  function parseModels(payload) {
    const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : [];
    const ids = [];
    for (const item of list) {
      const id = typeof item === 'string' ? item : item?.id ?? item?.name;
      if (typeof id === 'string') {
        const trimmed = id.trim();
        if (trimmed && !ids.includes(trimmed)) ids.push(trimmed);
      }
    }
    return ids;
  }
  function remembered({textEndpoint,textModel,imageEndpoint}) {return {textEndpoint,textModel,imageEndpoint};}
  const api = {official,endpoint,textEndpoint,modelsEndpoint,parseModels,remembered};
  if (typeof module !== 'undefined') module.exports = api;
  else window.FestivalAPI = api;
})();
