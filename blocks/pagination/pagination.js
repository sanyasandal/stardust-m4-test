/*
 * Pagination — kit "Pagination" (12328:9611).
 * Content model: a list (or one cell each) of page links in order, e.g.
 * Previous · 1 · 2 · … · 12 · Next. The bold item (or the link to this page) is the current
 * page; an item without a link is disabled; "..." / "…" is an ellipsis.
 * Variants: `icon-only` (chevron-only previous / next) | `icon-text`;
 * `base` renders a single control — `page-number`, `left-icon`, `right-icon`,
 * `previous-icon-text`, `next-icon-text` — with state `hover` | `active` | `disabled`.
 */
const PREV = /^(previous|prev|‹|«|<)/i;
const NEXT = /^(next|›|»|>)/i;

function sources(block) {
  const items = block.querySelectorAll('li');
  if (items.length) return [...items];
  return [...block.querySelectorAll(':scope > div > div')].filter((c) => c.textContent.trim());
}

export default function decorate(block) {
  const cls = block.classList;
  const base = cls.contains('base');
  const iconOnly = cls.contains('icon-only') || cls.contains('left-icon') || cls.contains('right-icon');
  const here = window.location.href;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Pagination');
  const ul = document.createElement('ul');
  ul.className = 'pagination-list';

  sources(block).forEach((src) => {
    const text = src.textContent.trim();
    const a = src.querySelector('a');
    let kind = 'page';
    if (/^(\.\.\.|…)$/.test(text)) kind = 'ellipsis';
    else if (PREV.test(text) || (base && cls.contains('left-icon')) || cls.contains('previous-icon-text')) kind = 'prev';
    else if (NEXT.test(text) || (base && cls.contains('right-icon')) || cls.contains('next-icon-text')) kind = 'next';

    const current = kind === 'page' && (base ? cls.contains('active') : (!!src.querySelector('strong') || a?.href === here));
    const disabled = kind !== 'ellipsis' && (base ? cls.contains('disabled') : !a && !current);

    const li = document.createElement('li');
    let el;
    if (kind === 'ellipsis') {
      el = document.createElement('span');
      el.setAttribute('aria-hidden', 'true');
    } else if (disabled || current || !a) {
      el = document.createElement('span');
      if (disabled) el.setAttribute('aria-disabled', 'true');
    } else {
      el = document.createElement('a');
      el.href = a.href;
    }
    el.className = `pagination-item ${kind}`;
    if (current) el.setAttribute('aria-current', 'page');
    if (base && cls.contains('active') && kind !== 'page') el.classList.add('active');
    if (base && cls.contains('hover')) el.classList.add('hover');

    const label = document.createElement('span');
    label.className = 'pagination-label';
    label.textContent = text;
    if (kind === 'page' && !base) el.setAttribute('aria-label', `Page ${text}`);
    if (kind === 'prev' || kind === 'next') {
      const icon = document.createElement('span');
      icon.className = `pagination-icon ${kind === 'prev' ? 'chevron-left' : 'chevron-right'}`;
      icon.setAttribute('aria-hidden', 'true');
      if (iconOnly) label.classList.add('visually-hidden');
      if (kind === 'prev') el.append(icon, label);
      else el.append(label, icon);
    } else el.append(label);

    li.append(el);
    ul.append(li);
  });

  nav.append(ul);
  block.replaceChildren(nav);
}
