(() => {
  const key = 'moonshot.theme';
  const root = document.documentElement;
  const valid = value => value === 'light' || value === 'dark';
  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#080e15' : '#f7f5ef');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? '切換至淺色風格' : '切換至深色風格');
      button.title = dark ? '切換至淺色風格' : '切換至深色風格';
      button.querySelector('[data-theme-icon]').textContent = dark ? '☼' : '☾';
    });
  }
  let initial = 'dark';
  try { const saved = localStorage.getItem(key); if (valid(saved)) initial = saved; } catch {}
  apply(initial);
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(key, next); } catch {}
    }));
  });
  window.addEventListener('storage', event => {
    if (event.key === key) apply(valid(event.newValue) ? event.newValue : 'dark');
  });
})();
