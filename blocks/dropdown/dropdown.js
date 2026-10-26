import { decorateIcons } from '../../scripts/aem.js';

/*
 * Dropdown — kit "Dropdown" (12277:7180).
 * Content model: row 1 = label | placeholder; every further row = option | optional secondary
 * text (e.g. a count). A linked option navigates; a bold option is the initially highlighted one.
 * Variants: `icon` (leading icon — an authored :icon: or the user icon), `secondary-text`,
 * `with-arrow` (trailing chevron), `form` (multi-select with checkboxes),
 * `expanded` (menu open and in the page flow).
 */
let dropdownId = 0;

export default function decorate(block) {
  dropdownId += 1;
  const id = `dropdown-${dropdownId}`;
  const multi = block.classList.contains('form');
  const inline = block.classList.contains('expanded');
  const [head, ...optionRows] = [...block.children];
  const [labelCell, placeholderCell] = head ? [...head.children] : [];
  const placeholder = placeholderCell?.textContent.trim() || 'Select';

  const label = document.createElement('span');
  label.className = 'dropdown-label';
  label.id = `${id}-label`;
  label.textContent = labelCell?.textContent.trim() || '';

  const field = document.createElement('button');
  field.type = 'button';
  field.className = 'dropdown-field';
  field.id = `${id}-field`;
  field.setAttribute('aria-haspopup', 'listbox');
  field.setAttribute('aria-controls', `${id}-menu`);
  field.setAttribute('aria-labelledby', `${label.id} ${field.id}`);
  const value = document.createElement('span');
  value.className = 'dropdown-value placeholder';
  value.textContent = placeholder;
  const chevron = document.createElement('span');
  chevron.className = 'dropdown-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  field.append(value, chevron);

  const menu = document.createElement('ul');
  menu.className = 'dropdown-menu';
  menu.id = `${id}-menu`;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-labelledby', label.id);
  menu.tabIndex = -1;
  if (multi) menu.setAttribute('aria-multiselectable', 'true');

  let highlighted = -1;
  const options = optionRows.map((row, i) => {
    const [textCell, secondaryCell] = [...row.children];
    const li = document.createElement('li');
    li.className = 'dropdown-option';
    li.id = `${id}-option-${i}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    const link = textCell?.querySelector('a');
    if (link) li.dataset.href = link.href;
    if (textCell?.querySelector('strong') && highlighted < 0) highlighted = i;

    const start = document.createElement('span');
    start.className = 'dropdown-option-main';
    if (multi) {
      const box = document.createElement('span');
      box.className = 'dropdown-check';
      box.setAttribute('aria-hidden', 'true');
      start.append(box);
    }
    const authoredIcon = textCell?.querySelector('.icon');
    if (authoredIcon) start.append(authoredIcon);
    else if (block.classList.contains('icon')) {
      const icon = document.createElement('span');
      icon.className = 'icon icon-user';
      start.append(icon);
    }
    const text = document.createElement('span');
    text.className = 'dropdown-option-text';
    text.textContent = textCell?.textContent.trim() || '';
    start.append(text);
    li.append(start);

    const secondary = secondaryCell?.textContent.trim();
    if (secondary) {
      const sec = document.createElement('span');
      sec.className = 'dropdown-option-secondary';
      sec.textContent = secondary;
      li.append(sec);
    }
    if (block.classList.contains('with-arrow')) {
      const arrow = document.createElement('span');
      arrow.className = 'icon icon-chevron-right';
      li.append(arrow);
    }
    menu.append(li);
    return li;
  });

  const highlight = (index) => {
    options.forEach((o, i) => o.classList.toggle('highlighted', i === index));
    highlighted = index;
    if (index >= 0) {
      menu.setAttribute('aria-activedescendant', options[index].id);
      options[index].scrollIntoView?.({ block: 'nearest' });
    } else menu.removeAttribute('aria-activedescendant');
  };

  const isOpen = () => block.classList.contains('open') || inline;
  const setOpen = (open) => {
    if (inline) return;
    block.classList.toggle('open', open);
    field.setAttribute('aria-expanded', String(open));
    if (open) menu.focus();
  };

  const updateValue = () => {
    const chosen = options.filter((o) => o.getAttribute('aria-selected') === 'true');
    value.textContent = chosen.length
      ? chosen.map((o) => o.querySelector('.dropdown-option-text').textContent).join(', ')
      : placeholder;
    value.classList.toggle('placeholder', !chosen.length);
  };

  const choose = (index) => {
    const option = options[index];
    if (!option) return;
    if (option.dataset.href) {
      window.location.href = option.dataset.href;
      return;
    }
    if (multi) {
      const selected = option.getAttribute('aria-selected') === 'true';
      option.setAttribute('aria-selected', String(!selected));
    } else {
      options.forEach((o) => o.setAttribute('aria-selected', String(o === option)));
      setOpen(false);
      if (!inline) field.focus();
    }
    block.dispatchEvent(new CustomEvent('change', { bubbles: true }));
    updateValue();
  };

  field.addEventListener('click', () => setOpen(!isOpen()));
  field.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      if (inline) menu.focus();
      if (highlighted < 0) highlight(e.key === 'ArrowUp' ? options.length - 1 : 0);
    }
  });
  options.forEach((o, i) => {
    o.addEventListener('click', () => { highlight(i); choose(i); });
    o.addEventListener('mousemove', () => highlight(i));
  });
  menu.addEventListener('keydown', (e) => {
    const last = options.length - 1;
    const moves = {
      ArrowDown: Math.min(highlighted + 1, last),
      ArrowUp: Math.max(highlighted - 1, 0),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      highlight(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(highlighted);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') field.focus();
      setOpen(false);
    }
  });
  document.addEventListener('click', (e) => {
    if (!block.contains(e.target)) setOpen(false);
  });

  if (!inline) field.setAttribute('aria-expanded', 'false');
  else field.setAttribute('aria-expanded', 'true');
  block.replaceChildren(label, field, menu);
  if (highlighted >= 0) highlight(highlighted);
  decorateIcons(block);
}
