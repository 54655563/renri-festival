(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = $('main'), modal = $('modal'), audio = $('bgm'), film = $('film');
  const {empty, stamp} = window.FestivalCore;
  const stages = {
    fortune:{name:'人日求签', en:'FORTUNE', seal:'签', note:'择一心愿，摇一支春日好签。', tab:'籤', pos:'center'},
    cake:{name:'摊煎饼', en:'PANCAKE', seal:'饼', note:'听一声锅响，趁好时机翻起金黄。', tab:'餅', pos:'center'},
    climb:{name:'登高赋诗', en:'MOUNTAIN VERSES', seal:'诗', note:'循山路而上，将一桩心事写成诗。', tab:'詩', pos:'70% center'},
    dress:{name:'人胜妆造', en:'PAPER HEADDRESS', seal:'胜', note:'簪花戴胜，照一照年初的自己。', tab:'勝', pos:'center'}
  };
  const keys = Object.keys(stages), pauseListeners = new Set();
  const notesEn = ['Choose a wish and shake out a spring blessing.','Watch the timing and flip your pancake to golden perfection.','Follow the mountain path and turn a thought into verse.','Adorn yourself with a spring headdress and pose for a portrait.'];
  function stored(storage,key,fallback) {try {return JSON.parse(window[storage].getItem(key)) ?? fallback;} catch {return fallback;}}
  function persist(storage,key,value) {try {window[storage].setItem(key,JSON.stringify(value));} catch {}}
  let progress = {...empty(),...stored('sessionStorage','renri-visitor-v1',{})};
  let visitor = {}, page = '', cleanup, guard, dialogOrigin, track, audioContext, celebrationTimer;
  let windowInactive = false;
  let sound = stored('localStorage','renri-sound',true);
  const conf = window.FESTIVAL_CONFIG;
  const api = window.FestivalAPI;
  const apiDefaults = {textEndpoint:conf.deepseek.endpoint,textModel:conf.deepseek.model,imageEndpoint:conf.kling.endpoint,imageModel:conf.kling.model};
  const savedApi = stored('localStorage','renri-api-v1',null) || {};
  const savedImageModel = stored('localStorage','renri-kling-model','');
  const normalizedImageEndpoint = (!savedApi.imageEndpoint || savedApi.imageEndpoint === 'https://api.klingai.com' || savedApi.imageEndpoint === 'https://api-beijing.klingai.com') ? apiDefaults.imageEndpoint : savedApi.imageEndpoint;
  let apiSettings = {
    textEndpoint:savedApi.textEndpoint || apiDefaults.textEndpoint,
    textModel:savedApi.textModel || '',
    imageEndpoint:normalizedImageEndpoint,
    imageModel:savedImageModel || '',
    textKey:'',
    imageKey:''
  };
  const english = text => `<small class="en-line" lang="en">${text}</small>`;
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
  const focus = selector => {const el = root.querySelector(selector); if(el){if (!el.matches('button,a,input,select,textarea,[tabindex],summary')) el.tabIndex=-1; el.focus({preventScroll:true});}};
  function request(endpoint,init,{timeout,signal}={}) {
    return (async () => {
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal?.addEventListener('abort',abort,{once:true});
      if(signal?.aborted) abort();
      const timer = setTimeout(abort,timeout || 8000);
      try {
        const {decode,...fetchSettings}=init;
        const response = await fetch(endpoint,{...fetchSettings,signal:controller.signal,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'});
        if(!response.ok) {
          let detail=`HTTP ${response.status}`;
          try {const body=await response.clone().json(); const msg=body?.error?.message||body?.message; if(msg) detail=msg;} catch {}
          throw Error(detail);
        }
        return await decode(response);
      } finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);}
    })();
  }
  const isLkHost = url => /^https:\/\/(?:[^/]+\.)?(?:lk888\.ai|lk666\.ai)(?:\/|$)/i.test(url || '');
  const isKlingHost = url => /^https:\/\/(?:[^/]+\.)?klingai\.com(?:\/|$)/i.test(url || '');
  const isLocalServer = () => ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const lkPrompts = {
    floral: '中国传统正月初七人日节庆人像，身穿淡青与朱砂色汉服春衫，发髻佩戴精致金银花胜与梅花簪饰，春日暖阳柔光，工笔国风与写实人像融合，保留人物五官特征，端庄典雅',
    paper: '中国传统正月初七人日节庆人像，身穿朱红织金汉服春袄，发髻佩戴传统剪纸人胜与彩胜发饰，新春暖光背景，工笔国风与写实人像融合，保留人物五官特征，喜庆吉祥'
  };
  const fileToDataURI = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(Error('无法读取自拍文件'));
    reader.readAsDataURL(file);
  });
  const sleep = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) {reject(new DOMException('Aborted','AbortError')); return;}
    const id = setTimeout(() => {signal?.removeEventListener('abort', onAbort); resolve();}, ms);
    const onAbort = () => {clearTimeout(id); reject(new DOMException('Aborted','AbortError'));};
    signal?.addEventListener('abort', onAbort, {once:true});
  });
  function buildLkParams(paramDefs, dataUri) {
    const params = {};
    const uploadParam = paramDefs.find(p => p?.type === 'upload' && p?.name);
    if (uploadParam) {
      const uname = uploadParam.name;
      const plural = uname.endsWith('s') || ['images','image_urls','ref_images','reference_images','files','attachments'].includes(uname);
      params[uname] = plural ? [dataUri] : dataUri;
    } else {
      params.images = [dataUri];
    }
    for (const p of paramDefs) {
      if (!p?.required || !p?.name || p.name === 'prompt' || p.type === 'upload') continue;
      const pname = p.name;
      const opts = (Array.isArray(p.options) ? p.options : []).map(o => (o && typeof o === 'object' ? o.value : o)).filter(v => v !== undefined && v !== null && v !== '');
      if (!opts.length) continue;
      const lower = pname.toLowerCase();
      if (lower.includes('aspect') || (lower.includes('size') && opts.includes('3:4'))) {
        params[pname] = opts.includes('3:4') ? '3:4' : opts.includes('1:1') ? '1:1' : opts[0];
      } else if (lower.includes('size') || lower.includes('resolution')) {
        params[pname] = ['1K','1k','2K','2k'].find(c => opts.includes(c)) || opts[0];
      } else {
        params[pname] = opts[0];
      }
    }
    return params;
  }
  async function lkGenerateImage(imageURL, key, modelName, file, preset, options) {
    const origin = new URL(imageURL).origin;
    const chosenModel = modelName || apiDefaults.imageModel || 'banana-2';
    const signal = options?.signal;
    const deadline = Date.now() + (options?.timeout || 120000);
    const headers = key ? {Authorization:`Bearer ${key}`} : {};
    const dataUri = await fileToDataURI(file);
    let paramDefs = [];
    try {
      const info = await request(`${origin}/v1/skills/models/${encodeURIComponent(chosenModel)}`,{method:'GET',headers:{...headers,'Accept-Language':'zh-CN'},decode:res=>res.json()},{timeout:12000,signal});
      if (Array.isArray(info?.params)) paramDefs = info.params;
    } catch {}
    const params = buildLkParams(paramDefs, dataUri);
    const basePrompt = lkPrompts[preset] || lkPrompts.floral;
    const prompt = chosenModel === 'kling-v3-omni'
      ? `以 <<<image_1>>> 中的人物为主体，严格保持参考图中人物的面部五官与相貌特征，${basePrompt}`
      : `以参考图中的人物为主体，严格保持参考图中人物的面部五官、脸型与相貌特征，${basePrompt}`;
    const created = await request(`${origin}/v1/media/generate`,{
      method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({model:chosenModel,prompt,params}),decode:res=>res.json()
    },{timeout:30000,signal});
    if (created?.code !== 200) throw Error(created?.data?.['详情'] || created?.msg || created?.error?.message || '任务创建失败');
    const taskId = created?.data?.task_id || created?.data?.task_ids?.[0];
    if (!taskId) throw Error('Missing task_id');
    let imageUrl = '';
    while (Date.now() < deadline) {
      await sleep(2000, signal);
      let polled;
      try {
        polled = await request(`${origin}/v1/skills/task-status?task_id=${encodeURIComponent(taskId)}`,{method:'GET',headers:{...headers,'Accept-Language':'zh-CN'},decode:res=>res.json()},{timeout:15000,signal});
      } catch (err) {
        if (err?.name === 'AbortError') throw err;
        continue;
      }
      if (polled?.is_final) {
        if (polled.state === 'success') {
          imageUrl = polled.result_url || polled.result_urls?.[0] || '';
          break;
        }
        throw Error(polled.error || polled.status || 'Image generation failed');
      }
    }
    if (!imageUrl) throw Error('Image generation timed out');
    return request(imageUrl,{
      method:'GET',async decode(res){const blob=await res.blob();if(!blob.size || blob.size>20*1024*1024) throw Error('Invalid image size');return blob;}
    },{timeout:25000,signal});
  }
  function onlineFor(settings) {
    const textURL=api.textEndpoint(settings), imageURL=settings.imageEndpoint;
    const isOfficialText = textURL === api.official;
    const isDefaultKling = /^https:\/\/(?:[^/]+\.)?(?:klingai\.com|lk888\.ai|lk666\.ai)\/?$/i.test(imageURL || '');
    const auth = key => key ? {Authorization:`Bearer ${key}`} : {};
    return {
    hasText:Boolean(textURL) && (!isOfficialText || Boolean(settings.textKey)),
    hasImage:Boolean(imageURL) && (!isDefaultKling || Boolean(settings.imageKey)),
    text(messages,options) {return request(textURL,{
      method:'POST',headers:{'Content-Type':'application/json',...auth(settings.textKey)},body:JSON.stringify({model:settings.textModel || apiDefaults.textModel,messages}),
      async decode(res) {const value = (await res.json())?.choices?.[0]?.message?.content; if(typeof value !== 'string') throw Error('Invalid text'); return value;}
    },options);},
    image(file,preset,options) {
      if(isLkHost(imageURL)) return lkGenerateImage(imageURL,settings.imageKey,settings.imageModel,file,preset,options);
      const body=new FormData(); body.append('image',file);body.append('preset',preset);
      if(settings.imageModel) body.append('model',settings.imageModel);
      const targetURL=(isLocalServer() && isKlingHost(imageURL)) ? (body.append('target',imageURL), '/api/kling/image') : imageURL;
      return request(targetURL,{
      method:'POST',headers:auth(settings.imageKey),body,async decode(res){
        const ct=res.headers.get('content-type')||'';
        if(/^image\/(png|jpeg|webp)(?:;|$)/i.test(ct)) {
          const blob=await res.blob();if(!blob.size || blob.size>20*1024*1024) throw Error('Invalid image size');return blob;
        }
        if(/application\/json/i.test(ct)) {
          const json=await res.json();
          const b64=json?.data?.[0]?.b64_json || json?.b64_json;
          if(typeof b64==='string' && b64) {
            const bin=atob(b64.replace(/^data:image\/[^;]+;base64,/,''));
            const bytes=new Uint8Array(bin.length);
            for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
            return new Blob([bytes],{type:'image/png'});
          }
          const imgUrl=json?.data?.[0]?.url || json?.url || json?.image_url;
          if(typeof imgUrl==='string' && /^https?:\/\//i.test(imgUrl)) {
            const imgRes=await fetch(imgUrl,{credentials:'omit',referrerPolicy:'no-referrer'});
            if(!imgRes.ok) throw Error(`HTTP ${imgRes.status}`);
            const blob=await imgRes.blob();
            if(!blob.size || blob.size>20*1024*1024) throw Error('Invalid image size');
            return blob;
          }
          throw Error(json?.error?.message || json?.message || 'Invalid image response');
        }
        throw Error('Invalid image');
      }
    },options);}
    };
  }
  function showAPISettings() {
    dialog('API 设置 / API Settings',`<form id="api-form" class="api-form" autocomplete="off" novalidate>
      <p class="hint">仅信任你控制的代理。地址与模型保存在此浏览器；密钥刷新即清除。${english('Use only endpoints you trust. This browser remembers URLs and model names; keys are cleared on reload.')}</p>
      <fieldset><legend>文本 · DeepSeek / Text</legend>
      <label>接口完整地址（可留空）${english('Full endpoint URL (optional)')}<input id="text-endpoint" name="textEndpoint" type="text" inputmode="url" placeholder="${api.official}"></label>
      <label>模型 / Model
        <div class="model-row">
          <select id="text-model" name="textModel"></select>
          <button type="button" id="fetch-models" data-fetch-text-models>拉取模型 / Fetch</button>
        </div>
      </label>
      <label>DeepSeek 或代理密钥${english('DeepSeek key or proxy token')}<input id="text-key" name="textKey" type="password" autocomplete="new-password"></label>
      <p class="hint">只填密钥时使用 DeepSeek 官方接口；若浏览器限制跨域请求，请填兼容代理地址。两项都空则使用本地文案。${english('With only a key, requests go to DeepSeek. Use a compatible proxy if browser CORS blocks direct access. Leave both blank to play offline.')}</p></fieldset>
      <fieldset><legend>生图 · 图片模型（灵客 / 可灵 / 兼容接口） / Image Model</legend>
      <label>图片模型接口地址${english('Image API URL')}<input id="image-endpoint" name="imageEndpoint" type="text" inputmode="url" placeholder="${escape(conf.kling.endpoint || '/api/image')}"></label>
      <label>模型 / Model
        <div class="model-row">
          <select id="image-model" name="imageModel"></select>
          <button type="button" id="fetch-image-models" data-fetch-image-models>拉取模型 / Fetch</button>
        </div>
      </label>
      <label>生图 API Key 或代理令牌${english('Image API key or proxy token')}<input id="image-key" name="imageKey" type="password" autocomplete="new-password"></label>
      <p class="hint">默认使用 https://api.lk888.ai（支持纳米香蕉、即梦、可灵等图片模型，浏览器直连拉取与生图轮询）。填写 Key 后点「拉取模型」选择生图模型并保存；留空密钥时自拍仅在本地处理。${english('Defaults to https://api.lk888.ai (supports Banana, Seedream, Kling, etc. directly from the browser). Enter your key, click Fetch to choose a model, and Save. Leave blank for local-only selfies.')}</p></fieldset>
      <p class="hint">保存后下次进入摊位生效。${english('Saved settings apply the next time you enter a station.')}</p>
      <p class="status" role="alert" id="api-error"></p>
      <div class="actions"><button type="submit" class="primary">保存 / Save</button><button type="button" data-api-reset>恢复默认 / Reset</button></div></form>`,(el,close)=>{
      const form=el.querySelector('#api-form'), error=el.querySelector('#api-error');
      const setOptions=(select,models,chosen)=>{
        const normalized=models.map(item=>typeof item==='string'?{id:item,label:item}:{id:item.id,label:item.label||item.id});
        if(chosen && !normalized.some(item=>item.id===chosen)) normalized.unshift({id:chosen,label:chosen});
        if(!normalized.length) {
          select.innerHTML='<option value="">请先点击「拉取模型」 / Click Fetch to load models</option>';
          select.value='';
          return;
        }
        select.innerHTML=normalized.map(({id,label})=>`<option value="${escape(id)}">${escape(label)}</option>`).join('');
        select.value=chosen && normalized.some(item=>item.id===chosen) ? chosen : normalized[0].id;
      };
      const fill=values=>{
        for(const field of form.querySelectorAll('input')) field.value=values[field.name] || '';
        setOptions(form.elements.namedItem('textModel'),[],values.textModel || '');
        setOptions(form.elements.namedItem('imageModel'),[],values.imageModel || '');
      };
      fill(apiSettings);
      for(const [addressName,keyName] of [['textEndpoint','textKey'],['imageEndpoint','imageKey']]) {
        form.elements.namedItem(addressName).addEventListener('input',()=>{form.elements.namedItem(keyName).value='';});
      }
      const bindFetchModels=({button,endpointField,keyField,modelField,label,officialCheck,keyPrompt})=>{
        button.onclick=async()=>{
          let modelsURL;
          try {modelsURL=api.modelsEndpoint(form.elements.namedItem(endpointField).value);}
          catch {error.textContent=`${label} 地址无效：请使用 HTTPS、站内路径或本机地址，不要添加查询参数。 / Enter an HTTPS URL, a same-origin path, or a loopback URL without query parameters.`;form.elements.namedItem(endpointField).focus();return;}
          const key=form.elements.namedItem(keyField).value.trim();
          if(officialCheck(modelsURL) && !key) {
            error.textContent=keyPrompt;
            form.elements.namedItem(keyField).focus();
            return;
          }
          button.disabled=true;
          button.textContent='拉取中… / Fetching…';
          error.textContent='';
          try {
            const headers=key?{Authorization:`Bearer ${key}`}:{};
            let payload;
            if(isLkHost(modelsURL)) {
              const origin=new URL(modelsURL).origin;
              const raw=await request(`${origin}/v1/skills/models?type=image`,{method:'GET',headers:{...headers,'Accept-Language':'zh-CN'},decode:res=>res.json()},{timeout:15000});
              const available=(Array.isArray(raw?.models)?raw.models:[]).filter(m=>m?.name && m.available_for_this_key!==false);
              payload={object:'list',endpoint:origin,data:available.map(m=>({id:m.name,name:`${m.display_name||m.name} (${m.name})`}))};
            } else if(isLocalServer() && isKlingHost(modelsURL)) {
              payload=await request(`/api/proxy/models?target=${encodeURIComponent(modelsURL)}`,{method:'GET',headers,decode:res=>res.json()},{timeout:10000});
            } else {
              try {
                payload=await request(modelsURL,{method:'GET',headers,decode:res=>res.json()},{timeout:8000});
              } catch(directErr) {
                if(isLocalServer() && /^https:\/\//i.test(modelsURL) && !/^HTTP /i.test(directErr?.message||'')) {
                  payload=await request(`/api/proxy/models?target=${encodeURIComponent(modelsURL)}`,{method:'GET',headers,decode:res=>res.json()},{timeout:10000});
                } else {
                  throw directErr;
                }
              }
            }
            const models=api.parseModels(payload);
            if(!models.length) {
              error.textContent='未获取到可用模型。 / No models returned.';
              return;
            }
            const labelMap=new Map((Array.isArray(payload?.data)?payload.data:[]).filter(item=>item?.id && item?.name).map(item=>[item.id,item.name]));
            const items=models.map(id=>({id,label:labelMap.get(id)||id}));
            if(payload?.endpoint && endpointField==='imageEndpoint') {
              form.elements.namedItem(endpointField).value=payload.endpoint;
            }
            const select=form.elements.namedItem(modelField);
            const current=select.value;
            setOptions(select,items,models.includes(current)?current:models[0]);
            error.textContent=`已拉取 ${models.length} 个模型，请从下拉列表选择。 / Fetched ${models.length} model(s). Select one from the list.`;
          } catch(err) {
            error.textContent=`拉取模型失败（${err?.message||'网络或跨域错误'}），请检查地址、密钥或跨域设置。 / Failed to fetch models (${err?.message||'network or CORS error'}). Check URL, key, or CORS.`;
          } finally {
            button.disabled=false;
            button.textContent='拉取模型 / Fetch';
          }
        };
      };
      bindFetchModels({
        button:el.querySelector('#fetch-models'),
        endpointField:'textEndpoint',
        keyField:'textKey',
        modelField:'textModel',
        label:'DeepSeek',
        officialCheck:url=>url==='https://api.deepseek.com/models',
        keyPrompt:'请先填写 DeepSeek 密钥再拉取模型。 / Enter a DeepSeek key before fetching models.'
      });
      bindFetchModels({
        button:el.querySelector('#fetch-image-models'),
        endpointField:'imageEndpoint',
        keyField:'imageKey',
        modelField:'imageModel',
        label:'Image API',
        officialCheck:url=>/^https:\/\/(?:[^/]+\.)?(?:klingai\.com|lk888\.ai|lk666\.ai)(?:\/|$)/i.test(url),
        keyPrompt:'请先填写生图 API Key 再拉取模型。 / Enter an Image API key before fetching models.'
      });
      el.querySelector('[data-api-reset]').onclick=()=>{fill({textEndpoint:apiDefaults.textEndpoint,textModel:'',imageEndpoint:apiDefaults.imageEndpoint,imageModel:''});error.textContent='已恢复默认地址，请点击「拉取模型」选择模型后保存。 / Default URLs restored. Fetch and select models, then Save.';};
      form.onsubmit=event=>{
        event.preventDefault();
        const values=Object.fromEntries(new FormData(form));
        for(const [name,label] of [['textEndpoint','DeepSeek'],['imageEndpoint','Kling']]) {
          try {values[name]=api.endpoint(values[name]);}
          catch {error.textContent=`${label} 地址无效：请使用 HTTPS、站内路径或本机地址，不要添加查询参数。 / Enter an HTTPS URL, a same-origin path, or a loopback URL without query parameters.`;form.elements.namedItem(name).focus();return;}
        }
        if(location.protocol==='file:' && [values.textEndpoint,values.imageEndpoint].some(value=>value.startsWith('/'))) {
          error.textContent='直接打开文件时请填完整的代理地址。 / Use an absolute proxy URL when opening this page as a file.';return;
        }
        values.textKey=values.textKey.trim();values.imageKey=values.imageKey.trim();
        values.textModel=(values.textModel || '').trim();
        values.imageModel=(values.imageModel || '').trim();
        apiSettings=values;persist('localStorage','renri-api-v1',api.remembered(values));persist('localStorage','renri-kling-model',values.imageModel);
        fill(api.remembered(values));
        $('announce').textContent='API 设置已保存。 / API settings saved.';close();
      };
    });
  }
  function soundtrack(name) {
    if(track !== name) {track = name; audio.src = `assets/${track}.mp3`;}
    if(sound) audio.play().catch(() => {}); else audio.pause();
  }
  function soundLabel() {$('sound').setAttribute('aria-pressed',String(sound));$('sound').innerHTML=`音乐 · ${sound?'开':'关'}${english(sound?'Music on':'Music off')}`;}
  function tone() {
    if(!sound) return;
    try {
      audioContext ||= new AudioContext(); audioContext.resume().catch(()=>{});
      for (const [index,hz] of [659.25,880].entries()) {
        const now=audioContext.currentTime+index*.085, osc=audioContext.createOscillator(), gain=audioContext.createGain();
        osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(.12,now+.035);gain.gain.exponentialRampToValueAtTime(.001,now+.45);
        osc.connect(gain).connect(audioContext.destination);osc.start(now);osc.stop(now+.46);
      }
    } catch {}
  }
  function notifyPause(){pauseListeners.forEach(fn=>fn());}
  document.addEventListener('visibilitychange',notifyPause);
  window.addEventListener('blur',()=>{windowInactive=true;notifyPause();});
  window.addEventListener('focus',()=>{windowInactive=false;notifyPause();});
  function dialog(title,html,setup){
    if(modal.open) return;
    dialogOrigin=document.activeElement;
    modal.className='paper-dialog';
    modal.innerHTML=`<div class="dialog-top"><h2 id="modal-title">${escape(title)}</h2><button class="icon-button" aria-label="关闭 / Close" type="button" data-close autofocus>×</button></div>${html}`;
    const close=()=>{if(modal.open) modal.close();};
    modal.querySelector('[data-close]').onclick=close;
    modal.showModal(); notifyPause();
    setup?.(modal,close);
  }
  modal.addEventListener('close',()=>{
    notifyPause();
    if(!modal.open && dialogOrigin?.isConnected) dialogOrigin.focus({preventScroll:true});
    if(track==='celebrate') soundtrack(page==='map'?'map':'game');
    if(progress.celebrationPending) queueCelebration();
  });
  function confirm(title,text,action){dialog(title,`<p>${escape(text)}</p><div class="actions"><button data-no type="button">取消 / Cancel</button><button data-yes class="primary" type="button">确认 / Confirm</button></div>`,(el,close)=>{
    el.querySelector('[data-no]').onclick=close;
    el.querySelector('[data-yes]').onclick=()=>{close();action();};
  });}
  function save(patch){
    progress={...progress,...patch};persist('sessionStorage','renri-visitor-v1',progress);$('count').textContent=`${progress.stamps.length}/4`;
    if(modal.open && modal.querySelector('#save-pass')) {
      modal.querySelector('.stamp-grid').outerHTML=seals();
      modal.querySelector('[data-pass-count]').textContent=`COLLECTOR’S PASSPORT · ${progress.stamps.length}/4`;
      modal.querySelector('#save-pass').disabled=progress.stamps.length!==4;
    }
  }
  function queueCelebration(){
    clearTimeout(celebrationTimer);
    celebrationTimer=setTimeout(()=>{if(progress.celebrationPending && !modal.open && page){save({celebrationPending:false});passport(true);}},600);
  }
  function seals(){return `<div class="stamp-grid">${keys.map(key=>`<div><span class="stamp ${progress.stamps.includes(key)?'inked':''}" aria-label="${progress.stamps.includes(key)?'已盖章 / Stamped':'未盖章 / Not yet stamped'}">${stages[key].seal}</span><small>${stages[key].name}${english(stages[key].en)}</small></div>`).join('')}</div>`;}
  function passport(celebrate=false){
    if(modal.open || page==='') return;
    if(celebrate) soundtrack('celebrate');
    dialog(celebrate?'四印齐集，春日圆满 / All Four Stamps Collected':'我的人日护照 / My Renri Passport',`<p class="eyebrow" data-pass-count>COLLECTOR’S PASSPORT · ${progress.stamps.length}/4</p><p>${celebrate?'你已走完四站。把这份春日纪念带回家吧。'+english('You visited all four stations. Take home a spring keepsake.'):'任选一站，留下你的游园印记。'+english('Visit any station to collect a passport stamp.')}</p>${seals()}<div class="actions"><button type="button" class="primary" id="save-pass" ${progress.stamps.length!==4?'disabled':''}>保存护照 / Save passport ↓</button><button type="button" id="dismiss-pass">${celebrate?'继续旅程 / Continue':'关闭 / Close'}</button></div><p class="hint" role="status" id="passport-status"></p>`,(el,close)=>{
      el.querySelector('#dismiss-pass').onclick=close;
      el.querySelector('#save-pass').onclick=async()=>{if(!await card('人日护照 / Renri Passport','四印齐集 · All four stamps collected',keys.map(key=>`「${stages[key].seal}」 ${stages[key].name} / ${stages[key].en}`))) el.querySelector('#passport-status').textContent='保存失败，请重试。 / Could not save; please retry.';};
    });
    if(celebrate) modal.classList.add('celebrate');
  }
  async function card(title,subtitle,lines){
    try {
      const canvas=document.createElement('canvas');canvas.width=900;
      const c=canvas.getContext('2d'), serif='"Songti SC", SimSun, serif';
      c.font=`30px ${serif}`;
      const rows=lines.flatMap(line=>{
        const out=[];let row='';for(const ch of String(line)){if(c.measureText(row+ch).width>674){out.push(row);row='';}row+=ch;}out.push(row.trim());return out;
      });
      canvas.height=Math.max(625,320+rows.length*48);const h=canvas.height;
      c.fillStyle='#f8efdf';c.fillRect(0,0,900,h);
      c.strokeStyle='#a48e67';c.strokeRect(27,27,846,h-54);c.strokeRect(35,35,830,h-70);
      c.fillStyle='#96352d';c.fillRect(69,63,59,59);c.fillStyle='#fff3e4';c.font=`29px ${serif}`;c.fillText('人日',70,102);
      c.fillStyle='#313a34';c.font=`54px ${serif}`;c.fillText(title,70,201,760);
      c.fillStyle='#765e42';c.font=`25px ${serif}`;c.fillText(subtitle,73,247,750);
      c.strokeStyle='#b39a72';c.beginPath();c.moveTo(72,271);c.lineTo(828,271);c.stroke();
      c.fillStyle='#313a34';c.font=`30px ${serif}`;rows.forEach((line,i)=>c.fillText(line,73,322+48*i,756));
      c.fillStyle='#765e42';c.font=`21px ${serif}`;c.fillText('人日嘉年华  /  Renri Festival',73,h-66);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob) return false;
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${title.replace(/[\\/:*?"<>|]/g,'–')}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return true;
    } catch {return false;}
  }
  const cloud = `<svg class="clouds" viewBox="0 0 390 120" fill="none" aria-hidden="true"><path d="M2 102c14-25 43-31 64-20 9-22 36-31 57-15 10-39 64-46 87-13 18-20 52-18 69 0 15-13 42-10 51 3 26-6 48 9 58 32H222m-176 8h137m50-22h110"/><path d="M116 61c-8-22-36-28-53-14M245 43c-9-12-24-16-37-12"/></svg>`;
  function clearPage(){cleanup?.();cleanup=null;guard=null;}
  function requestMap(){if(page==='map') {window.scrollTo(0,0);focus('#map-title');} else goMap(page);}
  function goMap(from){if(guard) guard(()=>renderMap(from));else renderMap(from);}
  function renderMap(from){
    clearPage();page='map';$('nav-title').textContent='';soundtrack('map');
    root.innerHTML=`<section class="hero"><div class="shell hero-inner"><div class="hero-copy"><p class="eyebrow"><span></span> 正月初七 / RENRI FESTIVAL</p><h1 id="map-title" tabindex="-1">人日<span>嘉年华</span></h1><p class="hero-sub">山河醒，万物春。${english('The land awakens; spring returns.')}</p><p class="hero-note">相传女娲于初七造人，故称这一天为「人日」。<br>循着四处春日小站，收下属于你的祝福。${english('Legend says Nüwa created humankind on the seventh day of the first lunar month, now known as Renri. Explore four springtime stations and find your own blessing.')}</p><a class="primary" href="#stations">循图游园 / Explore <span aria-hidden="true">↓</span></a></div><figure class="hero-art"><img src="assets/hero.jpg" alt="青灰群山，春云绕峰，燕子飞过 / Swallows fly past misty spring peaks"><span class="art-medallion" aria-hidden="true">歲<br>時</span><figcaption><span>春山行旅图 / Spring Mountains</span><span>卷一 / Scroll I</span></figcaption></figure>${cloud}</div></section>
      <section class="shell station-section" id="stations" aria-labelledby="stations-title"><div class="section-head"><div><p class="eyebrow"><span></span> THE FESTIVAL MAP</p><h2 id="stations-title">游园地图</h2></div><p><b>壹 · 贰 · 叁 · 肆</b><br>任游四站，集齐四印。${english('Four stations, four stamps.')}</p></div><div class="station-grid">${keys.map((key,i)=>{
      const s=stages[key], done=progress.stamps.includes(key);return `<button type="button" id="station-${key}" class="station" data-station="${key}"><div class="station-art artwork ${key}"><span class="art-index" aria-hidden="true">0${i+1}</span>${done?'<span class="done">✓ 已盖章 / Stamped</span>':''}</div><div class="station-copy"><span class="eyebrow">${s.en}</span><h3>${s.name}</h3><p>${s.note}${english(notesEn[i])}</p><span class="station-entry">进入小站 / Enter <span aria-hidden="true">↗</span></span><span class="station-seal" aria-hidden="true">${s.tab}</span></div></button>`;
    }).join('')}</div></section><section class="shell visitor"><div><p class="eyebrow">VISITOR DESK</p><h2>来日方长，再逛一回。${english('There is always time for another visit.')}</h2></div><button type="button" id="reset">开始新一位访客${english('Start a new visit ↗')}</button></section>`;
    root.querySelectorAll('[data-station]').forEach(el=>el.onclick=()=>openStation(el.dataset.station));
    root.querySelector('#reset').onclick=()=>confirm('开始新一位访客？ / Start a new visit?','本次护照、已结算分数和私人照片将清除。已主动提交的本机榜单成绩会保留。 / This clears the current passport, scores and private photos. Submitted local leaderboard entries are kept.',()=>{
      for(const [key,value] of Object.entries(visitor)) if(typeof value==='string' && value.startsWith('blob:')) URL.revokeObjectURL(value);
      visitor={};progress=empty();save({});renderMap();focus('#map-title');
    });
    if(from && stages[from]) {const el=root.querySelector(`#station-${from}`);el.scrollIntoView({block:'center',behavior:'instant'});el.focus({preventScroll:true});}
    else window.scrollTo(0,0);
  }
  function openStation(key){
    clearPage();page=key;const s=stages[key];$('nav-title').textContent=s.name;soundtrack('game');
    const ctx={
      root, get progress(){return progress;}, private:visitor, online:onlineFor(apiSettings), save, focus, escape, card, dialog, confirm, tone,
      map:()=>goMap(key), paused:()=>modal.open||document.hidden||windowInactive,
      leaving(fn){guard=fn;}, stopOnPause(fn){pauseListeners.add(fn);return ()=>pauseListeners.delete(fn);},
      complete(data){const out=stamp(progress,key,data);save(out.celebrate?{...out.state,celebrationPending:true}:out.state);$('announce').textContent=`${s.name}已盖章，人日护照 ${progress.stamps.length}/4。 / ${s.en} stamped, ${progress.stamps.length} of 4 collected.`;
        if(out.celebrate) queueCelebration();},
      layout(sceneHtml,panelHtml){
        root.innerHTML=`<article class="shell game-page"><div class="game-header"><button type="button" id="back" class="back">← 返回地图${english('Back to map')}</button><div><p class="eyebrow">第 0${keys.indexOf(key)+1} 站 · ${s.en}</p><h1 id="game-title" tabindex="-1">${s.name}</h1></div><span class="game-index" aria-hidden="true">${s.tab}</span></div><div class="game-grid"><div class="scene artwork ${key}">${sceneHtml}</div><div class="panel">${panelHtml}</div></div></article>`;
        root.querySelector('#back').onclick=()=>goMap(key);return root.querySelector('.scene');
      }
    };
    const game = ({fortune:window.craft?.fortune,dress:window.craft?.dress,cake:window.kinetic?.cake,climb:window.kinetic?.climb})[key];
    if(game) cleanup=game(ctx);else ctx.layout('', '<p>该站暂不可用，请返回地图。 / This station is unavailable. Please return to the map.</p>');
    window.scrollTo(0,0);focus('#game-title');
  }
  function endIntro(){
    if(!$('gate').hidden) return;
    film.pause();$('intro').classList.add('finished');$('gate').hidden=false;$('skip').hidden=true;$('play').hidden=true;$('film-sound').hidden=true;$('enter').focus({preventScroll:true});
  }
  function enter(){
    film.pause();$('intro').hidden=true;$('site').hidden=false;persist('sessionStorage','renri-intro-seen',true);soundLabel();save({});renderMap();focus('#map-title');if(progress.celebrationPending) queueCelebration();
  }
  $('home').onclick=requestMap;$('passport').onclick=()=>passport();$('api-settings').onclick=showAPISettings;
  $('sound').onclick=()=>{sound=!sound;persist('localStorage','renri-sound',sound);soundLabel();if(track)soundtrack(track);};
  $('skip').onclick=endIntro;$('enter').onclick=enter;
  $('play').onclick=()=>film.play().then(()=>$('play').hidden=true).catch(endIntro);
  $('film-sound').onclick=()=>{film.muted=!film.muted;$('film-sound').setAttribute('aria-pressed',String(!film.muted));$('film-sound').textContent=film.muted?'打开影片声音 / Unmute film':'关闭影片声音 / Mute film';};
  document.addEventListener('click',event=>{if(sound && track && audio.paused && !event.target.closest('#sound')) audio.play().catch(()=>{});});
  film.addEventListener('ended',endIntro);film.addEventListener('error',endIntro);
  if(stored('sessionStorage','renri-intro-seen',false)) enter();
  else {$('intro').hidden=false;film.src=film.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')?'assets/intro.mp4':'assets/intro.webm';film.play().catch(()=>{if($('gate').hidden) $('play').hidden=false;});}
})();
