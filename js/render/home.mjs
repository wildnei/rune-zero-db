const featureStories = [
  {
    view: 'balance',
    number: '01',
    title: 'More ways to become legendary',
    body: 'Underused skills have been rebuilt into real playstyles, giving every class more than one meaningful road through Midgard.',
    link: 'See every skill change',
  },
  {
    view: 'builds',
    number: '02',
    title: 'Classic gear, surprising builds',
    body: 'Familiar equipment gains carefully chosen skill amplifiers, turning overlooked loot into the beginning of an unexpected build.',
    link: 'Find rebalanced gear',
  },
  {
    view: 'instances',
    number: '03',
    title: 'Adventures worth remembering',
    body: 'Six endgame dungeons offer staged encounters, mechanics to learn, and rewards with a story behind them.',
    link: 'Enter the instances',
  },
];

const classPaths = [
  ['lord-knight.gif', 'Knight', 'Stand at the heart of the fight.'],
  ['high-wizard.gif', 'Wizard', 'Command the battlefield with magic.'],
  ['sniper.gif', 'Hunter', 'Control distance and find the perfect shot.'],
  ['champion.gif', 'Monk', 'Turn discipline into explosive power.'],
  ['creator.gif', 'Alchemist', 'Invent, support, and break the rules.'],
  ['stalker.gif', 'Rogue', 'Adapt to any challenge your own way.'],
];

const archiveLinks = [
  ['items', 'Items', 'Equipment, effects, drops, and enchant pools'],
  ['mobs', 'Monsters', 'Stats, elements, spawns, and complete loot tables'],
  ['classes', 'Classes', 'Every class path and what to keep along the way'],
  ['builds', 'Rebalanced Builds', 'Viable skill paths powered by classic equipment'],
  ['instances', 'Instances', 'Entry requirements, mechanics, and rewards'],
  ['systems', 'Server features', 'The complete RuneZero ruleset in plain language'],
];

function number(value) {
  return Number(value || 0).toLocaleString();
}

export function renderHome({ data }) {
  const meta = data.meta || {};
  const section = document.createElement('div');
  section.className = 'home-page';
  section.innerHTML = `
    <section class="home-hero" aria-labelledby="hero-title">
      <picture class="home-hero-art" aria-hidden="true">
        <source media="(max-width: 640px)" srcset="assets/brand/runezero-hero-mobile.jpg">
        <img src="assets/brand/runezero-hero.jpg" alt="" width="1672" height="941" fetchpriority="high">
      </picture>
      <div class="home-hero-shade" aria-hidden="true"></div>
      <div class="home-hero-content container">
        <div class="hero-copy">
          <img class="hero-rune" src="assets/brand/runezero-mark.svg" alt="" width="64" height="64">
          <p class="eyebrow">A low-rate world with new possibilities</p>
          <h1 id="hero-title">A classic adventure,<br><em>thoughtfully reimagined.</em></h1>
          <p class="hero-intro">RuneZero keeps the journey, rarity, and community of classic Ragnarok—then opens new paths with modern quality-of-life, meaningful build variety, and handcrafted challenges.</p>
          <div class="hero-actions">
            <a class="button button-sun" href="#promise">Discover RuneZero <span aria-hidden="true">↓</span></a>
            <a class="button button-glass" href="#items">Explore the wiki <span aria-hidden="true">→</span></a>
          </div>
          <dl class="hero-facts">
            <div><dt>${number(meta.items)}</dt><dd>Items documented</dd></div>
            <div><dt>${number(meta.mobs)}</dt><dd>Monsters catalogued</dd></div>
            <div><dt>1×</dt><dd>Card rate, always</dd></div>
          </dl>
        </div>
      </div>
      <a class="hero-scroll" href="#promise"><span>Begin your journey</span><i aria-hidden="true"></i></a>
    </section>

    <section class="promise section-space" id="promise" aria-labelledby="promise-title">
      <div class="container">
        <header class="section-heading centered">
          <p class="eyebrow">The RuneZero promise</p>
          <h2 id="promise-title">Everything you loved.<br><em>More reasons to explore.</em></h2>
          <p>Progress stays meaningful, rare moments stay rare, and convenience never replaces adventure.</p>
        </header>
        <div class="promise-grid">
          <article><span class="promise-icon" aria-hidden="true">Ⅰ</span><h3>A journey with weight</h3><p>Fixed low rates make every upgrade, card, and hard-won victory feel like part of your character’s story.</p></article>
          <article><span class="promise-icon" aria-hidden="true">Ⅱ</span><h3>Your class, your path</h3><p>Rebalanced skills and skill-rebalanced equipment create several viable fantasies for every class—not one prescribed build.</p></article>
          <article><span class="promise-icon" aria-hidden="true">Ⅲ</span><h3>Comfort without shortcuts</h3><p>Account storage, safe refines, clear loot beams, and thoughtful onboarding remove friction without inflating rewards.</p></article>
        </div>
      </div>
    </section>

    <section class="feature-stories section-space" aria-labelledby="features-title">
      <div class="container">
        <header class="section-heading split-heading"><div><p class="eyebrow">Signature experiences</p><h2 id="features-title">A familiar world that keeps surprising you.</h2></div><p>RuneZero builds outward from classic foundations. Every custom system exists to reveal more choices—not to erase the journey.</p></header>
        <div class="feature-story-list">
          ${featureStories.map((feature, index) => `<article class="feature-story">
            <div class="feature-number">${feature.number}</div>
            <div class="feature-art feature-art-${index + 1}" aria-hidden="true"><span></span></div>
            <div class="feature-copy"><h3>${feature.title}</h3><p>${feature.body}</p><a href="#${feature.view}">${feature.link} <span aria-hidden="true">→</span></a></div>
          </article>`).join('')}
        </div>
        <div class="feature-quicklinks">
          <a href="#systems"><strong>Enchant stones</strong><span>Build equipment with purpose</span></a>
          <a href="#hunting"><strong>Hunting log</strong><span>Long-term milestones and titles</span></a>
          <a href="#mobs"><strong>Rare-drop beams</strong><span>Never walk past a special find</span></a>
        </div>
      </div>
    </section>

    <section class="journey section-space" aria-labelledby="journey-title">
      <div class="container journey-layout">
        <div class="journey-intro"><p class="eyebrow">Your first adventure</p><h2 id="journey-title">From novice to a path that feels like yours.</h2><p>RuneZero’s opening hour teaches the world without rushing you through it.</p><a class="text-link" href="#classes">Plan your first class <span aria-hidden="true">→</span></a></div>
        <ol class="journey-steps">
          <li><span>01</span><div><h3>Learn the essentials</h3><p>The Training Grounds introduces movement, combat, and a practical command cheat sheet.</p></div></li>
          <li><span>02</span><div><h3>Choose your first spark</h3><p>Pick a free starter rebalanced weapon and see how familiar skills can grow in a new direction.</p></div></li>
          <li><span>03</span><div><h3>Meet your guides</h3><p>The Weapon Sage explains your gear while the Build Librarian opens the full collection of build ideas.</p></div></li>
          <li><span>04</span><div><h3>Make the world your own</h3><p>Hire a companion with <code>@allies</code>, follow the path that interests you, and let the adventure unfold.</p></div></li>
        </ol>
      </div>
    </section>

    <section class="class-paths section-space" aria-labelledby="paths-title">
      <div class="container">
        <header class="section-heading centered"><p class="eyebrow">Find your path</p><h2 id="paths-title">Who will you become?</h2><p>Fourteen class families. More viable skills. More reasons to try the fantasy you always wanted.</p></header>
        <div class="class-path-grid">
          ${classPaths.map(([sprite, name, description]) => `<a class="class-path" href="#classes"><span class="class-sprite"><img src="assets/classes/${sprite}" alt="" loading="lazy"></span><strong>${name}</strong><small>${description}</small></a>`).join('')}
        </div>
        <p class="centered-action"><a class="button button-secondary" href="#classes">Explore all classes <span aria-hidden="true">→</span></a></p>
      </div>
    </section>

    <section class="archives section-space" aria-labelledby="archives-title">
      <div class="container archive-shell">
        <div class="archive-heading"><p class="eyebrow">Explore the archives</p><h2 id="archives-title">Every answer,<br>one adventure away.</h2><p>The wiki is built directly from RuneZero’s server data, so equipment, monsters, drops, and systems stay connected.</p></div>
        <form class="archive-search" data-archive-search>
          <label for="archive-query">What are you looking for?</label>
          <div><input id="archive-query" name="q" type="search" placeholder="Search an item, monster, or ID…" autocomplete="off"><button type="submit" aria-label="Search"><span aria-hidden="true">→</span></button></div>
          <small>Try “Poring”, “Red Potion”, or an item ID</small>
        </form>
        <div class="archive-grid">
          ${archiveLinks.map(([view, title, description]) => `<a href="#${view}"><span><strong>${title}</strong><small>${description}</small></span><i aria-hidden="true">→</i></a>`).join('')}
        </div>
      </div>
    </section>

    <footer class="home-footer">
      <div class="container"><img src="assets/brand/runezero-mark.svg" alt="" width="52" height="52"><p><strong>Your story is waiting.</strong><br>Start by discovering what makes RuneZero different.</p><a class="button button-sun" href="#systems">Discover the server</a></div>
    </footer>`;

  section.querySelector('[data-archive-search]')?.addEventListener('submit', event => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q')?.trim();
    if (query) sessionStorage.setItem('runezero:search', query);
    window.location.hash = 'items';
  });

  return section;
}
