import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * Footer — kit "Footer" (12406:12187). Fragment sections: brand (logo link + description) /
 * links (one list per column) / bottom (social icon links list + code text).
 */

const SOCIAL_NAMES = {
  linkedin: 'LinkedIn', facebook: 'Facebook', youtube: 'YouTube', instagram: 'Instagram', x: 'X',
};

function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  children.flat().filter(Boolean).forEach((c) => node.append(c));
  return node;
}

function buildBrand(section) {
  const brand = el('div', 'footer-brand');
  if (!section) return brand;
  const img = section.querySelector('img');
  const link = section.querySelector('a[href]');
  if (img) {
    img.removeAttribute('width');
    img.removeAttribute('height');
    if (!img.alt) img.alt = 'AstraZeneca';
    const a = document.createElement('a');
    a.className = 'footer-logo';
    a.href = link?.getAttribute('href') || '/';
    a.setAttribute('aria-label', `${img.alt} home`);
    a.append(img);
    brand.append(a);
  }
  section.querySelectorAll('p').forEach((p) => {
    if (!p.querySelector('img') && p.textContent.trim()) brand.append(el('p', 'footer-description', p.textContent.trim()));
  });
  return brand;
}

function buildLinks(section) {
  const links = el('div', 'footer-links');
  section?.querySelectorAll('ul').forEach((ul) => {
    const list = el('ul', 'footer-column');
    [...ul.children].forEach((li) => {
      const a = li.querySelector('a[href]');
      const link = document.createElement('a');
      link.href = a?.getAttribute('href') || '#';
      link.textContent = li.textContent.trim();
      list.append(el('li', '', link));
    });
    links.append(list);
  });
  return links;
}

function buildBottom(section) {
  const bottom = el('div', 'footer-bottom');
  if (!section) return bottom;
  const social = el('ul', 'footer-social');
  social.setAttribute('aria-label', 'Social media');
  section.querySelectorAll('.icon').forEach((iconEl) => {
    const name = [...iconEl.classList].find((c) => c.startsWith('icon-'))?.slice(5);
    if (!name) return;
    const a = iconEl.closest('a');
    const link = document.createElement('a');
    link.href = a?.getAttribute('href') || '#';
    link.setAttribute('aria-label', SOCIAL_NAMES[name] || name);
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.querySelector('img')?.setAttribute('loading', 'lazy');
    link.append(iconEl);
    social.append(el('li', '', link));
  });
  if (social.children.length) bottom.append(social);
  const code = [...section.querySelectorAll('p')].find((p) => p.textContent.trim() && !p.querySelector('.icon'));
  if (code) bottom.append(el('p', 'footer-code', code.textContent.trim()));
  return bottom;
}

export default async function decorate(block) {
  const inSiteFooter = !!block.closest('body > footer');
  const authored = block.querySelector('a[href]')?.getAttribute('href') || block.textContent.trim();
  const footerMeta = getMetadata('footer');
  const footerPath = new URL((!inSiteFooter && authored) || footerMeta || '/footer', window.location).pathname;
  const fragment = await loadFragment(footerPath);
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const main = el('div', 'footer-main', buildBrand(sections[0]), buildLinks(sections[1]));
  block.append(el('div', 'footer-inner', main, buildBottom(sections[2])));
}
