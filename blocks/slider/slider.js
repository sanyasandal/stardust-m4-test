/*
 * Slider — kit "Slider" (12334:10106) and "Range Slider thumb" (12334:10071 / 12334:10072).
 * Content model:
 *   row 1: minimum | maximum | value (optional, defaults to the midpoint)
 *          | step (optional, default 1)
 *   row 2 (optional): accessible name of the control, also used as the form field name
 * Variant "range-slider-thumb" renders the thumb on its own (kit swatch);
 * add "active" for the pressed state.
 */

function num(cell, fallback) {
  const n = parseFloat(cell?.textContent.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

export default function decorate(block) {
  if (block.classList.contains('range-slider-thumb')) {
    const thumb = document.createElement('span');
    thumb.className = 'slider-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    block.replaceChildren(thumb);
    return;
  }

  const [first, second] = [...block.children];
  const cells = first ? [...first.children] : [];
  const min = num(cells[0], 0);
  const max = num(cells[1], 100);
  const value = num(cells[2], (min + max) / 2);
  const step = num(cells[3], 1);
  const name = second?.textContent.trim() || 'Value';

  const input = document.createElement('input');
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  input.name = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  input.setAttribute('aria-label', name);

  const update = () => {
    const pct = max > min ? (input.value - min) / (max - min) : 0;
    input.style.setProperty('--fill', pct);
  };
  input.addEventListener('input', update);
  update();

  const labels = document.createElement('div');
  labels.className = 'slider-labels';
  labels.setAttribute('aria-hidden', 'true');
  [cells[0]?.textContent.trim() || String(min), cells[1]?.textContent.trim() || String(max)]
    .forEach((t) => {
      const span = document.createElement('span');
      span.textContent = t;
      labels.append(span);
    });

  block.replaceChildren(input, labels);
}
