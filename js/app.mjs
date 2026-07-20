import { loadWikiData } from './core/data.mjs';
import { parseRoute } from './core/routes.mjs';
import { createNavigation, syncNavigation } from './ui/navigation.mjs';
import { renderHome } from './render/home.mjs';
import { renderDatabase } from './render/database.mjs';
import { GUIDE_VIEWS, renderGuide } from './render/guides.mjs';
import { renderClasses } from './render/classes.mjs';
import { renderInstances } from './render/instances.mjs';
import { renderRunes } from './render/runes.mjs';
import { renderMonsterHunter } from './render/monster-hunter.mjs';
import { createGlobalSearch } from './ui/global-search.mjs';

const app = document.querySelector('#app');
const status = document.querySelector('[data-site-status]');
let wikiData = null;
const DATASET_BY_VIEW = { balance: 'skillchanges', builds: 'skills', hunting: 'hunting', enchants: 'options', skills: 'skills' };

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
  else if (route.view === 'items' || route.view === 'mobs') app.replaceChildren(renderDatabase({ view: route.view, data: wikiData, route }));
  else if (route.view === 'classes') app.replaceChildren(renderClasses());
  else if (route.view === 'instances') app.replaceChildren(renderInstances(route.entity === 'instance' ? route.id : null));
  else if (route.view === 'runes') app.replaceChildren(renderRunes());
  else if (route.view === 'monster-hunter') app.replaceChildren(renderMonsterHunter(wikiData.items || []));
  else if (GUIDE_VIEWS.has(route.view)) app.replaceChildren(renderGuide({ view: route.view, data: wikiData, route }));
  else renderTemporaryRoute(route);
  const unavailable = DATASET_BY_VIEW[route.view];
  if (unavailable && wikiData.unavailable?.has(unavailable)) {
    const warning = document.createElement('aside');
    warning.className = 'route-data-warning';
    warning.setAttribute('role', 'status');
    warning.innerHTML = `<strong>This archive section is temporarily unavailable.</strong><span>The ${unavailable} dataset could not be loaded. Refresh the page to try again.</span>`;
    app.firstElementChild?.prepend(warning);
  }
  document.title = route.view === 'home' ? 'RuneZero — A classic adventure, thoughtfully reimagined' : `${route.view[0].toUpperCase()}${route.view.slice(1)} — RuneZero Wiki`;
  if (route.entity === 'section') requestAnimationFrame(() => document.getElementById(route.id)?.scrollIntoView());
  else app.focus({ preventScroll: true });
}

async function bootstrap() {
  renderLoading();
  try {
    const result = await loadWikiData();
    wikiData = result.values;
    wikiData.unavailable = new Set(result.warnings.map(warning => warning.name));
    createGlobalSearch({ data: wikiData });
    renderRoute();
    if (result.warnings.length) announce(`${result.warnings.length} optional archive sections are unavailable.`);
  } catch (error) {
    renderError(error);
  }
}

createNavigation();
window.addEventListener('hashchange', renderRoute);
bootstrap();
