/*
 * Tabs — kit "Tabs Group" (12305:8986 / 8987 default, 12305:9043 / 9052 compact;
 * sizes large | medium).
 * Content model: one row per tab — cell 1: tab label, cell 2 (optional): panel content.
 * Variant "compact" shows only the selected tab plus a menu button listing every tab.
 */

let instance = 0;

export default function decorate(block) {
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
