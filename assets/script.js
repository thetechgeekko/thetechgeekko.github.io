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
    .bento-card, .game-card, .section-head {
      opacity: 0; transform: translateY(18px);
      transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1);
    }
    .bento-card.is-in, .game-card.is-in, .section-head.is-in {
      opacity: 1; transform: translateY(0);
    }
    body.invert { filter: invert(1) hue-rotate(180deg); }
    body.invert .grain, body.invert .cursor { filter: invert(1) hue-rotate(180deg); }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();
