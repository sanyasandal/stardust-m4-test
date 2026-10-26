/**
 * Branded variant — kit "Home Hero Branded" (12950:24813 …). Authored as `Hero (branded)`.
 * Content model: content cell (brand logo picture, heading, text, button) and an image cell.
 * With a single picture it is treated as the hero image; with two, the first is the logo.
 * @param {Element} block
 */
function decorateBranded(block) {
  const pictures = [...block.querySelectorAll('picture')];
  const image = pictures.length ? pictures[pictures.length - 1] : null;
  const logo = pictures.length > 1 ? pictures[0] : null;

  const content = document.createElement('div');
  content.className = 'hero-branded-content';
  const brand = document.createElement('div');
  brand.className = 'hero-branded-logo';
  const text = document.createElement('div');
  text.className = 'hero-branded-text';

  [image, logo].forEach((pic) => {
    const p = pic?.parentElement;
    if (p?.matches('p') && p.children.length === 1 && !p.textContent.trim()) p.replaceWith(pic);
  });
  if (logo) brand.append(logo);

  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    [...cell.children].forEach((child) => {
      if (child === image || child.contains(image)) return;
      if (child.matches('p') && !child.textContent.trim() && !child.querySelector('img, a')) return;
      text.append(child);
    });
  });

  if (brand.children.length) content.append(brand);
  content.append(text);

  const media = document.createElement('div');
  media.className = 'hero-branded-media';
  if (image) media.append(image);

  const inner = document.createElement('div');
  inner.className = 'hero-branded-inner';
  inner.append(content);
  if (image) inner.append(media);
  block.replaceChildren(inner);
}

export default function decorate(block) {
  if (block.classList.contains('branded')) decorateBranded(block);
}
