/*
 * Modal — kit "Modal" (12467:15529).
 * Authoring: one cell with a heading, body text, button links (bold = primary,
 * italic = secondary, plain link = tertiary) and an optional image (slot / image).
 * Variants: text-only (default), slot-component, image; horizontal / vertical.
 */
const icon = (name, cls) => {
  const span = document.createElement('span');
  span.className = cls;
  span.innerHTML = `<img src="${window.hlx?.codeBasePath || ''}/icons/${name}.svg" alt="" width="20" height="20">`;
  return span;
};

export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const media = block.querySelector('picture') || block.querySelector('img');
  const actions = [];
  const texts = [];
  block.querySelectorAll(':scope > div > div > *').forEach((el) => {
    if (el === heading || (media && el.contains(media)) || el === media) return;
    const only = el.children.length === 1 ? el.firstElementChild : null;
    if (el.classList.contains('button-wrapper')) {
      actions.push(el.querySelector('a'));
    } else if (el.tagName === 'P' && only?.tagName === 'A'
      && el.textContent.trim() === only.textContent.trim()) {
      only.className = 'button link';
      actions.push(only);
    } else if (el.textContent.trim()) {
      texts.push(el);
    }
  });

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'modal-close';
  close.setAttribute('aria-label', 'Close');
  close.append(icon('close', 'modal-close-icon'));
  close.addEventListener('click', () => block.closest('.section')?.classList.add('modal-closed'));

  const head = document.createElement('div');
  head.className = 'modal-head';
  if (heading) {
    heading.classList.add('modal-title');
    heading.id = heading.id || 'modal-title';
    block.setAttribute('aria-labelledby', heading.id);
    head.append(heading);
  }
  head.append(close);

  const buttons = document.createElement('div');
  buttons.className = 'modal-buttons';
  buttons.append(...actions);

  const footer = document.createElement('div');
  footer.className = 'modal-actions';
  footer.append(buttons);
  if (block.classList.contains('slot-component')) {
    const arrows = document.createElement('div');
    arrows.className = 'modal-arrows';
    arrows.append(icon('arrow-left', 'modal-arrow'), icon('arrow-right', 'modal-arrow'));
    footer.prepend(arrows);
  }

  let mediaEl = null;
  if (media) {
    mediaEl = document.createElement('div');
    mediaEl.className = 'modal-media';
    mediaEl.append(media);
  }

  const text = document.createElement('div');
  text.className = 'modal-text';

  block.setAttribute('role', 'dialog');
  block.setAttribute('aria-modal', 'true');
  block.replaceChildren();

  if (block.classList.contains('image') && mediaEl) {
    const body = document.createElement('div');
    body.className = 'modal-body';
    if (block.classList.contains('vertical')) {
      text.append(...texts);
      body.append(mediaEl, text, footer);
      block.append(head, body);
    } else {
      text.append(head, ...texts);
      body.append(text, footer);
      block.append(mediaEl, body);
    }
    return;
  }
  text.append(head, ...texts);
  block.append(text);
  if (mediaEl) block.append(mediaEl);
  block.append(footer);
}
