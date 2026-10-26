/*
 * Tab nav — kit "Tab Nav" (12914:22783 desktop / 12914:23170 tablet / 12914:23208 mobile).
 * Content model: one row per item.
 *   cell 1: label (a link makes the item a plain link)
 *   cell 2 (optional): submenu — a list of links, shown in a dropdown under the item (chevron)
 * The item whose link matches the current page is active; on mobile the bar collapses to a
 * single disclosure button showing the active item.
 */

let instance = 0;

function chevron() {
  const span = document.createElement('span');
  span.className = 'tab-nav-chevron';
  span.setAttribute('aria-hidden', 'true');
  return span;
}

export default function decorate(block) {
  instance += 1;
  const uid = `tab-nav-${instance}`;
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', block.dataset.label || 'Section navigation');
  const list = document.createElement('ul');
  list.className = 'tab-nav-list';
  list.id = `${uid}-list`;

  const closeAll = (except) => {
    list.querySelectorAll('.tab-nav-link[aria-expanded="true"]').forEach((b) => {
      if (b !== except) b.setAttribute('aria-expanded', 'false');
    });
  };

  let activeLabel = '';
  [...block.children].forEach((row, i) => {
    const [labelCell, subCell] = row.children;
    const label = labelCell?.textContent.trim();
    if (!label) return;
    const li = document.createElement('li');
    li.className = 'tab-nav-item';
    const link = labelCell.querySelector('a');
    const subLinks = subCell ? [...subCell.querySelectorAll('a')] : [];
    let control;
    if (subLinks.length) {
      control = document.createElement('button');
      control.type = 'button';
      control.setAttribute('aria-expanded', 'false');
      const sub = document.createElement('ul');
      sub.className = 'tab-nav-submenu';
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
    control.classList.add('tab-nav-link');
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
  toggle.className = 'tab-nav-toggle';
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
