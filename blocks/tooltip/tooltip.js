/*
 * Tooltip — kit "Tooltip" (12334:9957 top, 9958 bottom, 9960 left, 9959 right).
 * Content model: one row.
 *   cell 1: trigger (text, link or icon, e.g. :question-circle:) | cell 2: tooltip text
 *   A single cell holds only the tooltip text: the bubble is shown on its own
 *   (kit swatch / inline note).
 * Variants top | bottom | left | right: side of the bubble the arrow is on (top = bubble above the
 * trigger, arrow pointing down; left = arrow on the left, bubble right of the trigger; etc.).
 */

let instance = 0;

export default function decorate(block) {
  instance += 1;
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const tipCell = cells.length > 1 ? cells[1] : cells[0];
  const triggerCell = cells.length > 1 ? cells[0] : null;
  if (!['top', 'bottom', 'left', 'right'].some((c) => block.classList.contains(c))) {
    block.classList.add('top');
  }

  const bubble = document.createElement('span');
  bubble.className = 'tooltip-bubble';
  bubble.id = `tooltip-${instance}`;
  bubble.setAttribute('role', 'tooltip');
  const text = document.createElement('span');
  text.className = 'tooltip-text';
  text.textContent = tipCell?.textContent.trim() || '';
  const arrow = document.createElement('span');
  arrow.className = 'tooltip-arrow';
  bubble.append(text, arrow);

  if (!triggerCell) {
    block.classList.add('static');
    block.replaceChildren(bubble);
    return;
  }

  const wrap = document.createElement('span');
  wrap.className = 'tooltip-anchor';
  let trigger = triggerCell.querySelector('a, button');
  if (!trigger) {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tooltip-trigger';
    trigger.append(...triggerCell.childNodes);
    if (!trigger.textContent.trim()) trigger.setAttribute('aria-label', 'More information');
  }
  trigger.setAttribute('aria-describedby', bubble.id);
  wrap.append(trigger, bubble);

  const show = () => wrap.classList.add('visible');
  const hide = () => wrap.classList.remove('visible');
  wrap.addEventListener('mouseenter', show);
  wrap.addEventListener('mouseleave', hide);
  trigger.addEventListener('focus', show);
  trigger.addEventListener('blur', hide);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });
  block.replaceChildren(wrap);
}
