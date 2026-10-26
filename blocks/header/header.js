import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * Header — kit "Header" (12387:11135): Type=Full (utility bar + main bar) or
 * Type=Registration (logo only). The nav fragment is authored as sections:
 * brand (logo link) / utility (links list, languages list) / sections (nav items) / tools
 * (search icon link, login button). A section-metadata `style` of brand|utility|sections|tools
 * overrides the order-based assignment.
 */

const ROLES = ['brand', 'utility', 'sections', 'tools'];
const isDesktop = window.matchMedia('(width >= 1200px)');

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  });
  children.flat().filter((c) => c !== null && c !== undefined).forEach((c) => node.append(c));
  return node;
}

function icon(name) {
  return el('span', { class: `icon icon-${name}`, 'aria-hidden': 'true' }, el('img', {
    src: `${window.hlx?.codeBasePath || ''}/icons/${name}.svg`, alt: '', width: 20, height: 20,
  }));
}

function assignRoles(sections) {
  const roles = {};
  const order = sections.length === 3 ? ['brand', 'sections', 'tools'] : ROLES;
  sections.forEach((section, i) => {
    const named = ROLES.find((r) => section.classList.contains(r));
    const role = named || order[i];
    if (role && !roles[role]) roles[role] = section;
  });
  return roles;
}

function buildBrand(section) {
  const link = section?.querySelector('a[href]');
  const img = section?.querySelector('img');
  const a = el('a', { class: 'nav-brand', href: link?.getAttribute('href') || '/' });
  if (img) {
    img.removeAttribute('width');
    img.removeAttribute('height');
    img.loading = 'eager';
    if (!img.alt) img.alt = 'AstraZeneca';
    a.append(img);
  } else {
    a.textContent = section?.textContent.trim() || 'AstraZeneca';
  }
  a.setAttribute('aria-label', `${img?.alt || a.textContent.trim()} home`);
  return a;
}

function buildUtilityLists(section) {
  if (!section) return [];
  return [...section.querySelectorAll('ul')].map((ul, i) => {
    const list = el('ul', { class: i === 0 ? 'nav-links' : 'nav-languages' });
    if (i > 0) list.setAttribute('aria-label', 'Language');
    [...ul.children].forEach((li) => {
      const a = li.querySelector('a[href]');
      const active = !!li.querySelector('strong, b');
      const link = el('a', { href: a?.getAttribute('href') || '#' }, (a || li).textContent.trim());
      if (i > 0) link.setAttribute('hreflang', link.textContent.toLowerCase());
      if (active) {
        link.setAttribute('aria-current', 'true');
        link.classList.add('active');
      }
      list.append(el('li', {}, link));
    });
    return list;
  });
}

function readNavItems(section) {
  const ul = section?.querySelector('ul');
  if (!ul) return [];
  return [...ul.children].map((li) => {
    const sub = li.querySelector(':scope > ul');
    const a = [...li.querySelectorAll(':scope > a, :scope > p > a, :scope > strong > a')][0];
    let label = a?.textContent.trim();
    if (!label) {
      label = [...li.childNodes].filter((n) => n.nodeName !== 'UL')
        .map((n) => n.textContent).join('').trim();
    }
    const children = sub ? [...sub.querySelectorAll(':scope > li')].map((c) => {
      const ca = c.querySelector('a[href]');
      return { label: c.textContent.trim(), href: ca?.getAttribute('href') || '#' };
    }) : [];
    return {
      label, href: a?.getAttribute('href'), children, sub: !!sub || !a,
    };
  });
}

function closeDropdowns(nav, except) {
  nav.querySelectorAll('.nav-item-toggle[aria-expanded="true"]').forEach((btn) => {
    if (btn !== except) btn.setAttribute('aria-expanded', 'false');
  });
}

function buildNavList(items, prefix) {
  const ul = el('ul', { class: 'nav-items' });
  items.forEach((item, i) => {
    const li = el('li', { class: 'nav-item' });
    if (item.children.length) {
      const panelId = `${prefix}-panel-${i}`;
      const btn = el('button', {
        type: 'button', class: 'nav-item-label nav-item-toggle', 'aria-expanded': 'false', 'aria-controls': panelId,
      }, el('span', {}, item.label), icon('chevron-down'));
      const panel = el('ul', { class: 'nav-item-panel', id: panelId }, item.children.map((c) => el('li', {}, el('a', { href: c.href }, c.label))));
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        closeDropdowns(btn.closest('nav'), btn);
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
      li.append(btn, panel);
    } else if (item.sub) {
      li.append(el('span', { class: 'nav-item-label' }, el('span', {}, item.label), icon('chevron-down')));
    } else {
      li.append(el('a', { class: 'nav-item-label', href: item.href || '#' }, item.label));
    }
    ul.append(li);
  });
  return ul;
}

function buildTools(section) {
  const tools = { search: null, login: null };
  if (!section) return tools;
  section.querySelectorAll('a[href]').forEach((a) => {
    const iconEl = a.querySelector('.icon, img');
    if (iconEl && !a.textContent.trim()) {
      const name = [...(a.querySelector('.icon')?.classList || [])].find((c) => c.startsWith('icon-'))?.slice(5) || 'search';
      tools.search = el('a', {
        class: 'nav-search', href: a.getAttribute('href') || '#', 'aria-label': name.charAt(0).toUpperCase() + name.slice(1),
      }, icon(name));
    } else if (!tools.login) {
      tools.login = el('a', { class: 'button secondary small nav-login', href: a.getAttribute('href') || '#' }, a.textContent.trim());
    }
  });
  return tools;
}

function toggleMenu(nav, force) {
  const btn = nav.querySelector('.nav-hamburger');
  if (!btn) return;
  const expanded = force !== undefined ? !force : btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  btn.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu');
  btn.querySelector('img').src = `${window.hlx?.codeBasePath || ''}/icons/${expanded ? 'bars' : 'close'}.svg`;
  nav.classList.toggle('menu-open', !expanded);
  const drawer = nav.querySelector('.nav-drawer');
  if (drawer) drawer.hidden = expanded;
  document.body.style.overflowY = !expanded && !isDesktop.matches && nav.closest('body > header') ? 'hidden' : '';
}

export default async function decorate(block) {
  const inSiteHeader = !!block.closest('body > header');
  const authored = block.querySelector('a[href]')?.getAttribute('href') || block.textContent.trim();
  const navMeta = getMetadata('nav');
  const navPath = new URL((!inSiteHeader && authored) || navMeta || '/nav', window.location).pathname;
  const fragment = await loadFragment(navPath);
  block.textContent = '';
  if (!fragment) return;

  const roles = assignRoles([...fragment.querySelectorAll(':scope > .section')]);
  const navItems = readNavItems(roles.sections);
  const utility = buildUtilityLists(roles.utility);
  const tools = buildTools(roles.tools);
  const full = !!(navItems.length || utility.length || tools.search || tools.login);
  if (!block.classList.contains('full') && !block.classList.contains('registration')) {
    block.classList.add(full ? 'full' : 'registration');
  }
  const prefix = inSiteHeader ? 'nav' : `nav-${Math.random().toString(36).slice(2, 8)}`;

  const nav = el('nav', { class: 'nav', 'aria-label': 'Main' });
  if (inSiteHeader) nav.id = 'nav';

  if (utility.length) {
    nav.append(el('div', { class: 'nav-utility' }, el('div', { class: 'nav-inner' }, utility)));
  }

  const bar = el('div', { class: 'nav-inner' }, buildBrand(roles.brand));
  if (navItems.length) bar.append(el('div', { class: 'nav-sections' }, buildNavList(navItems, prefix)));
  if (full) {
    const toolsEl = el('div', { class: 'nav-tools' });
    if (tools.search) toolsEl.append(tools.search);
    if (tools.login) toolsEl.append(tools.login);
    const hamburger = el('button', {
      type: 'button', class: 'nav-hamburger', 'aria-expanded': 'false', 'aria-controls': `${prefix}-drawer`, 'aria-label': 'Open menu',
    }, icon('bars'));
    hamburger.addEventListener('click', () => toggleMenu(nav));
    toolsEl.append(hamburger);
    bar.append(toolsEl);
  }
  nav.append(el('div', { class: 'nav-bar' }, bar));

  if (full) {
    const drawer = el('div', { class: 'nav-drawer', id: `${prefix}-drawer` });
    drawer.hidden = true;
    if (navItems.length) drawer.append(buildNavList(navItems, `${prefix}-m`));
    buildUtilityLists(roles.utility).forEach((list) => drawer.append(list));
    if (tools.login) drawer.append(tools.login.cloneNode(true));
    nav.append(drawer);
  }

  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = nav.querySelector('.nav-item-toggle[aria-expanded="true"]');
    if (open) {
      closeDropdowns(nav);
      open.focus();
    } else if (nav.classList.contains('menu-open')) {
      toggleMenu(nav, false);
      nav.querySelector('.nav-hamburger').focus();
    }
  });
  nav.addEventListener('focusout', (e) => {
    if (!nav.contains(e.relatedTarget)) closeDropdowns(nav);
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeDropdowns(nav);
  });
  isDesktop.addEventListener('change', () => toggleMenu(nav, false));

  block.append(nav);
  if (inSiteHeader) document.body.classList.toggle('full-header', block.classList.contains('full'));
}
