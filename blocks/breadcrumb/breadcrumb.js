import { decorateIcons } from '../../scripts/aem.js';

/*
 * Breadcrumb — kit "Breadcrumb" (12410:12885).
 * Content model: the trail as a list (or one row / paragraph per crumb). Links are kept; the last
 * crumb is the current page (`aria-current="page"`, magenta).
 * Variants: `label` renders a single crumb label (states `hover`, `active`).
 */
function crumbsFrom(block) {
  const items = block.querySelectorAll('li');
  if (items.length) return [...items];
  const paras = block.querySelectorAll('p');
  if (paras.length) return [...paras];
  return [...block.querySelectorAll(':scope > div > div')].filter((c) => c.textContent.trim());
}

export default function decorate(block) {
  const isLabel = block.classList.contains('label');
  const crumbs = crumbsFrom(block);
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  ol.className = 'breadcrumb-list';

  crumbs.forEach((src, i) => {
    const li = document.createElement('li');
    li.className = 'breadcrumb-item';
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'icon icon-nav-arrow-right breadcrumb-separator';
      sep.setAttribute('aria-hidden', 'true');
      li.append(sep);
    }
    const a = src.querySelector('a');
    const isCurrent = isLabel ? block.classList.contains('active') : i === crumbs.length - 1;
    let crumb;
    if (a && !(isCurrent && !isLabel)) {
      crumb = document.createElement('a');
      crumb.href = a.href;
    } else {
      crumb = document.createElement('span');
    }
    crumb.className = 'breadcrumb-label';
    crumb.textContent = src.textContent.trim();
    if (isCurrent) crumb.setAttribute('aria-current', 'page');
    li.append(crumb);
    ol.append(li);
  });

  nav.append(ol);
  block.replaceChildren(nav);
  decorateIcons(nav);
}
