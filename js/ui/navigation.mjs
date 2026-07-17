const LINKS = [
  ['home', 'Discover'],
  ['systems', 'Features'],
  ['classes', 'Classes'],
  ['builds', 'Builds'],
  ['instances', 'Instances'],
  ['items', 'Database'],
];

function linksMarkup() {
  return LINKS.map(([view, label]) => `<a href="#${view}" data-view="${view}">${label}</a>`).join('');
}

export function createNavigation({ onNavigate = () => {} } = {}) {
  const desktop = document.querySelector('[data-primary-nav]');
  const mobile = document.querySelector('[data-mobile-nav]');
  if (desktop) desktop.innerHTML = linksMarkup();
  if (mobile) mobile.innerHTML = linksMarkup();

  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', () => {
      onNavigate(link.dataset.view);
      closeDrawer({ restoreFocus: false });
    });
  });

  document.querySelector('[data-menu-button]')?.addEventListener('click', openDrawer);
  document.querySelector('[data-drawer-close]')?.addEventListener('click', () => closeDrawer());
  document.querySelector('[data-drawer-backdrop]')?.addEventListener('click', () => closeDrawer());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDrawer();
  });
}

export function syncNavigation(view) {
  document.querySelectorAll('[data-view]').forEach(link => {
    if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

export function openDrawer() {
  const drawer = document.querySelector('[data-mobile-drawer]');
  const backdrop = document.querySelector('[data-drawer-backdrop]');
  const button = document.querySelector('[data-menu-button]');
  if (!drawer || !backdrop || !button) return;
  drawer.hidden = false;
  backdrop.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  document.body.classList.add('drawer-open');
  drawer.querySelector('a, button')?.focus();
}

export function closeDrawer({ restoreFocus = true } = {}) {
  const drawer = document.querySelector('[data-mobile-drawer]');
  const backdrop = document.querySelector('[data-drawer-backdrop]');
  const button = document.querySelector('[data-menu-button]');
  if (!drawer || drawer.hidden) return;
  drawer.hidden = true;
  backdrop.hidden = true;
  button?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('drawer-open');
  if (restoreFocus) button?.focus();
}
