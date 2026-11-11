// A quiet, opt-in easter egg. Nothing animates until the visitor opens it.
(() => {
  const trigger = document.getElementById('signal-trigger');
  const panel = document.getElementById('star-mission');
  const canvas = document.getElementById('mission-canvas');
  if (!trigger || !panel || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) { trigger.hidden = true; return; }
  const status = document.getElementById('mission-status');
  const replay = document.getElementById('mission-replay');
  let frame = 0, last = 0, running = false, score = 0, elapsed = 0;
  let x = 160, stars = [], nextStar = 0, wave = 0;
  const keys = new Set();
  const lanes = [160, 80, 240, 120, 200];
  const clamp = value => Math.max(14, Math.min(306, value));
  function pixelStar(cx, cy, color, size = 3) {
    ctx.fillStyle = color;
    ctx.fillRect(cx - size, cy - size * 2, size * 2, size * 4);
    ctx.fillRect(cx - size * 2, cy - size, size * 4, size * 2);
  }
  function draw() {
    ctx.fillStyle = '#080e15'; ctx.fillRect(0, 0, 320, 180);
    for (let i = 0; i < 27; i++) {
      ctx.fillStyle = i % 3 ? '#42645e' : '#a8f6d3';
      ctx.fillRect((i * 71 + 17) % 320, (i * 43 + 11) % 180, 1, 1);
    }
    ctx.strokeStyle = '#1c3435'; ctx.beginPath(); ctx.moveTo(0, 168); ctx.lineTo(320, 168); ctx.stroke();
    stars.forEach(star => pixelStar(star.x, star.y, '#ffb66e'));
    ctx.fillStyle = '#b7efd3';
    ctx.fillRect(x - 4, 139, 8, 20); ctx.fillRect(x - 2, 135, 4, 5);
    ctx.fillRect(x - 8, 152, 4, 9); ctx.fillRect(x + 4, 152, 4, 9);
    ctx.fillStyle = '#28514a'; ctx.fillRect(x - 2, 144, 4, 5);
    ctx.fillStyle = '#ff8a56'; ctx.fillRect(x - 2, 160, 4, 5 + Math.floor(elapsed * 8) % 3);
    if (!running && score === 5) {
      ctx.fillStyle = '#080e15dd'; ctx.fillRect(34, 49, 252, 60);
      pixelStar(61, 78, '#ffb66e', 4);
      ctx.fillStyle = '#b7efd3'; ctx.font = 'bold 15px monospace';
      ctx.fillText('CURIOSITY UNLOCKED', 81, 84);
    }
  }
  function tick(now) {
    if (!running) return;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now; elapsed += dt;
    if (keys.has('ArrowLeft') || keys.has('a')) x = clamp(x - dt * 180);
    if (keys.has('ArrowRight') || keys.has('d')) x = clamp(x + dt * 180);
    if (elapsed >= nextStar) {
      stars.push({ x: lanes[wave++ % lanes.length], y: -8 });
      nextStar = elapsed + 1.1;
    }
    stars.forEach(star => { star.y += dt * 45; });
    stars = stars.filter(star => {
      if (Math.abs(star.x - x) < 16 && star.y > 134 && star.y < 165) {
        score = Math.min(5, score + 1);
        status.textContent = score === 5 ? '探索完成！好奇心，就是你的超能力。' : `已收集 ${score} / 5 顆星星`;
        if (score === 5) { running = false; replay.hidden = false; keys.clear(); }
        return false;
      }
      return star.y < 188;
    });
    draw();
    if (running) frame = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(frame); keys.clear();
    score = 0; elapsed = 0; last = 0; x = 160; stars = []; nextStar = 0; wave = 0;
    replay.hidden = true; status.textContent = '已收集 0 / 5 顆星星'; running = true;
    draw(); frame = requestAnimationFrame(tick); canvas.focus({ preventScroll: true });
  }
  function close() {
    running = false; cancelAnimationFrame(frame); keys.clear(); panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false'); trigger.focus({ preventScroll: true });
  }
  trigger.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    panel.hidden = false; trigger.setAttribute('aria-expanded', 'true'); start();
  });
  panel.querySelector('[data-close]').addEventListener('click', close);
  replay.addEventListener('click', start);
  canvas.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) {
      event.preventDefault(); keys.add(event.key);
    }
  });
  canvas.addEventListener('keyup', event => keys.delete(event.key));
  canvas.addEventListener('blur', () => keys.clear());
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  function steer(event) {
    const bounds = canvas.getBoundingClientRect();
    x = clamp((event.clientX - bounds.left) / bounds.width * 320);
  }
  canvas.addEventListener('pointerdown', event => {
    canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId); steer(event);
  });
  canvas.addEventListener('pointermove', event => {
    if (canvas.hasPointerCapture(event.pointerId)) steer(event);
  });
  panel.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => {
    x = clamp(x + Number(button.dataset.move) * 35); if (!running) draw();
  }));
  document.addEventListener('visibilitychange', () => { keys.clear(); last = 0; });
})();
