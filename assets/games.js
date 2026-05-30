/* ===========================================================
   Arcade — three canvas mini-games, vanilla JS.
   Reflex · Snake · Film Stock Match (memory)
   =========================================================== */

(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const ls = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  const setHud = (key, val) => {
    const el = document.querySelector(`[data-stat="${key}"]`);
    if (el) el.textContent = val;
  };

  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // ============== GAME 1: REFLEX ==============
  (() => {
    const canvas = $('#game-reflex');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const overlay = document.querySelector('[data-overlay="reflex"]');
    const startBtn = document.querySelector('[data-start="reflex"]');

    let dpr, cw, ch;
    function resize() {
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const rect = canvas.getBoundingClientRect();
      cw = rect.width; ch = rect.height;
      canvas.width  = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    new ResizeObserver(resize).observe(canvas);
    resize();

    let running = false;
    let target = null;
    let score = 0;
    let missed = 0;
    let best = ls.get('reflex-best', 0);
    setHud('reflex-best', best);

    function spawn() {
      const margin = 36;
      const r = 22 + Math.random() * 14;
      const x = margin + Math.random() * (cw - margin * 2);
      const y = margin + Math.random() * (ch - margin * 2);
      const life = Math.max(700, 1400 - score * 35);
      target = { x, y, r, life, born: performance.now() };
    }

    function endGame() {
      running = false;
      target = null;
      if (score > best) { best = score; ls.set('reflex-best', best); setHud('reflex-best', best); }
      overlay.classList.remove('is-hidden');
      startBtn.textContent = `▶  Play again — ${score} hits`;
      draw(true);
    }

    function draw(idle = false) {
      ctx.clearRect(0, 0, cw, ch);
      // grid
      ctx.strokeStyle = 'rgba(255,255,255,.04)';
      ctx.lineWidth = 1;
      const step = 32;
      for (let x = 0; x < cw; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
      }
      for (let y = 0; y < ch; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
      }
      // center crosshair
      ctx.strokeStyle = 'rgba(255,255,255,.10)';
      ctx.lineWidth = 1;
      const cx = cw / 2, cy = ch / 2;
      ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy);
      ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14); ctx.stroke();

      if (idle) return;
      if (!target) return;
      const t = (performance.now() - target.born) / target.life;
      if (t > 1) { missed++; setHud('reflex-miss', missed); target = null; return; }
      const alpha = 1 - t * t * 0.8;
      const r = target.r * (1 - t * 0.35);
      // outer ring
      ctx.beginPath();
      ctx.strokeStyle = `rgba(244,233,216,${alpha})`;
      ctx.lineWidth = 2;
      ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
      ctx.stroke();
      // inner dot
      ctx.fillStyle = `rgba(255,91,58,${alpha})`;
      ctx.beginPath();
      ctx.arc(target.x, target.y, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // tick marks
      ctx.strokeStyle = `rgba(244,233,216,${alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        const ix = target.x + Math.cos(a) * (r + 4);
        const iy = target.y + Math.sin(a) * (r + 4);
        const ox = target.x + Math.cos(a) * (r + 10);
        const oy = target.y + Math.sin(a) * (r + 10);
        ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ox, oy); ctx.stroke();
      }
    }

    let raf;
    function tick() {
      draw();
      if (!target && running) spawn();
      if (missed >= 3) return endGame();
      raf = requestAnimationFrame(tick);
    }

    canvas.addEventListener('click', (e) => {
      if (!running || !target) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - target.x, dy = y - target.y;
      if (dx * dx + dy * dy <= target.r * target.r) {
        score++; setHud('reflex-score', score);
        target = null;
      }
    });

    startBtn.addEventListener('click', () => {
      score = 0; missed = 0; running = true; target = null;
      setHud('reflex-score', 0); setHud('reflex-miss', 0);
      overlay.classList.add('is-hidden');
      cancelAnimationFrame(raf);
      tick();
    });

    draw(true);
  })();

  // ============== GAME 2: SNAKE ==============
  (() => {
    const canvas = $('#game-snake');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const overlay = document.querySelector('[data-overlay="snake"]');
    const startBtn = document.querySelector('[data-start="snake"]');

    const COLS = 30, ROWS = 16;
    let dpr, cw, ch, cell;
    function resize() {
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const rect = canvas.getBoundingClientRect();
      cw = rect.width; ch = rect.height;
      canvas.width  = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = Math.min(cw / COLS, ch / ROWS);
    }
    new ResizeObserver(resize).observe(canvas);
    resize();

    let snake, dir, pending, food, growBy, alive, tickMs, lastTick, score;
    let best = ls.get('snake-best', 0);
    setHud('snake-best', best);

    function reset() {
      snake = [{x:8,y:8},{x:7,y:8},{x:6,y:8}];
      dir = {x:1, y:0};
      pending = {x:1, y:0};
      growBy = 0;
      alive = true;
      tickMs = 110;
      lastTick = 0;
      score = 0;
      placeFood();
      setHud('snake-len', snake.length);
      setHud('snake-speed', '1.0×');
    }

    function placeFood() {
      while (true) {
        const f = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
        if (!snake.some(s => s.x === f.x && s.y === f.y)) { food = f; return; }
      }
    }

    function step() {
      dir = pending;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return die();
      if (snake.some((s,i) => i && s.x === head.x && s.y === head.y)) return die();
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        growBy += 2;
        placeFood();
        score++;
        tickMs = Math.max(58, tickMs * 0.96);
        setHud('snake-speed', (110 / tickMs).toFixed(1) + '×');
      }
      if (growBy > 0) growBy--; else snake.pop();
      setHud('snake-len', snake.length);
    }

    function die() {
      alive = false;
      if (score > best) { best = score; ls.set('snake-best', best); setHud('snake-best', best); }
      overlay.classList.remove('is-hidden');
      startBtn.textContent = `▶  Play again — ${score} food`;
    }

    function draw() {
      // bg
      ctx.fillStyle = cssVar('--bg-elev-2') || '#1a1a1a';
      ctx.fillRect(0, 0, cw, ch);
      // grid dots
      const offX = (cw - cell * COLS) / 2;
      const offY = (ch - cell * ROWS) / 2;
      ctx.fillStyle = 'rgba(255,255,255,.04)';
      for (let x = 0; x < COLS; x++)
        for (let y = 0; y < ROWS; y++)
          ctx.fillRect(offX + x*cell + cell/2 - 1, offY + y*cell + cell/2 - 1, 2, 2);
      // food
      ctx.fillStyle = '#ff5b3a';
      ctx.fillRect(offX + food.x*cell + 3, offY + food.y*cell + 3, cell - 6, cell - 6);
      // snake
      snake.forEach((s, i) => {
        const head = i === 0;
        ctx.fillStyle = head ? '#f4e9d8' : `rgba(244,233,216,${0.92 - i*0.018})`;
        const inset = head ? 1 : 2.5;
        ctx.fillRect(offX + s.x*cell + inset, offY + s.y*cell + inset, cell - inset*2, cell - inset*2);
      });
    }

    function loop(now) {
      if (!lastTick) lastTick = now;
      if (now - lastTick >= tickMs) {
        if (alive) step();
        lastTick = now;
      }
      draw();
      if (alive) requestAnimationFrame(loop);
    }

    function setDir(nx, ny) {
      if (snake.length > 1 && nx === -dir.x && ny === -dir.y) return;
      pending = { x: nx, y: ny };
    }

    window.addEventListener('keydown', (e) => {
      if (!alive) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w')    { setDir(0, -1); e.preventDefault(); }
      if (k === 'arrowdown' || k === 's')  { setDir(0,  1); e.preventDefault(); }
      if (k === 'arrowleft' || k === 'a')  { setDir(-1, 0); e.preventDefault(); }
      if (k === 'arrowright' || k === 'd') { setDir(1,  0); e.preventDefault(); }
    });

    // touch swipe
    let tStart = null;
    canvas.addEventListener('touchstart', (e) => { tStart = e.touches[0]; }, { passive: true });
    canvas.addEventListener('touchend', (e) => {
      if (!tStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - tStart.clientX;
      const dy = t.clientY - tStart.clientY;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
      else setDir(0, dy > 0 ? 1 : -1);
      tStart = null;
    });

    startBtn.addEventListener('click', () => {
      reset();
      overlay.classList.add('is-hidden');
      canvas.focus();
      requestAnimationFrame(loop);
    });

    // idle preview
    reset(); alive = false; draw();
  })();

  // ============== GAME 3: FILM STOCK MEMORY ==============
  (() => {
    const root = $('#game-memory');
    if (!root) return;

    const STOCKS = [
      'Portra 400', 'Ektar 100', 'HP5+', 'Velvia 50',
      'CineStill 800T', 'Provia 100F', 'Tri-X 400', 'Gold 200'
    ];

    let flips, pairs, first, lock;
    let best = ls.get('memory-best', null);
    setHud('memory-best', best == null ? '—' : best);

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function build() {
      flips = 0; pairs = 0; first = null; lock = false;
      setHud('memory-flips', 0); setHud('memory-pairs', '0');
      const deck = shuffle([...STOCKS, ...STOCKS]);
      root.innerHTML = '';
      deck.forEach((name) => {
        const cell = document.createElement('button');
        cell.className = 'memory-cell';
        cell.dataset.name = name;
        cell.textContent = name;
        cell.setAttribute('aria-label', 'card, face down');
        cell.addEventListener('click', () => flip(cell));
        root.appendChild(cell);
      });
    }

    function flip(cell) {
      if (lock) return;
      if (cell.classList.contains('is-flipped') || cell.classList.contains('is-matched')) return;
      cell.classList.add('is-flipped');
      cell.setAttribute('aria-label', cell.dataset.name + ', face up');
      flips++; setHud('memory-flips', flips);
      if (!first) { first = cell; return; }
      if (first.dataset.name === cell.dataset.name) {
        first.classList.add('is-matched');
        cell.classList.add('is-matched');
        first = null;
        pairs++; setHud('memory-pairs', pairs);
        if (pairs === STOCKS.length) {
          if (best == null || flips < best) {
            best = flips; ls.set('memory-best', best); setHud('memory-best', best);
          }
        }
        return;
      }
      lock = true;
      const a = first, b = cell;
      setTimeout(() => {
        a.classList.remove('is-flipped'); b.classList.remove('is-flipped');
        a.setAttribute('aria-label', 'card, face down');
        b.setAttribute('aria-label', 'card, face down');
        first = null; lock = false;
      }, 750);
    }

    const resetBtn = document.querySelector('.memory-reset');
    resetBtn.addEventListener('click', build);

    build();
  })();
})();
