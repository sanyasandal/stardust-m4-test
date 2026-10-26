/*
 * Tabs — kit "Tabs Group" (12305:8986 / 8987 default, 12305:9043 / 9052 compact;
 * sizes large | medium).
 * Content model: one row per tab — cell 1: tab label, cell 2 (optional): panel content.
 * Variant "compact" shows only the selected tab plus a menu button listing every tab.
 */

let instance = 0;

function chevron() {
  const span = document.createElement('span');
  span.className = 'tabs-nav-chevron';
  span.setAttribute('aria-hidden', 'true');
  return span;
}

/*
 * Nav variant — kit "Tab Nav" (12914:22783 desktop / 12914:23170 tablet / 12914:23208 mobile).
 * Authored as `Tabs (nav)`.
 * Content model: one row per item.
 *   cell 1: label (a link makes the item a plain link)
 *   cell 2 (optional): submenu — a list of links, shown in a dropdown under the item (chevron)
 * The item whose link matches the current page is active; on mobile the bar collapses to a
 * single disclosure button showing the active item.
 */
function decorateNav(block) {
  instance += 1;
  const uid = `tabs-nav-${instance}`;
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', block.dataset.label || 'Section navigation');
  const list = document.createElement('ul');
  list.className = 'tabs-nav-list';
  list.id = `${uid}-list`;

  const closeAll = (except) => {
    list.querySelectorAll('.tabs-nav-link[aria-expanded="true"]').forEach((b) => {
      if (b !== except) b.setAttribute('aria-expanded', 'false');
    });
  };

  let activeLabel = '';
  [...block.children].forEach((row, i) => {
    const [labelCell, subCell] = row.children;
    const label = labelCell?.textContent.trim();
    if (!label) return;
    const li = document.createElement('li');
    li.className = 'tabs-nav-item';
    const link = labelCell.querySelector('a');
    const subLinks = subCell ? [...subCell.querySelectorAll('a')] : [];
    let control;
    if (subLinks.length) {
      control = document.createElement('button');
      control.type = 'button';
      control.setAttribute('aria-expanded', 'false');
      const sub = document.createElement('ul');
      sub.className = 'tabs-nav-submenu';
      sub.id = `${uid}-sub-${i}`;
      control.setAttribute('aria-controls', sub.id);
      subLinks.forEach((a) => {
        const item = document.createElement('li');
        item.append(a);
        sub.append(item);
      });
      control.addEventListener('click', () => {
        const open = control.getAttribute('aria-expanded') !== 'true';
        closeAll(control);
        control.setAttribute('aria-expanded', String(open));
        sub.style.setProperty('--left', `${li.offsetLeft - list.scrollLeft}px`);
      });
      li.append(control, sub);
    } else {
      control = document.createElement('a');
      control.href = link?.getAttribute('href') || '#';
      li.append(control);
    }
    control.classList.add('tabs-nav-link');
    const text = document.createElement('span');
    text.textContent = label;
    control.append(text);
    if (subLinks.length) control.append(chevron());
    const here = [link, ...subLinks]
      .some((a) => a && new URL(a.href, window.location).pathname === window.location.pathname);
    if (here || (!activeLabel && i === 0)) {
      list.querySelector('[aria-current]')?.removeAttribute('aria-current');
      li.setAttribute('aria-current', 'true');
      activeLabel = label;
    }
    list.append(li);
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'tabs-nav-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', list.id);
  const toggleText = document.createElement('span');
  toggleText.textContent = activeLabel;
  toggle.append(toggleText, chevron());
  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
  });

  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = nav.querySelector('[aria-expanded="true"]');
    if (open) {
      closeAll();
      toggle.setAttribute('aria-expanded', 'false');
      open.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      closeAll();
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  nav.append(toggle, list);
  block.replaceChildren(nav);
}

export default function decorate(block) {
  if (block.classList.contains('nav')) {
    decorateNav(block);
    return;
  }
  instance += 1;
  const uid = `tabs-${instance}`;
  const list = document.createElement('div');
  list.className = 'tabs-list';
  list.setAttribute('role', 'tablist');
  const panels = [];
  const tabs = [];

  [...block.children].forEach((row, i) => {
    const [labelCell, panelCell] = row.children;
    const label = labelCell?.textContent.trim();
    if (!label) return;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-tab';
    tab.id = `${uid}-tab-${i}`;
    tab.setAttribute('role', 'tab');
    tab.textContent = label;
    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `${uid}-panel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    if (panelCell) panel.append(...panelCell.childNodes);
    tab.setAttribute('aria-controls', panel.id);
    tabs.push(tab);
    panels.push(panel);
    list.append(tab);
  });

  const menu = document.createElement('ul');
  menu.className = 'tabs-menu';
  menu.id = `${uid}-menu`;
  menu.setAttribute('role', 'menu');
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'tabs-more';
  more.setAttribute('aria-label', 'All tabs');
  more.setAttribute('aria-haspopup', 'menu');
  more.setAttribute('aria-expanded', 'false');
  more.setAttribute('aria-controls', menu.id);

  const select = (index, focus) => {
    tabs.forEach((t, i) => {
      const on = i === index;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const keys = {
        ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1,
      };
      if (!(e.key in keys)) return;
      e.preventDefault();
      select((keys[e.key] + tabs.length) % tabs.length, true);
    });
    const item = document.createElement('li');
    item.setAttribute('role', 'none');
    const option = document.createElement('button');
    option.type = 'button';
    option.setAttribute('role', 'menuitem');
    option.textContent = tab.textContent;
    option.addEventListener('click', () => {
      select(i, true);
      more.setAttribute('aria-expanded', 'false');
    });
    item.append(option);
    menu.append(item);
  });

  more.addEventListener('click', () => {
    const open = more.getAttribute('aria-expanded') !== 'true';
    more.setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector('button')?.focus();
  });
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('button')];
    const at = items.indexOf(document.activeElement);
    if (e.key === 'Escape') {
      more.setAttribute('aria-expanded', 'false');
      more.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    }
  });

  const bar = document.createElement('div');
  bar.className = 'tabs-bar';
  bar.append(list);
  if (block.classList.contains('compact')) bar.append(more, menu);
  block.replaceChildren(bar, ...panels.filter((p) => p.childNodes.length));
  if (tabs.length) select(0);
}
