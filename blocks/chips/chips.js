/*
 * Chips — kit "Chips" (12334:9624).
 * Content model: one chip per cell (or per list item / row); a linked label keeps its link.
 * Each chip gets a remove button that takes the chip out of the group.
 * Variants: size `small` (default) | `large`; colour `dark` (default) | `light` | `active`;
 * `static` hides the remove buttons.
 */
function chipSources(block) {
  const items = block.querySelectorAll('li');
  if (items.length) return [...items];
  return [...block.querySelectorAll(':scope > div > div')].filter((c) => c.textContent.trim());
}

export default function decorate(block) {
  const removable = !block.classList.contains('static');
  const list = document.createElement('ul');
  list.className = 'chips-list';

  chipSources(block).forEach((src) => {
    const text = src.textContent.trim();
    const li = document.createElement('li');
    li.className = 'chip';
    const info = document.createElement('span');
    info.className = 'chip-icon chip-info';
    info.setAttribute('aria-hidden', 'true');
    const a = src.querySelector('a');
    const label = document.createElement(a ? 'a' : 'span');
    if (a) label.href = a.href;
    label.className = 'chip-label';
    label.textContent = text;
    li.append(info, label);
    if (removable) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'chip-remove';
      remove.setAttribute('aria-label', `Remove ${text}`);
      remove.innerHTML = '<span class="chip-icon chip-close" aria-hidden="true"></span>';
      remove.addEventListener('click', () => {
        const next = li.nextElementSibling || li.previousElementSibling;
        li.remove();
        next?.querySelector('.chip-remove, a')?.focus();
      });
      li.append(remove);
    }
    list.append(li);
  });

  block.replaceChildren(list);
}
