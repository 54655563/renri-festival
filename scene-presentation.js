/* 原场景的春日白昼：女孩握签祈愿，独行书生沿石阶登顶。
 * 保留底图的青灰、米白、朱红与金色；背景、人物、手指依次分层。
 * 签以握点为轴；人物以足底贴合石阶。仅装饰原有交互，不改游戏规则。 */
(() => {
  'use strict';
  const svg = markup => {
    const holder = document.createElement('div');
    holder.innerHTML = markup;
    return holder.firstElementChild;
  };

  const originalFortune = window.craft.fortune;
  window.craft.fortune = function (ctx) {
    const cleanup = originalFortune(ctx);
    const scene = ctx.root.querySelector('.craft-fortune-scene');
    scene.classList.add('illustrated-fortune');
    scene.append(svg(`<svg class="painted-scene" viewBox="0 0 1672 941" aria-hidden="true">
      <defs><clipPath id="fortune-fingers"><path d="M980 447 Q997 445 1001 463 L1001 482 Q995 500 982 500 L972 490 978 477 976 461Z"/></clipPath></defs>
      <image href="assets/fortune-hand-empty.jpg" width="1672" height="941"/>
      <g transform="translate(985 474)"><g class="held-fortune-stick">
        <path d="M-3-106H3V45Q0 49-3 45Z" fill="#a57a50" stroke="#78533c" stroke-width="1.7"/>
        <path d="M-26-194L-7-208Q0-220 6-208L26-194V-66L-26-62Z" fill="#f0dfb9" stroke="#9b7a54" stroke-width="1.7"/>
        <path d="M-21-191L-5-203Q1-211 5-203L21-191V-71L-21-67Z" fill="none" stroke="#c7af83" stroke-width="1"/>
        <path d="M0-215V-195" stroke="#80553a" stroke-width="2"/><circle cy="-192" r="2.6" fill="#80553a"/>
        <text x="0" y="-163" text-anchor="middle" font-family="KaiTi,STKaiti,serif" font-size="29" fill="#a34e3b">上</text>
        <text x="0" y="-130" text-anchor="middle" font-family="KaiTi,STKaiti,serif" font-size="29" fill="#a34e3b">上</text>
        <path d="M-3-78Q-15-100 7-116M-7-94l-9-7m10 3 12-7m-7-2-2-8" fill="none" stroke="#a39871" stroke-width="1.5"/>
      </g></g>
      <image href="assets/fortune-hand-empty.jpg" width="1672" height="941" clip-path="url(#fortune-fingers)"/>
    </svg>`));
    return () => { cleanup?.(); };
  };

  const originalClimb = window.kinetic.climb;
  window.kinetic.climb = function (ctx) {
    const cleanup = originalClimb(ctx);
    const scene = ctx.root.querySelector('.climb-scene');
    scene.classList.add('illustrated-climb');
    const art = svg(`<svg class="painted-scene" viewBox="0 0 1672 941" aria-hidden="true">
      <defs><clipPath id="scholar-outline"><path d="M530 76Q600 61 601 119L582 163 598 251Q654 274 690 335L724 430 745 572 737 682 704 791 704 940 725 1168 725 1289 700 1308 705 1409 575 1444 547 1492 509 1498 481 1475 399 1466 343 1440 322 1408 330 1385 299 1370 307 1280 299 1160 318 986 316 851 302 830Q252 768 253 688L273 576 305 538 326 444Q343 355 408 302L453 274 455 226Q443 190 463 154L495 117 530 109Z"/></clipPath></defs>
      <image href="assets/climb-empty.jpg" width="1672" height="941"/>
      <path id="painted-mountain-trail" d="M1305 810 L1265 770 1205 730 1170 700 1130 675 1070 640 1010 615 940 585 870 565 810 551 775 546 820 534 800 515 750 490 700 464 660 450 638 441 670 420 713 399 765 381 820 363 880 348 917 335 912 323 870 307 825 291 795 284 850 277 915 267 985 255" fill="none" stroke="none"/>
      <g id="painted-climber"><ellipse cx="0" cy="-1" rx="15" ry="3" fill="#4a5146" opacity=".18"/>
        <svg x="-40" y="-116" width="80" height="116" viewBox="0 0 1024 1500" overflow="visible"><image href="assets/climber.png" width="1024" height="1536" clip-path="url(#scholar-outline)"/></svg>
      </g>
    </svg>`);
    scene.prepend(art);
    const route = art.querySelector('#painted-mountain-trail');
    const person = art.querySelector('#painted-climber');
    const meter = ctx.root.querySelector('#climb-height');
    const summit = ctx.root.querySelector('#climb-summit');
    const length = route.getTotalLength();
    function paint() {
      const progress = summit.hidden ? Math.max(0, Math.min(100, Number(meter.value) || 0)) : 100;
      const {x, y} = route.getPointAtLength(length * progress / 100);
      const scale = 1 - progress * .004;
      person.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
      person.dataset.progress = String(progress);
    }
    const observer = new MutationObserver(paint);
    observer.observe(meter, {attributes: true, attributeFilter: ['value']});
    observer.observe(summit, {attributes: true, attributeFilter: ['hidden']});
    paint();
    return () => { observer.disconnect(); cleanup?.(); };
  };
})();
