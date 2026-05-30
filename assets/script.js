/* ===========================================================
   thetechgeekko.github.io — main script
   Cursor · theme · bento hover · counter · year
   =========================================================== */

(() => {
  'use strict';

  // ----- year -----
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // ----- theme -----
  const root = document.documentElement;
  const stored = (() => { try { return localStorage.getItem('theme'); } catch { return null; } })();
  if (stored === 'light' || stored === 'dark') root.setAttribute('data-theme', stored);
  const toggle = document.getElementById('theme-toggle');
  toggle && toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
  });

  // ----- custom cursor -----
  const cursor = document.querySelector('.cursor');
  let cx = 0, cy = 0, tx = 0, ty = 0;
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
    });
    const tick = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    };
    tick();
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      const kind = el.getAttribute('data-cursor');
      el.addEventListener('pointerenter', () => cursor.classList.add('is-' + kind));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-' + kind));
    });
  }

  // ----- bento card mouse glow -----
  document.querySelectorAll('.bento-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });

  // ----- github repo counter -----
  const counter = document.querySelector('[data-count]');
  if (counter) {
    fetch('https://api.github.com/users/thetechgeekko')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const n = (data.public_repos || 0) + (data.total_private_repos || 0);
        animateCount(counter, n);
      })
      .catch(() => animateCount(counter, 12));
  }
  function animateCount(el, target) {
    const dur = 1200;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(target * e);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ----- konami easter egg -----
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;
  window.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === seq[idx]) {
      idx++;
      if (idx === seq.length) {
        idx = 0;
        document.body.classList.toggle('invert');
        flash('konami unlocked');
      }
    } else {
      idx = (k === seq[0]) ? 1 : 0;
    }
  });

  function flash(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position: fixed; left: 50%; top: 24px; transform: translateX(-50%);
      background: var(--fg); color: var(--bg);
      padding: 10px 18px; border-radius: 999px;
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      letter-spacing: .12em; text-transform: uppercase;
      z-index: 9998; opacity: 0;
      transition: opacity .3s, transform .4s;
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(4px)'; });
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 2200);
  }

  // ----- intersection reveal -----
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '-10% 0px' });
  document.querySelectorAll('.bento-card, .game-card, .section-head').forEach(el => io.observe(el));

  // tiny CSS injection for reveal
  const css = `
    .bento-card, .game-card, .section-head, .spec-panel {
      opacity: 0; transform: translateY(18px);
      transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1);
    }
    .bento-card.is-in, .game-card.is-in, .section-head.is-in, .spec-panel.is-in {
      opacity: 1; transform: translateY(0);
    }
    body.invert { filter: invert(1) hue-rotate(180deg); }
    body.invert .grain, body.invert .cursor { filter: invert(1) hue-rotate(180deg); }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  document.querySelectorAll('.spec-panel').forEach(el => io.observe(el));

  // ============== SPECTRUM LAB ==============
  initSpectrumLab();
})();

function initSpectrumLab() {
  const slider = document.querySelector('.spec-slider');
  const thumb  = document.querySelector('.spec-thumb');
  const swatch = document.querySelector('[data-spec-swatch]');
  const heroCursor = document.querySelector('.spectrum-cursor');
  const heroReadout = document.querySelector('[data-spectrum-readout]');
  if (!slider) return;

  const NM_MIN = 380, NM_MAX = 780;

  function nmToRgb(w) {
    let r = 0, g = 0, b = 0;
    if (w >= 380 && w < 440)      { r = -(w - 440) / 60; g = 0; b = 1; }
    else if (w >= 440 && w < 490) { r = 0; g = (w - 440) / 50; b = 1; }
    else if (w >= 490 && w < 510) { r = 0; g = 1; b = -(w - 510) / 20; }
    else if (w >= 510 && w < 580) { r = (w - 510) / 70; g = 1; b = 0; }
    else if (w >= 580 && w < 645) { r = 1; g = -(w - 645) / 65; b = 0; }
    else if (w >= 645 && w <= 780){ r = 1; g = 0; b = 0; }
    let f = 1;
    if (w >= 380 && w < 420)      f = .3 + .7 * (w - 380) / 40;
    else if (w >= 700 && w <= 780) f = .3 + .7 * (780 - w) / 80;
    const gamma = 0.8;
    return [
      Math.round(255 * Math.pow(Math.max(0, r * f), gamma)),
      Math.round(255 * Math.pow(Math.max(0, g * f), gamma)),
      Math.round(255 * Math.pow(Math.max(0, b * f), gamma))
    ];
  }

  function bandName(w) {
    if (w < 450) return 'violet';
    if (w < 485) return 'blue';
    if (w < 500) return 'cyan';
    if (w < 565) return 'green';
    if (w < 590) return 'yellow';
    if (w < 625) return 'orange';
    return 'red';
  }

  const STOCK_PEAKS = [
    { key: 'portra', name: 'Portra 400', R: 605, G: 545, B: 450, color: '#ff8e6a' },
    { key: 'ektar',  name: 'Ektar 100',  R: 620, G: 545, B: 445, color: '#ffd25e' },
    { key: 'velvia', name: 'Velvia 50',  R: 610, G: 540, B: 440, color: '#7fffb8' },
    { key: 'hp5',    name: 'HP5+',       R: 550, G: 550, B: 550, color: '#9ad1ff' },
  ];

  function closestPeak(w) {
    let best = null, bestD = Infinity;
    STOCK_PEAKS.forEach((s) => {
      ['R', 'G', 'B'].forEach((ch) => {
        const d = Math.abs(s[ch] - w);
        if (d < bestD) { bestD = d; best = `${s.name} ${ch} layer`; }
      });
    });
    return best;
  }

  function hex(r, g, b) {
    const h = (n) => n.toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  }

  const elNm   = document.querySelector('[data-spec-nm]');
  const elBand = document.querySelector('[data-spec-band]');
  const elRgb  = document.querySelector('[data-spec-rgb]');
  const elHex  = document.querySelector('[data-spec-hex]');
  const elStk  = document.querySelector('[data-spec-stock]');

  function update(w) {
    const pct = (w - NM_MIN) / (NM_MAX - NM_MIN);
    const [r, g, b] = nmToRgb(w);
    const band = bandName(w);
    const hx = hex(r, g, b);
    if (thumb) thumb.style.left = `calc(${(pct * 100).toFixed(2)}% - 2px)`;
    if (swatch) {
      swatch.style.background = `linear-gradient(135deg, ${hx}, ${hx} 60%, rgba(255,255,255,.1))`;
      swatch.style.boxShadow = `inset 0 0 30px rgba(0,0,0,.25), 0 0 36px ${hx}55`;
    }
    if (elNm)   elNm.textContent = `${w} nm`;
    if (elBand) elBand.textContent = band;
    if (elRgb)  elRgb.textContent = `${r}, ${g}, ${b}`;
    if (elHex)  elHex.textContent = hx;
    if (elStk)  elStk.textContent = closestPeak(w);
    if (heroCursor) heroCursor.style.left = `${(pct * 100).toFixed(2)}%`;
    if (heroReadout) heroReadout.textContent = `${w} nm · ${band}`;
    drawCurves(w);
  }

  slider.addEventListener('input', () => update(+slider.value));

  // ----- curves canvas -----
  const canvas = document.getElementById('spec-curves');
  let active = { portra: true, ektar: false, velvia: false, hp5: false };
  let dpr, cw, ch;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const resize = () => {
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const r = canvas.getBoundingClientRect();
      cw = r.width; ch = r.height;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawCurves(+slider.value);
    };
    new ResizeObserver(resize).observe(canvas);

    function wToX(w) {
      return ((w - NM_MIN) / (NM_MAX - NM_MIN)) * (cw - 40) + 30;
    }
    function dToY(d) {
      return ch - 28 - d * (ch - 56);
    }
    function gauss(w, peak, sigma) {
      const dx = w - peak;
      return Math.exp(-(dx * dx) / (2 * sigma * sigma));
    }

    window.drawCurves = function(currentNm) {
      if (!ctx) return;
      ctx.clearRect(0, 0, cw, ch);
      // bg rainbow strip
      const grad = ctx.createLinearGradient(30, 0, cw - 10, 0);
      const stops = [
        [.00, '#a45dff'], [.15, '#6ab7ff'], [.30, '#58e7d8'],
        [.45, '#5eda86'], [.60, '#f4e555'], [.78, '#ff9a3a'], [1, '#ff3a3a']
      ];
      stops.forEach(([s, c]) => grad.addColorStop(s, c));
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = grad;
      ctx.fillRect(30, ch - 16, cw - 40, 4);
      ctx.globalAlpha = 1;

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,.06)';
      ctx.lineWidth = 1;
      for (let w = 400; w <= 750; w += 50) {
        const x = wToX(w);
        ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, ch - 18); ctx.stroke();
        ctx.fillStyle = 'rgba(165,156,142,.6)';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`${w}`, x - 12, ch - 4);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.08)';
      ctx.beginPath(); ctx.moveTo(20, ch - 18); ctx.lineTo(cw - 10, ch - 18); ctx.stroke();

      // y-axis label
      ctx.save();
      ctx.translate(14, ch / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = 'rgba(165,156,142,.6)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('sensitivity', 0, 0);
      ctx.restore();

      // draw current-wavelength marker
      const cx = wToX(currentNm);
      ctx.strokeStyle = 'rgba(244,233,216,.7)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(cx, 8); ctx.lineTo(cx, ch - 18); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(244,233,216,.9)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${currentNm} nm`, cx + 4, 14);

      // stock curves
      const channels = [
        { key: 'R', sigma: 36, c: ['rgba(255,58,58,.95)', 'rgba(255,58,58,.18)'] },
        { key: 'G', sigma: 34, c: ['rgba(94,218,134,.95)', 'rgba(94,218,134,.18)'] },
        { key: 'B', sigma: 32, c: ['rgba(106,183,255,.95)', 'rgba(106,183,255,.18)'] },
      ];

      STOCK_PEAKS.forEach((stock) => {
        if (!active[stock.key]) return;
        const isPan = stock.key === 'hp5';
        const chs = isPan ? [{ key: 'P', sigma: 90, c: ['rgba(244,233,216,.85)', 'rgba(244,233,216,.10)'] }] : channels;
        chs.forEach((cc) => {
          const peak = isPan ? 550 : stock[cc.key];
          // fill
          ctx.beginPath();
          ctx.moveTo(wToX(NM_MIN), dToY(0));
          for (let w = NM_MIN; w <= NM_MAX; w += 2) {
            ctx.lineTo(wToX(w), dToY(gauss(w, peak, cc.sigma)));
          }
          ctx.lineTo(wToX(NM_MAX), dToY(0));
          const fillGrad = ctx.createLinearGradient(0, dToY(1), 0, dToY(0));
          fillGrad.addColorStop(0, cc.c[0]);
          fillGrad.addColorStop(1, cc.c[1]);
          ctx.fillStyle = cc.c[1];
          ctx.fill();
          // stroke
          ctx.beginPath();
          for (let w = NM_MIN; w <= NM_MAX; w += 1) {
            const x = wToX(w), y = dToY(gauss(w, peak, cc.sigma));
            if (w === NM_MIN) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = cc.c[0];
          ctx.lineWidth = 1.6;
          ctx.stroke();
        });
        // label
        const peakX = wToX(isPan ? 550 : stock.G);
        ctx.fillStyle = stock.color;
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(stock.name, peakX - 28, dToY(1.03));
      });
    };

    resize();
  }

  // legend pills
  document.querySelectorAll('.lg-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const k = pill.dataset.stock;
      active[k] = !active[k];
      pill.classList.toggle('is-on', active[k]);
      if (window.drawCurves) window.drawCurves(+slider.value);
    });
  });

  update(+slider.value);
}

