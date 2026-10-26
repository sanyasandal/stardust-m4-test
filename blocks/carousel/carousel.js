import { decorateIcons } from '../../scripts/aem.js';

/*
 * Carousel — kit "Carousel" (12473:16099).
 * Content model: one row per slide; cell 1 = image, cell 2 = heading, text and an optional
 * (bold) link that becomes the primary button. Previous / next buttons, dot buttons and the
 * left / right arrow keys switch slides.
 */
let carouselId = 0;

function arrowButton(dir, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `carousel-arrow carousel-${dir}`;
  button.setAttribute('aria-label', label);
  button.innerHTML = `<span class="icon icon-arrow-${dir === 'prev' ? 'left' : 'right'}"></span>`;
  return button;
}

export default function decorate(block) {
  carouselId += 1;
  const id = `carousel-${carouselId}`;
  const rows = [...block.children];

  const track = document.createElement('ul');
  track.className = 'carousel-slides';
  track.id = `${id}-slides`;
  track.setAttribute('aria-live', 'polite');

  const slides = rows.map((row, i) => {
    const li = document.createElement('li');
    li.className = 'carousel-slide';
    li.setAttribute('role', 'group');
    li.setAttribute('aria-roledescription', 'slide');
    li.setAttribute('aria-label', `${i + 1} of ${rows.length}`);
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture, img'));
    const contentCells = cells.filter((c) => c !== imageCell);
    if (imageCell) {
      imageCell.className = 'carousel-slide-image';
      li.append(imageCell);
    }
    const content = document.createElement('div');
    content.className = 'carousel-slide-content';
    const text = document.createElement('div');
    text.className = 'carousel-slide-text';
    contentCells.forEach((c) => text.append(...c.childNodes));
    const actions = [...text.querySelectorAll('.button-wrapper, p:has(> a.button)')];
    content.append(text);
    if (actions.length) {
      const wrap = document.createElement('div');
      wrap.className = 'carousel-slide-actions';
      wrap.append(...actions);
      content.append(wrap);
    }
    li.append(content);
    track.append(li);
    return li;
  });

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  viewport.append(track);

  const prev = arrowButton('prev', 'Previous slide');
  const next = arrowButton('next', 'Next slide');
  [prev, next].forEach((b) => b.setAttribute('aria-controls', track.id));

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  dots.setAttribute('role', 'group');
  dots.setAttribute('aria-label', 'Choose slide');
  const dotButtons = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Show slide ${i + 1}`);
    dot.setAttribute('aria-controls', track.id);
    dots.append(dot);
    return dot;
  });

  let current = 0;
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((s, i) => {
      const active = i === current;
      s.setAttribute('aria-hidden', String(!active));
      s.toggleAttribute('inert', !active);
    });
    dotButtons.forEach((d, i) => {
      if (i === current) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  };

  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  dotButtons.forEach((d, i) => d.addEventListener('click', () => show(i)));
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
  });

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  if (!block.hasAttribute('aria-label')) block.setAttribute('aria-label', 'Carousel');
  block.replaceChildren(prev, viewport, next, dots);
  if (slides.length < 2) block.classList.add('single');
  show(0);
  decorateIcons(block);
}
