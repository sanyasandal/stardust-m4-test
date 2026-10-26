/*
 * Links — kit "In-Page Nav" (12928:23476).
 * Content model: a list of links; links in a nested list are secondary items (shown with a "—"
 * prefix). The current item is the link to this page / hash, else a bold link, else the first.
 * Variants: `horizontal` (row, scrolls sideways when it overflows) | `vertical` (column).
 */
function collect(list, level, out) {
  [...list.children].forEach((li) => {
    const a = li.querySelector(':scope > a, :scope > strong > a, :scope > p > a, :scope > p > strong > a');
    if (a) out.push({ a, secondary: level > 0, bold: !!a.closest('strong') });
    const sub = li.querySelector(':scope > ul, :scope > ol');
    if (sub) collect(sub, level + 1, out);
  });
  return out;
}

export default function decorate(block) {
  const list = block.querySelector('ul, ol');
  const entries = list
    ? collect(list, 0, [])
    : [...block.querySelectorAll('a')].map((a) => ({ a, secondary: false, bold: !!a.closest('strong') }));

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', block.dataset.label || 'On this page');
  const ul = document.createElement('ul');
  ul.className = 'links-list';

  const here = window.location.href.split('#')[0];
  const items = entries.map(({ a, secondary, bold }) => {
    const li = document.createElement('li');
    li.className = `links-item${secondary ? ' secondary' : ''}`;
    const link = document.createElement('a');
    link.href = a.href;
    link.className = 'links-link';
    if (secondary) {
      const dash = document.createElement('span');
      dash.className = 'links-divider';
      dash.setAttribute('aria-hidden', 'true');
      dash.textContent = '—';
      link.append(dash);
    }
    const text = document.createElement('span');
    text.textContent = a.textContent.trim();
    link.append(text);
    li.append(link);
    ul.append(li);
    return { link, bold };
  });

  const setCurrent = (link) => items.forEach((i) => {
    if (i.link === link) i.link.setAttribute('aria-current', 'true');
    else i.link.removeAttribute('aria-current');
  });
  const byUrl = items.find((i) => i.link.href === window.location.href
    || (!i.link.hash && i.link.href.split('#')[0] === here));
  setCurrent((byUrl || items.find((i) => i.bold) || items[0])?.link);
  items.forEach(({ link }) => link.addEventListener('click', () => setCurrent(link)));

  nav.append(ul);
  block.replaceChildren(nav);
}
