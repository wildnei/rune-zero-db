import { loadWikiData } from './core/data.mjs';
import { parseRoute } from './core/routes.mjs';
import { createNavigation, syncNavigation } from './ui/navigation.mjs';
import { renderHome } from './render/home.mjs';

const app = document.querySelector('#app');
const status = document.querySelector('[data-site-status]');
let wikiData = null;

function announce(message) {
  if (!status) return;
  status.textContent = message;
  status.classList.add('is-visible');
  window.clearTimeout(announce.timer);
  announce.timer = window.setTimeout(() => status.classList.remove('is-visible'), 2400);
}

function renderLoading() {
  app.innerHTML = `<section class="loading-screen" aria-labelledby="loading-title">
    <div class="loading-orbit" aria-hidden="true"></div>
    <h1 id="loading-title">Opening the archives</h1>
    <p>Gathering the latest RuneZero knowledge…</p>
  </section>`;
}

function renderError(error) {
  app.innerHTML = `<section class="error-screen" aria-labelledby="error-title">
    <p class="eyebrow">The archives are resting</p>
    <h1 id="error-title">We couldn’t load the wiki.</h1>
    <p>Your connection may have paused for a moment. Try again and we’ll reopen the records.</p>
    <p><button class="button" type="button" data-retry>Try again</button></p>
  </section>`;
  app.querySelector('[data-retry]')?.addEventListener('click', bootstrap);
  announce(error.message);
}

function renderTemporaryRoute(route) {
  const count = route.view === 'items' ? wikiData.meta.items : route.view === 'mobs' ? wikiData.meta.mobs : null;
  const title = route.view === 'home' ? 'RuneZero' : route.view.replace(/\b\w/g, value => value.toUpperCase());
  app.innerHTML = `<section class="route-screen" aria-labelledby="route-title">
    <p class="eyebrow">RuneZero player wiki</p>
    <h1 id="route-title">${title}</h1>
    <p>${count ? `${Number(count).toLocaleString()} records are ready.` : 'This guide is being moved into its new, roomier home.'}</p>
    ${route.view === 'home' ? '<p><a class="button" href="#systems">Discover RuneZero</a> <a class="button button-secondary" href="#items">Explore the wiki</a></p>' : '<p><a class="button button-secondary" href="#home">Back to discovery</a></p>'}
  </section>`;
}

function renderRoute() {
  if (!wikiData) return;
  const route = parseRoute(window.location.hash);
  syncNavigation(route.view);
  if (route.view === 'home') app.replaceChildren(renderHome({ data: wikiData }));
  else renderTemporaryRoute(route);
  document.title = route.view === 'home' ? 'RuneZero — A classic adventure, thoughtfully reimagined' : `${route.view[0].toUpperCase()}${route.view.slice(1)} — RuneZero Wiki`;
  app.focus({ preventScroll: true });
}

async function bootstrap() {
  renderLoading();
  try {
    const result = await loadWikiData();
    wikiData = result.values;
    renderRoute();
    if (result.warnings.length) announce(`${result.warnings.length} optional archive sections are unavailable.`);
  } catch (error) {
    renderError(error);
  }
}

createNavigation();
window.addEventListener('hashchange', renderRoute);
bootstrap();
