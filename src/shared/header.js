(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const menu = header.querySelector('.menu'), nav = header.querySelector('.navlinks');
  function close() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', '開啟選單');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  header.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); menu.focus(); } });
})();
