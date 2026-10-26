/**
 * Teaser — kit "Teaser" (hero sizes, text-image, card).
 * Content model: one row with an image cell and a content cell (or the image and
 * content in separate rows). Content: optional tag paragraph before the heading,
 * heading, body paragraphs, button paragraphs.
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const media = document.createElement('div');
  media.className = 'teaser-media';
  const content = document.createElement('div');
  content.className = 'teaser-content';

  cells.forEach((cell) => {
    const picture = cell.querySelector('picture');
    if (picture && !media.querySelector('picture')) {
      media.append(picture);
      picture.closest('p')?.remove();
    }
    [...cell.children].forEach((child) => {
      if (child.matches('p') && !child.textContent.trim() && !child.querySelector('img, a')) return;
      content.append(child);
    });
    if (!cell.children.length && cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      content.append(p);
    }
  });

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    let prev = heading.previousElementSibling;
    while (prev) {
      if (prev.matches('p') && !prev.classList.contains('button-wrapper')) prev.classList.add('teaser-tag');
      prev = prev.previousElementSibling;
    }
  }

  const text = document.createElement('div');
  text.className = 'teaser-text';
  const actions = document.createElement('div');
  actions.className = 'teaser-actions';
  [...content.children].forEach((child) => {
    if (child.classList.contains('button-wrapper')) actions.append(child);
    else text.append(child);
  });
  content.replaceChildren(text);
  if (actions.children.length) content.append(actions);

  const inner = document.createElement('div');
  inner.className = block.matches('.text-image, .card') ? 'teaser-inner' : 'teaser-inner teaser-hero';
  inner.append(...(media.children.length ? [media] : []), content);
  block.replaceChildren(inner);
}
