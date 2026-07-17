import { escapeHtml } from './entities.mjs';

const classes = [
  ['Lord Knight', 'lord-knight.gif', 'Two-handed STR bruiser', 'Bowling Bash, Spiral Pierce'],
  ['Paladin', 'paladin.gif', 'VIT shield tank', 'Shield Chain, Grand Cross, Pressure'],
  ['High Priest', 'priest.gif', 'INT support and holy nuker', 'Magnus Exorcismus, Holy Light'],
  ['High Wizard', 'high-wizard.gif', 'INT glass cannon', 'Meteor Storm, Napalm Vulcan, Jupitel Thunder'],
  ['Whitesmith', 'whitesmith.gif', 'STR cart-smith', 'Cart Termination, Cart Revolution'],
  ['Creator', 'creator.gif', 'INT/DEX bomber', 'Acid Demonstration, Acid Terror'],
  ['Sniper', 'sniper.gif', 'DEX archer', 'Sharp Shooting, Falcon Assault'],
  ['Assassin Cross', 'assassin-cross.gif', 'AGI/Flee burst assassin', 'Sonic Blow, Soul Breaker'],
  ['Champion', 'champion.gif', 'STR/DEX fist fighter', 'Asura Strike, Finger Offensive, Palm Strike'],
  ['Professor', 'professor.gif', 'INT caster-support hybrid', 'Soul Burn, Soul Strike, Fire Ball'],
  ['Stalker', 'stalker.gif', 'Adaptive AGI rogue', 'Back Stab, Sightless Mind'],
  ['Clown', 'clown-gypsy.gif', 'DEX bard-archer hybrid', 'Arrow Vulcan, Musical Strike'],
  ['Gypsy', 'dancer-gypsy.gif', 'DEX dancer-archer hybrid', 'Arrow Vulcan, Slinging Arrow'],
  ['Soul Linker', 'soul-linker.gif', 'INT support and utility', 'Esma, Estin, Estun'],
];

export function renderClasses() {
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `<header class="wiki-masthead editorial-masthead"><div class="container"><p class="eyebrow">Fourteen class families</p><h1>Find the fantasy that fits you</h1><p>Each class keeps its classic identity while gaining several supported routes through RuneZero’s rebalanced skills, essences, and fun-mod gear.</p></div></header><div class="container class-guide-grid">${classes.map(([name, sprite, role, skills]) => `<article><div class="class-guide-sprite"><img src="assets/classes/${sprite}" alt="" loading="lazy"></div><div><p class="eyebrow">${escapeHtml(role)}</p><h2>${escapeHtml(name)}</h2><p><strong>Signature paths:</strong> ${escapeHtml(skills)}</p><p><a href="#builds">Explore ${escapeHtml(name)} builds →</a></p></div></article>`).join('')}</div>`;
  return page;
}
