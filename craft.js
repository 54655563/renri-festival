(function () {
  'use strict';

  const themes = ['学业', '友情', '未来', '日常'];
  const ranks = ['上上签', '中平签', '下下签'];
  const themeEnglish = { 学业: 'Studies', 友情: 'Friendship', 未来: 'Future', 日常: 'Everyday Life', 随机: 'Random' };
  const rankEnglish = { 上上签: 'Most Auspicious', 中平签: 'Steady', 下下签: 'Challenging' };
  const localLabel = '本地签文·仅供娱乐';
  const localLabelEn = 'Offline fortune · for fun only';
  const bilingual = (chinese, english) => `${chinese} / ${english}`;
  const paired = (chinese, english) => `${chinese} <span lang="en">${english}</span>`;
  const returnToMap = paired('继续逛集', 'Back to the Festival');
  const downloadFailed = bilingual('暂未能下载，请再试一次。', 'Could not download. Please try again.');
  const blessings = {
    学业: [
      [
        ['一卷新晴，照得心明。', '愿你翻到困住你的那页时，忽然有了自己的解法。', 'Sunlight on an open book clears the mind.', 'May you turn to the page that stumped you and suddenly see your own way through.'],
        ['墨落成行，灯下有春。', '愿你学到一件就想讲给朋友听的新鲜事。', 'Ink falls into lines; spring gathers under the lamp.', 'May you learn something new that you cannot wait to share with a friend.']
      ], [
        ['薄纸叠高，自可成册。', '先做一道题，再看下一道。今日的小步也算数。', 'Thin pages pile up to make a book.', 'Try one problem before looking at the next. Small steps count today, too.'],
        ['云开一寸，案上生光。', '愿你给不懂的地方留个问号，也给自己留点耐心。', 'The clouds part a little; light reaches the desk.', 'Put a question mark by what you do not understand, and give yourself a little patience.']
      ], [
        ['笔涩且停，换一盏茶。', '卡住时可以合上书，歇一会儿，再请人一起看看。', 'When the brush drags, pause for a cup of tea.', 'If you get stuck, close the book, take a break, and ask someone to look at it with you.'],
        ['草稿重来，不碍花开。', '一页写错不必撕掉。留下它，就知道自己走了多远。', 'A new draft will not stop the flowers from blooming.', 'Keep the page with the mistakes. It will show you how far you have come.']
      ]
    ],
    友情: [
      [
        ['隔窗闻笑，满院回春。', '愿你今天正好遇见那个听得懂你半句话的人。', 'Laughter through the window brings spring to the courtyard.', 'May you meet someone today who understands you before you finish the sentence.'],
        ['连枝映水，相照成双。', '若想到一位朋友，不妨把这份开心分给对方一点。', 'Two joined branches find their reflection in the water.', 'If a friend comes to mind, share a little of your happiness with them.']
      ], [
        ['清茶二盏，闲话半窗。', '没什么大事也可以约见，慢慢说些近来小事。', 'Two cups of tea and easy talk by the window.', 'You do not need a special reason to meet. Take your time catching up on the little things.'],
        ['雁来雁去，长记归期。', '想念的人即使不常见，也可以互道一声平安。', 'Geese come and go, but we remember when they return.', 'Even if you rarely see someone you miss, you can send a note to wish them well.']
      ], [
        ['微风拂面，不必追云。', '若一时说不清，给彼此一点喘息的空隙。', 'Feel the breeze; there is no need to chase the clouds.', 'If the words are not coming yet, give each other a little room to breathe.'],
        ['雨散阶前，旧苔犹青。', '一场误会不必急着定论，等心里平静再谈。', 'Rain clears from the steps; the old moss stays green.', 'Do not rush to judge a misunderstanding. Talk it over when you feel calmer.']
      ]
    ],
    未来: [
      [
        ['东风开径，一步见山。', '愿你手边的小念头，长成一件值得亲自去试的事。', 'The east wind clears a path; one step reveals the mountains.', 'May the small idea in front of you grow into something worth trying for yourself.'],
        ['潮平水阔，小舟新发。', '愿你有机会向向往的方向，迈出试探的一步。', 'The tide is calm, the water wide, and a small boat sets out.', 'May you get a chance to take a first tentative step toward something you long for.']
      ], [
        ['远山未尽，且看近花。', '下一站没想好也无妨，先选一件今天就能做的事。', 'The mountains stretch on; look at the flowers beside you.', 'It is fine not to know your next stop. Pick one thing you can do today.'],
        ['疏星照路，慢过长桥。', '给计划留一点空白，也给自己留一条回头路。', 'A few stars light the way across the long bridge.', 'Leave some room in your plans and give yourself a way back if you need one.']
      ], [
        ['前路多雾，暂歇藤亭。', '看不清时先不做大决定。吃好睡好，也是在向前。', 'With fog on the road, rest awhile under the vines.', 'When the way is unclear, hold off on big decisions. Eating and sleeping well are progress, too.'],
        ['潮来收桨，岸上有灯。', '计划改了不等于白忙。回头看看，还有哪些值得带走。', 'Draw in the oars as the tide comes; lights shine on shore.', 'A change of plans does not erase your work. Look back and see what is worth taking with you.']
      ]
    ],
    日常: [
      [
        ['一枝春早，恰到窗前。', '愿你在寻常的路上，看见一处想停下来的亮色。', 'A branch of early blossoms reaches the window.', 'May you find a bright spot on a familiar route that makes you want to pause.'],
        ['暖饭初香，闲日正长。', '愿你从容吃一顿饭，不等凉了才想起照顾自己。', 'Dinner is warm and fragrant; the day is still unhurried.', 'May you sit down for a meal without rushing, while it is still warm.']
      ], [
        ['晨光细细，扫去轻尘。', '只收好桌上一角，也能给今天腾出一点清朗。', 'Soft morning light falls as the dust is swept away.', 'Tidying just one corner of your desk can make a little space for a clearer day.'],
        ['小火温茶，寻常自在。', '愿你挤出片刻，不为交差，只为自己。', 'Tea warms over a small flame; ordinary moments can be enough.', 'May you find a moment that is just for yourself, not for getting anything done.']
      ], [
        ['檐下雨急，门内灯温。', '若今天诸事相撞，就先放下最不着急的那一件。', 'Rain rattles at the eaves; the lamplight inside is warm.', 'If too many things collide today, set aside the least urgent one first.'],
        ['风折细柳，根下仍青。', '觉得累的时候，愿你肯把行程放松一格。', 'The wind snaps a willow twig, but the roots stay green.', 'When you feel tired, give yourself permission to take one thing off your schedule.']
      ]
    ]
  };

  function drawFortune(theme, random = Math.random) {
    const roll = random();
    const tier = roll < .3 ? 0 : roll < .8 ? 1 : 2;
    const resolved = themes.includes(theme) ? theme : themes[Math.floor(random() * themes.length)];
    const pool = blessings[resolved][tier];
    const [verse, blessing, verseEn, blessingEn] = pool[Math.floor(random() * pool.length)];
    return { theme: resolved, rank: ranks[tier], verse, blessing, verseEn, blessingEn, label: localLabel, labelEn: localLabelEn };
  }

  function parseOnlineBlessing(value) {
    if (typeof value !== 'string' || value.length > 1000) return null;
    try {
      const parsed = JSON.parse(value.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      const keys = Object.keys(parsed);
      const hasEnglish = keys.length === 4 && keys.includes('verseEn') && keys.includes('blessingEn');
      if (keys.length !== 2 && !hasEnglish) return null;
      const allowed = /^[\p{Script=Han}，。！？、；：「」『』《》·—…\s]+$/u;
      function valid(text, min, max) {
        return typeof text === 'string' && text.length >= min && text.length <= max &&
          !/[\r\n\t]/.test(text) && allowed.test(text) && /\p{Script=Han}/u.test(text);
      }
      const { verse, blessing } = parsed;
      if (!valid(verse, 4, 24) || !valid(blessing, 6, 65)) return null;
      const result = { verse: verse.trim(), blessing: blessing.trim() };
      if (!hasEnglish) return result;
      const { verseEn, blessingEn } = parsed;
      const validEnglish = (text, max) => typeof text === 'string' && text.length <= max &&
        /^[A-Za-z0-9 ,.!?;:'’“”"()\-–—]+$/.test(text) && /[A-Za-z]/.test(text);
      if (!validEnglish(verseEn, 100) || !validEnglish(blessingEn, 200)) return null;
      return { ...result, verseEn: verseEn.trim(), blessingEn: blessingEn.trim() };
    } catch (_) { return null; }
  }

  function fortune(ctx) {
    let theme = '随机';
    let phase = 'ready';
    let result;
    let shakeTimer, revealTimer, request;
    let active = true;
    const $ = selector => ctx.root.querySelector(selector);
    const vessel = `<svg viewBox="0 0 230 235" aria-hidden="true">
      <defs><linearGradient id="craft-lacquer" x2="1" y2="0"><stop stop-color="#5c261e"/><stop offset=".44" stop-color="#ad4333"/><stop offset="1" stop-color="#713225"/></linearGradient><pattern id="craft-ribs" width="11" height="8" patternUnits="userSpaceOnUse"><path d="M1 0v8" stroke="#eabf85" opacity=".16"/></pattern></defs>
      <path d="M35 202q80-18 160 0l-13 8H48Z" fill="#462418" opacity=".2"/>
      <ellipse cx="115" cy="89" rx="56" ry="13" fill="#3e2924" stroke="#dcaa68" stroke-width="3"/>
      <g stroke="#976a41" stroke-width="2" stroke-linejoin="round">
      <path d="M86 94L48 28Q49 23 58 22L101 94" fill="#e2af72"/><path d="M101 95L83 13Q88 8 94 9L115 96" fill="#f5d19a"/>
      <path d="M113 96l-1-82q5-5 13-2l1 83" fill="#e6b37a"/><path d="M125 96l18-77q6-3 13 3l-17 75" fill="#f4cd91"/>
      <path d="M136 96l35-58q6-1 12 6l-32 54" fill="#ebb882"/></g>
      <path d="M59 89Q114 108 171 89L158 191Q116 210 72 191Z" fill="url(#craft-lacquer)" stroke="#dfae74" stroke-width="2.5"/>
      <path d="M59 89Q114 108 171 89L158 191Q116 210 72 191Z" fill="url(#craft-ribs)"/>
      <path d="M61 103q53 18 108 0M70 179q46 17 90 0M72 186q44 17 87 0" fill="none" stroke="#e6ae72" stroke-width="1.5"/>
      <path d="M115 116l24 28-24 28-24-28Z" fill="#e9c58d" stroke="#684134" stroke-width="2"/>
      <path d="M115 123l18 21-18 21-18-21Z" fill="none" stroke="#8b5540"/>
      <text x="115" y="152" text-anchor="middle" font-family="serif" font-size="22" fill="#783228">签</text></svg>`;
    ctx.layout(`<div class="craft-fortune-scene"><figure class="craft-vessel">${vessel}<figcaption>${paired('竹筒摇春', 'Bamboo Fortune Sticks')}</figcaption></figure></div>`,
      `<div class="craft-fortune"><p class="eyebrow">${paired('第一坊 · 竹筒', 'Station 1 · Bamboo Cup')}</p><h2>${paired('人日求签', 'Renri Fortunes')}</h2><p class="hint">${paired('心里想着一件小事，从竹筒里摇一支签。', 'Think of a small question, then shake a fortune stick from the bamboo cup.')}</p>
      <fieldset class="craft-theme"><legend>${paired('想问哪件事？', 'What is on your mind?')}</legend><div class="choices">
      ${[...themes, '随机'].map(label => `<label><input type="radio" name="craft-topic" value="${label}"${label === theme ? ' checked' : ''}><span>${paired(label, themeEnglish[label])}</span></label>`).join('')}
      </div></fieldset><div class="craft-fortune-paper" role="status" aria-live="polite" aria-atomic="true" hidden></div>
      <p class="craft-note"></p><div class="actions craft-fortune-actions"></div><p class="status" role="status"></p></div>`);
    const field = $('.craft-theme');
    const paper = $('.craft-fortune-paper');
    const actions = $('.craft-fortune-actions');
    const status = $('.craft-fortune .status');
    const note = $('.craft-fortune .craft-note');
    const scene = $('.craft-fortune-scene');
    field.addEventListener('change', event => { if (event.target.checked) theme = event.target.value; });

    function sync() {
      const ready = phase === 'ready';
      scene.classList.toggle('is-shaking', phase === 'shaking');
      field.disabled = !ready;
      field.hidden = !ready;
      paper.hidden = ready;
      note.innerHTML = phase === 'revealed' ? paired(result.label, result.labelEn) : ctx.online?.hasText ?
        paired('签级在本地抽取，签文尝试由 DeepSeek 撰写。仅供娱乐。', 'Your rank is drawn locally. DeepSeek may write the fortune. For fun only.') : paired(localLabel, localLabelEn);
      if (phase === 'shaking') paper.innerHTML = paired('竹签轻响……', 'The bamboo sticks rattle…');
      if (phase === 'rank' || phase === 'revealed') {
        const rank = paired(ctx.escape(result.rank), rankEnglish[result.rank]);
        const text = phase === 'revealed' ? `<p class="craft-verse">${ctx.escape(result.verse)}<br><span lang="en">${ctx.escape(result.verseEn)}</span></p><p>${ctx.escape(result.blessing)}<br><span lang="en">${ctx.escape(result.blessingEn)}</span></p><small>${paired(`主题 · ${ctx.escape(result.theme)}`, `Theme · ${themeEnglish[result.theme]}`)}</small>` : '';
        paper.innerHTML = `<strong class="craft-rank">${rank}</strong>${text}`;
      }
      actions.innerHTML = ready ? `<button type="button" class="primary" data-fortune="shake">${paired('摇一支签', 'Draw a Fortune')}</button>` : phase === 'revealed' ?
        `<button type="button" class="primary" data-fortune="map">${returnToMap}</button><button type="button" data-fortune="save">${paired('下载签文卡', 'Download Fortune Card')}</button><button type="button" data-fortune="again">${paired('再摇一次', 'Draw Again')}</button>` : '';
    }

    actions.addEventListener('click', async event => {
      const button = event.target.closest('[data-fortune]');
      if (!active || !button) return;
      if (button.dataset.fortune === 'shake' && phase === 'ready') {
        status.textContent = '';
        result = drawFortune(theme);
        phase = 'shaking';
        sync();
        const local = result;
        const online = ctx.online?.hasText ? (() => {
          request = new AbortController();
          return Promise.resolve().then(() => ctx.online.text([
            { role: 'system', content: '为人日嘉年华写游戏签文。只输出 JSON 对象，中文字段为 verse（短签，4至24字）和 blessing（温柔的现实小建议，6至65字），不含数字或外语。若能提供准确、自然的英文翻译，请同时加入 verseEn（不超过100字符）和 blessingEn（不超过200字符）。字段值不换行，不含标记；不要预测结果、提供健康或投资建议、或重复签级。' },
            { role: 'user', content: `主题：${local.theme}。签级已在本地确定为${local.rank}。即使下下签也应温和、不给人压力。` }
          ], { timeout: 8000, signal: request.signal })).then(parseOnlineBlessing).catch(() => null);
        })() : null;
        shakeTimer = setTimeout(() => {
          if (!active) return;
          phase = 'rank';
          sync();
          revealTimer = setTimeout(async () => {
            if (!active) return;
            if (online) {
              status.innerHTML = paired('正在撰写签文……', 'Writing your fortune…');
              const generated = await online;
              if (!active) return;
              status.textContent = '';
              if (generated?.verseEn) result = { ...local, ...generated, label: 'DeepSeek 签文·仅供娱乐', labelEn: 'DeepSeek fortune · for fun only' };
            }
            phase = 'revealed';
            ctx.complete();
            sync();
            ctx.focus('button[data-fortune="map"]');
          }, 420);
        }, 1000);
      } else if (button.dataset.fortune === 'again') {
        phase = 'ready';
        status.textContent = '';
        sync();
        const chosen = field.querySelector(':checked');
        if (chosen) chosen.focus();
      } else if (button.dataset.fortune === 'map') {
        ctx.map();
      } else if (button.dataset.fortune === 'save') {
        const captured = result;
        button.disabled = true;
        let ok = false;
        const title = bilingual('人日求签', 'Renri Fortune');
        const subtitle = bilingual(`${captured.rank} · ${captured.theme}`, `${rankEnglish[captured.rank]} · ${themeEnglish[captured.theme]}`);
        const lines = [captured.verse, captured.verseEn, captured.blessing, captured.blessingEn, bilingual(captured.label, captured.labelEn)];
        try { ok = await ctx.card(title, subtitle, lines); } catch (_) {}
        if (!active || phase !== 'revealed' || captured !== result) return;
        button.disabled = false;
        status.textContent = ok ? bilingual('签文卡已生成。', 'Your fortune card is ready.') : downloadFailed;
      }
    });
    sync();
    return () => { active = false; request?.abort(); clearTimeout(shakeTimer); clearTimeout(revealTimer); };
  }

  const presets = {
    floral: { name: '花胜春衣', nameEn: 'Spring Blossoms', tag: '簪花 · 青衫', tagEn: 'Flowers · green robe', paper: '#f1e2c3', pale: '#d7cda7', robe: '#446b5a', shadow: '#253f38', trim: '#efc492', accent: '#a54849', ink: '#392d29' },
    paper: { name: '剪彩人胜', nameEn: 'Paper-Cut Charms', tag: '彩幡 · 绛衣', tagEn: 'Paper ribbons · crimson robe', paper: '#f3ded0', pale: '#e2bd9f', robe: '#874745', shadow: '#592d37', trim: '#f1ca8a', accent: '#765861', ink: '#392b32' }
  };
  const aperture = { x: 135, y: 76, w: 130, h: 160 };

  function validatePhoto(files) {
    if (files.length !== 1) return bilingual('请选择一张照片。', 'Choose one photo.');
    const file = files[0];
    if (!['image/jpeg', 'image/png'].includes(file.type)) return bilingual('请选择 JPG 或 PNG 照片。', 'Choose a JPG or PNG photo.');
    if (!file.size || file.size > 10 * 1024 * 1024) return bilingual('照片须大于 0 且不超过 10 MB。', 'Use a nonempty photo no larger than 10 MB.');
    return '';
  }

  function coverCrop(w, h, frameW, frameH) {
    const scale = Math.max(frameW / w, frameH / h);
    const cropW = frameW / scale, cropH = frameH / scale;
    return [(w - cropW) / 2, (h - cropH) / 2, cropW, cropH];
  }

  function flower(x, y, scale, color, angle = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})"><path d="M0-3C-15-22 3-26 6-7 23-16 28-1 9 3 25 18 9 27 2 9-4 30-20 16-8 5-29 3-19-17-3-5Z" fill="${color}" stroke="#722f35" stroke-width="1.4"/><path d="M0 1l1-10m0 10 8-3M1 1l5 8M1 1l-8 7M1 1l-8-8" stroke="#963f46" stroke-width="1"/><circle cx="1" cy="1" r="3.3" fill="#e8b35f" stroke="#7f5537" stroke-width=".8"/></g>`;
  }

  function paperCut(x, y, scale, angle = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})"><path d="M0-31l8 9-3 8 23-3v7l-15 6 5 19 11 11-7 4-14-10-8-13-8 13-14 10-7-4 11-11 5-19-15-6v-7l23 3-3-8Z" fill="#a23f40" stroke="#f4ce97" stroke-width="1.2"/><path d="M0-23l3 4-3 4-3-4Zm0 12 7 9-7 9-7-9Z" fill="#f5d7a5"/><path d="M0 9v12m-4-9-4 9m12-9 4 9" fill="none" stroke="#d68165" stroke-width="1.1"/></g>`;
  }

  function portraitSvg(key, layer) {
    const p = presets[key];
    const paper = key === 'paper';
    const surround = paper ? `
      <path d="M61 57q136 45 278-4M56 83q141 45 286-3" fill="none" stroke="#956759" stroke-width="1.5"/>
      ${paperCut(85, 97, .65, -17)}${paperCut(315, 97, .66, 16)}${paperCut(57, 174, .48, -14)}${paperCut(344, 173, .48, 14)}
      <path d="M38 263l17-13 15 9-15 14zM331 259l15-9 17 13-17 10zM65 231l6-6 6 6-6 6zM323 231l6-6 6 6-6 6z" fill="#b66157" opacity=".65"/>` : `
      <g stroke="#72765a" stroke-width="2" fill="none"><path d="M47 292Q82 240 71 176T85 67M74 209q-23-18-29-49m28 26q36-21 37-55m-3 123q-24-13-35-27M351 278q-34-38-15-95t-8-111m6 109q27-13 29-42m-25 28q-21-18-36-28"/></g>
      <g fill="#66745c" stroke="#495845" stroke-width=".8"><path d="M73 223q3 9 32 24-5-23-32-24Zm-4-27q-11-23-22-23 1 21 22 23Zm9-15q15-5 24-29-23 7-24 29ZM332 198q-6-21-22-25 4 19 22 25Zm6-19q21-3 24-22-18 6-24 22Z"/></g>
      ${flower(84, 68, 1.02, '#d69880')}${flower(105, 133, .7, '#e0a490')}${flower(45, 156, .74, '#c98276')}${flower(325, 72, .85, '#d78b7f')}${flower(357, 130, .71, '#e3a690')}${flower(303, 138, .61, '#cc887c')}`;
    const base = `<rect width="400" height="460" fill="${p.paper}"/><rect x="17" y="17" width="366" height="426" rx="3" fill="none" stroke="#825d4c" stroke-width="1.2"/><rect x="23" y="23" width="354" height="414" rx="2" fill="none" stroke="#ab775c" stroke-width=".6"/>
      <circle cx="200" cy="200" r="133" fill="${p.pale}" stroke="#ad8267" stroke-width="1"/><circle cx="200" cy="200" r="123" fill="none" stroke="#f7ead1" stroke-width="1.8" stroke-dasharray="2 5"/>
      <path d="M34 195h28l9-8m261 11h32m-325 76h22m279-2h23m-324 34h18m290 3h16" fill="none" stroke="#ae815d" opacity=".55"/>${surround}
      <g fill="none" stroke="#ac775d" stroke-width="1"><path d="M32 54V33h21m294 0h21v21M32 395v27h23m291 0h22v-27"/><path d="M39 45v-5h8m306 0h8v5M39 411v4h8m306 0h8v-4"/></g>`;
    const sample = `<g data-part="sample-face" stroke="${p.ink}" stroke-width="1.4" stroke-linejoin="round">
      <path d="M119 222q7-43 13-77l15-26 110-4q17 32 15 67l12 52-24 26-42-18-47 13Z" fill="#4b3433"/><path d="M141 123q-21-48 17-68 39-22 66 10 10-20 39-8 31 18 12 63Z" fill="#463132"/>
      <path d="M142 108q-16-24 11-44 20-14 39-13m30 25q10-19 34-13m-109 42q-2-22 21-36m87 18q16 4 21 15" fill="none" stroke="#967052" stroke-width=".9"/>
      <path d="M157 176c-22-15-30 12-11 29l15 2m82-30c19-13 28 13 11 28l-14 2" fill="#e5ab92"/><path d="M177 206l-5 41 29 24 26-24-6-48" fill="#e2a58a"/>
      <path d="M147 145q5-46 54-47 49 2 51 51-1 53-18 69-20 20-35 20-19-1-36-23-15-17-16-70Z" fill="#f0c4a4"/>
      <path d="M142 176q-19-66 25-86 29-15 58-3 34 9 40 52l-14 33-8-31q-38-3-55-32-8 26-39 39l-2 26Z" fill="#4e3635"/>
      <path d="M144 145q25-11 38-40m9-6q21 31 53 35m-49-43q19 19 41 27m-93 15q0-24 26-38" fill="none" stroke="#a6795b" stroke-width=".95"/>
      <path d="M163 159q12-7 24-2m25 0q13-5 24 2m-71 12q10-6 21 0m27 0q10-6 20 0m-35 1-5 18 7 3m-12 12q11 7 23-1" fill="none" stroke-linecap="round"/>
      <path d="M193 204l6-2 5 1 6-1q-9 10-17 2Z" fill="#b25855" stroke="none"/><ellipse cx="164" cy="187" rx="9" ry="3" fill="#d67f75" stroke="none" opacity=".55"/><ellipse cx="235" cy="187" rx="9" ry="3" fill="#d67f75" stroke="none" opacity=".55"/>
      <path d="M143 188v29m113-29v29" stroke="#ae7545"/><path d="M143 213l4 8-4 6-4-6Zm113 0 4 8-4 6-4-6Z" fill="#e5a66b" stroke="#a96143"/>
      <path d="M123 215q7 24 17 27m116-22q6 11 13 13" fill="none" stroke="#967052"/></g>`;
    const garment = `<g stroke="${p.ink}" stroke-width="1.55" stroke-linejoin="round">
      <path d="M69 369q1-81 39-105 26-16 63-32l29 29 31-29q67 17 88 53 13 26 17 84Z" fill="${p.robe}"/>
      <path d="M69 369q1-68 38-101l24 47-3 54Zm267 0q-4-60-31-93l-26 37-8 56Z" fill="${p.shadow}"/>
      <path d="M110 271q14 45 15 98m174-83q-15 33-23 83M91 365q8-42 18-59m194 20 15 42M251 289l-16 58" fill="none" stroke="${p.trim}" stroke-opacity=".45" stroke-width="1.1"/>
      <path d="M172 229q-9 3-20 11l46 68 25-23Z" fill="${p.trim}"/><path d="M229 229q13 4 24 11l-69 129h-34Z" fill="${p.trim}"/>
      <path d="M161 237l38 54m40-53-70 131M243 241l-69 128" fill="none" stroke="${p.accent}" stroke-width="1.25"/>
      <path d="M195 350q12-13 28-9 13-17 27-9 15-9 26-1m-68 20q14 8 26-1 11 6 24-2m-14-9 5 3" fill="none" stroke="${p.trim}" stroke-width="1.1"/>
      ${paper ? `${paperCut(232, 313, .35, 10)}${paperCut(99, 343, .26, 2)}` : `${flower(235, 315, .67, '#dcc08f')}${flower(97, 344, .37, '#d7aa84')}`}
      </g>`;
    const crown = paper ? `<g><path d="M142 105q56-35 115 0l-3-13q-58-31-110 0Z" fill="#9e4447" stroke="#6d3535" stroke-width="1.3"/>
      <path d="M146 96q54-27 108 0" fill="none" stroke="#edb880" stroke-width="1.4"/>
      ${paperCut(198, 72, .75)}${paperCut(158, 92, .46, -28)}${paperCut(242, 91, .48, 28)}
      <path d="M255 101q17 10 20 31m-20-30q24 6 28 22m-140-22q-14 10-17 27" fill="none" stroke="#b2604e" stroke-width="2"/></g>` : `<g><path d="M133 105q34-35 78-31m31 12q21 21 27 48m-27-48q29 8 39 40" fill="none" stroke="#ab7b48" stroke-width="2"/>
      <path d="M153 93q-21-11-24-23 15-2 24 23Zm10-2q-2-23 13-30 4 16-13 30Zm79 3q21-20 34-13-3 15-34 13Z" fill="#7a8560" stroke="#52634a"/>
      ${flower(151, 101, .8, '#d48a85')}${flower(171, 83, 1, '#eab298')}${flower(190, 76, .53, '#ebbf98')}${flower(248, 96, .7, '#d69086')}
      <path d="M252 105q3 27 9 38m-2-35q2 21 13 31" fill="none" stroke="#d4a274" stroke-width="1.3"/><circle cx="261" cy="143" r="2.5" fill="#e8bf91"/><circle cx="272" cy="139" r="2.5" fill="#e8bf91"/></g>`;
    const caption = `<path d="M24 372h352v64H24Z" fill="${p.paper}"/><path d="M25 373h350m-349 4h348" stroke="#997258" stroke-width="1"/>
      <text x="200" y="398" text-anchor="middle" fill="${p.ink}" font-family="KaiTi, STKaiti, SimSun, serif" font-size="21" letter-spacing="5">${p.name}</text>
      <text x="200" y="416" text-anchor="middle" fill="${p.ink}" font-family="serif" font-size="15" lang="en">${p.nameEn}</text>
      <text x="200" y="430" text-anchor="middle" fill="#805747" font-size="10" font-family="KaiTi, SimSun, serif">正月初七 / <tspan lang="en">Renri · Lunar Day 7</tspan></text>
      <rect x="325" y="394" width="25" height="25" fill="#a44d44" rx="1.5"/><text x="337.5" y="410.5" text-anchor="middle" font-size="11" font-family="KaiTi, SimSun, serif" fill="#f0d6ad">人日</text>`;
    const artwork = layer === 'base' ? base : layer === 'overlay' ? garment + crown + caption : base + sample + garment + crown + caption;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="460" viewBox="0 0 400 460" role="img" aria-label="${bilingual(p.name, p.nameEn)}">${artwork}</svg>`;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('图像无法读取'));
      image.src = src;
    });
  }

  async function svgImage(markup) {
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    try { return await loadImage(url); } finally { URL.revokeObjectURL(url); }
  }

  async function collage(key, photo) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 920;
    const ink = canvas.getContext('2d');
    if (!ink) throw new Error('当前浏览器无法绘制小像');
    ink.scale(2, 2);
    if (!photo) {
      ink.drawImage(await svgImage(portraitSvg(key)), 0, 0);
      return canvas;
    }
    const [ground, foreground] = await Promise.all(['base', 'overlay'].map(layer => svgImage(portraitSvg(key, layer))));
    ink.drawImage(ground, 0, 0);
    const { x, y, w, h } = aperture;
    ink.save();
    ink.beginPath();
    ink.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ink.clip();
    ink.fillStyle = presets[key].pale;
    ink.fillRect(x, y, w, h);
    ink.drawImage(photo, ...coverCrop(photo.naturalWidth, photo.naturalHeight, w, h), x, y, w, h);
    ink.restore();
    ink.strokeStyle = presets[key].ink;
    ink.lineWidth = 1.3;
    ink.stroke();
    ink.drawImage(foreground, 0, 0);
    return canvas;
  }

  async function renderOnlinePortrait(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const image = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ink = canvas.getContext('2d');
      if (!ink || !canvas.width || !canvas.height) throw new Error('无法读取生成的妆造');
      ink.drawImage(image, 0, 0);
      return canvas;
    } finally { URL.revokeObjectURL(url); }
  }

  function dress(ctx) {
    let active = true;
    let current = null;
    let releaseDialog = null;
    const $ = selector => ctx.root.querySelector(selector);
    const sampleLabel = paired('用插画样张', 'Use a Sample Portrait');
    ctx.layout(`<div class="craft-dress-scene"><div class="craft-portrait-stage"><p class="craft-stage-title">${paired('初七画谱', 'Renri Portrait Album')}</p><div class="craft-portrait-gallery" aria-hidden="true">${portraitSvg('paper')}${portraitSvg('floral')}</div><div class="craft-portrait-display" hidden></div><p class="craft-stage-text">${paired('一面春色 · 一袭新衣', 'A Touch of Spring · A New Outfit')}</p></div></div>`,
      `<div class="craft-dress"><p class="eyebrow">${paired('第四坊 · 小像', 'Station 4 · Portraits')}</p><h2>${paired('人胜妆造', 'Renri Dress-Up')}</h2><p class="hint">${paired('古人在初七剪彩为人，戴在人头簪边。今日也来择一件新衣，配一枚人胜。', 'On Renri, people once wore paper figures beside their hairpins. Choose a new outfit and a charm of your own.')}</p>
      <fieldset class="craft-theme"><legend>${paired('挑一套妆造', 'Choose a Look')}</legend><div class="choices craft-presets">
      ${Object.entries(presets).map(([id, preset], index) => `<label><input type="radio" name="craft-preset" value="${id}"${index ? '' : ' checked'}><span><i class="craft-swatch craft-swatch-${id}" aria-hidden="true"></i><b>${paired(preset.name, preset.nameEn)}</b><small>${paired(preset.tag, preset.tagEn)}</small></span></label>`).join('')}
      </div></fieldset><p class="craft-note">${ctx.online?.hasImage ? paired('可直接用插画样张，或上传自拍调用 AI 图片模型生成。', 'Use a sample, or upload a selfie to generate a portrait with the AI image model.') : paired('可直接用插画样张；配置生图接口与密钥后可由 AI 图片模型生成，未配置时自拍仅在本地处理。', 'Use a sample, or configure an image API to generate an AI portrait. Otherwise selfies are processed locally.')}</p>
      <div class="actions craft-dress-actions"><button type="button" class="primary" data-dress="sample">${sampleLabel}</button><button type="button" data-dress="photo">${paired('使用我的自拍', 'Use My Selfie')}</button><button type="button" data-dress="save" hidden>${paired('下载妆造 PNG', 'Download Portrait PNG')}</button><button type="button" data-dress="map" hidden>${returnToMap}</button></div><p class="status" role="status" aria-live="polite"></p></div>`);
    const stage = $('.craft-portrait-display');
    const gallery = $('.craft-portrait-gallery');
    const actions = $('.craft-dress-actions');
    const status = $('.craft-dress .status');
    const save = $('[data-dress="save"]');
    const map = $('[data-dress="map"]');
    const sample = $('[data-dress="sample"]');
    const selected = () => $('input[name="craft-preset"]:checked').value;

    function show(key, canvas, source = 'local') {
      current = { key, canvas };
      const preset = presets[key];
      if (canvas) {
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', bilingual(`${preset.name} · 自拍小像`, `${preset.nameEn} · Selfie Portrait`));
        stage.replaceChildren(canvas);
      } else {
        stage.innerHTML = portraitSvg(key);
      }
      stage.hidden = false;
      gallery.hidden = true;
      save.hidden = map.hidden = false;
      save.disabled = false;
      sample.innerHTML = canvas ? paired('移除自拍，换回样张', 'Remove Selfie and Use Sample') : sampleLabel;
      const complete = paired(`已完成「${preset.name}」${canvas ? '自拍小像' : '插画小像'}。`, `Your ${preset.nameEn} ${canvas ? 'selfie portrait' : 'sample portrait'} is ready.`);
      const detail = source === 'online' ? paired('由 AI 图片模型生成。', 'Generated by AI image model.') : source === 'fallback' ? paired('图片模型未能生成，已改用本地拼贴。', 'AI generation failed. A local collage was used instead.') : '';
      status.innerHTML = `${complete}${detail ? `<br>${detail}` : ''}`;
      ctx.complete();
    }

    function askPhoto(key) {
      const canSend = !!ctx.online?.hasImage;
      const cancel = `<button type="button" data-photo="cancel">${paired('取消', 'Cancel')}</button>`;
      ctx.dialog(bilingual('使用自拍前，请先确认', 'Before Using a Selfie'), `<div class="craft-consent">
        ${canSend
          ? `<p><strong>${paired('AI 图片模型生成。', 'AI image model generation.')}</strong> ${paired('选图并确认后，自拍将发送至你配置的图片模型接口，为你生成人胜妆造小像。小像不会发布到公开墙，可自行下载 PNG。', 'After choosing and confirming a photo, your selfie is sent to your configured image API to generate your portrait. It is not posted publicly and can be downloaded as a PNG.')}</p>`
          : `<p>${paired('当前未配置生图密钥/代理，照片只在浏览器内存中处理，不上传。小像不会发布到公开墙；可自行下载 PNG，离开此坊即移除页面上的小像。', 'No image API key is configured; your photo stays in this browser’s memory and is never uploaded. Your portrait is not posted publicly. You can download a PNG; leaving this station removes the portrait from the page.')}</p>`}
        <p class="hint">${paired('请选择一张 JPG 或 PNG（不超过 10 MB）。正脸居中、光线均匀的照片效果较好。', 'Choose one JPG or PNG up to 10 MB. A centered, front-facing photo with even lighting works best.')}</p>
        <div class="actions">${canSend
          ? `<button type="button" class="primary" data-photo="online">${paired('选择照片，由图片模型生成', 'Choose Photo for AI Portrait')}</button>`
          : `<button type="button" class="primary" data-photo="allow">${paired('选择用于本地生成的小像照片', 'Choose a Photo for Local Portrait')}</button>`}${cancel}</div>
        <div data-photo="picker" hidden><label class="craft-file">${paired('选择一张照片', 'Choose a Photo')}<input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png"></label>
        <div class="craft-photo-preview" hidden><img alt="待确认的自拍预览 / Selfie preview before confirmation"><span>${paired('预览 · 尚未生成', 'Preview · Portrait not yet generated')}</span></div>
        <div class="craft-loading" data-photo="loading" hidden><span class="craft-spinner" aria-hidden="true"></span><span>${paired('正在调用图片模型生成妆造，请稍候…', 'Generating portrait with AI image model…')}</span></div>
        <div class="actions"><button type="button" class="primary" data-photo="confirm" disabled>${paired('确认生成小像', 'Confirm and Create Portrait')}</button>${cancel}</div></div>
        <p class="status" role="status" aria-live="polite"></p></div>`, (dialog, close) => {
        const find = selector => dialog.querySelector(selector);
        const picker = find('[data-photo="picker"]');
        const allow = find('[data-photo="allow"]');
        const onlineBtn = find('[data-photo="online"]');
        const loading = find('[data-photo="loading"]');
        const input = find('input[type="file"]');
        const preview = find('.craft-photo-preview');
        const image = preview.querySelector('img');
        const confirm = find('[data-photo="confirm"]');
        const feedback = find('.status');
        let url = null, version = 0, photo = null, closed = false, onlineMode = canSend, request = null;
        function clearPreview() {
          version++;
          if (url) URL.revokeObjectURL(url);
          url = photo = null;
          image.removeAttribute('src');
          preview.hidden = true;
          loading.hidden = true;
          confirm.disabled = true;
        }
        function release() {
          if (closed) return;
          closed = true;
          request?.abort();
          clearPreview();
          if (releaseDialog === release) releaseDialog = null;
        }
        releaseDialog = release;
        dialog.addEventListener('close', release, { once: true });
        dialog.addEventListener('cancel', release, { once: true });
        function stop() { release(); close(); }
        function live(token) { return active && !closed && token === version && dialog.isConnected && (!('open' in dialog) || dialog.open); }
        function chooseMode(send) {
          onlineMode = send;
          picker.hidden = false;
          (onlineBtn || allow).parentElement.hidden = true;
          confirm.innerHTML = send ? paired('确认上传并由图片模型生成', 'Confirm & Generate Portrait') : paired('确认在本地生成小像', 'Create Portrait Locally');
          input.focus();
          input.click();
        }
        if (allow) allow.addEventListener('click', () => chooseMode(false));
        if (onlineBtn) onlineBtn.addEventListener('click', () => chooseMode(true));
        for (const button of dialog.querySelectorAll('[data-photo="cancel"]')) button.addEventListener('click', stop);
        input.addEventListener('change', async () => {
          clearPreview();
          const token = version;
          const issue = validatePhoto(input.files);
          feedback.textContent = issue;
          if (issue) { input.value = ''; return; }
          const file = input.files[0];
          try {
            const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
            const expected = file.type === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10] : [255, 216, 255];
            if (!live(token)) return;
            if (!expected.every((byte, index) => byte === signature[index])) throw new Error('文件不是有效的 JPG 或 PNG');
            url = URL.createObjectURL(file);
            const decoded = await loadImage(url);
            if (!live(token)) return;
            if (!decoded.naturalWidth || !decoded.naturalHeight) throw new Error('照片无法解码');
            photo = decoded;
            image.src = url;
            preview.hidden = false;
            confirm.disabled = false;
            feedback.innerHTML = onlineMode ? paired('照片已就绪，尚未上传。请确认是否同意上传。', 'Your photo is ready and has not been uploaded. Confirm only if you agree to upload it.') : paired('照片已就绪，请确认生成。', 'Your photo is ready. Confirm to create your portrait.');
          } catch (_) {
            if (!live(token)) return;
            clearPreview();
            input.value = '';
            feedback.innerHTML = paired('无法打开这张照片，请换一张 JPG 或 PNG，或取消后使用样张。', 'Could not open this photo. Try another JPG or PNG, or cancel and use a sample.');
          }
        });
        confirm.addEventListener('click', async () => {
          if (!photo || closed) return;
          const token = version;
          confirm.disabled = input.disabled = true;
          loading.hidden = false;
          loading.lastElementChild.innerHTML = onlineMode ? paired('正在调用图片模型生成妆造，请稍候…', 'Generating portrait with AI image model…') : paired('正在本地绘制小像，请稍候…', 'Creating your portrait locally…');
          feedback.textContent = '';
          try {
            let canvas, source = 'local';
            if (onlineMode) {
              try {
                request = new AbortController();
                const blob = await ctx.online.image(input.files[0], key, { timeout: 120000, signal: request.signal });
                if (!live(token)) return;
                canvas = await renderOnlinePortrait(blob);
                source = 'online';
              } catch (err) {
                if (!live(token)) return;
                loading.hidden = true;
                confirm.disabled = input.disabled = false;
                feedback.innerHTML = paired(`图片生成失败（${err?.message || '请检查接口与密钥'}），请重试或更换照片。`, `Image generation failed (${err?.message || 'check URL or key'}). Retry or choose another photo.`);
                return;
              } finally { request = null; }
            }
            if (!live(token)) return;
            if (!canvas) canvas = await collage(key, photo);
            if (!live(token)) return;
            show(key, canvas, source);
            stop();
            ctx.focus('[data-dress="save"]');
          } catch (_) {
            if (!live(token)) return;
            loading.hidden = true;
            confirm.disabled = input.disabled = false;
            feedback.innerHTML = paired('未能生成小像，请重试、换图，或取消后使用样张。', 'Could not create the portrait. Try again, choose another photo, or cancel and use a sample.');
          }
        });
      });
    }

    actions.addEventListener('click', async event => {
      const button = event.target.closest('[data-dress]');
      if (!active || !button) return;
      const action = button.dataset.dress;
      if (action === 'sample') show(selected());
      if (action === 'photo') askPhoto(selected());
      if (action === 'map') ctx.map();
      if (action !== 'save' || !current) return;
      const captured = current;
      button.disabled = true;
      status.innerHTML = paired('正在生成 PNG……', 'Preparing your PNG…');
      try {
        const canvas = captured.canvas || await collage(captured.key);
        if (!active || current !== captured) return;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!active || current !== captured) return;
        if (!blob) throw new Error('无法生成 PNG');
        const url = URL.createObjectURL(blob);
        try {
          const download = document.createElement('a');
          download.href = url;
          const preset = presets[captured.key];
          download.download = `人日妆造-Renri-Portrait-${preset.name}-${preset.nameEn}.png`;
          document.body.append(download);
          try { download.click(); } finally { download.remove(); }
        } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
        status.innerHTML = paired('小像 PNG 已生成。', 'Your portrait PNG is ready.');
      } catch (_) {
        if (active && current === captured) status.textContent = downloadFailed;
      } finally {
        if (active && current === captured) button.disabled = false;
      }
    });
    return () => {
      active = false;
      if (releaseDialog) releaseDialog();
      if (current && current.canvas) stage.replaceChildren();
      current = null;
    };
  }

  if (typeof window !== 'undefined') window.craft = { fortune, dress };
  if (typeof module !== 'undefined' && module.exports) module.exports = { drawFortune, validatePhoto, coverCrop, portraitSvg, parseOnlineBlessing };
})();
