/* Listbox fields: a `select` whose options carry formatting, an open `select`, a `multi-select`. */
import {
  el, maskIcon, buildLabelRow, appendMessages, applyStates,
} from './util.js';

/** list item → option parts: lead icon, text, secondary (italic) text, trailing icon, link */
function readOption(li) {
  const icons = [...li.querySelectorAll('.icon')];
  const textNodes = [];
  const secondary = [...li.querySelectorAll('em')].map((e) => e.textContent.trim()).join(' ');
  const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement.closest('em')) textNodes.push(walker.currentNode);
  }
  const text = textNodes.map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
  const first = textNodes.find((n) => n.textContent.trim());
  const before = (icon) => !first
    || icon.compareDocumentPosition(first) === Node.DOCUMENT_POSITION_FOLLOWING;
  return {
    text,
    secondary,
    lead: icons.find(before) || null,
    trail: icons.find((i) => !before(i)) || null,
    href: li.querySelector('a')?.href || '',
    highlighted: !!li.querySelector('strong'),
  };
}

/** a select needs the custom listbox when its options carry more than plain text */
export function needsListbox(type, value, states) {
  if (type === 'multi-select' || states.has('open')) return true;
  return value.options.some((li) => li.querySelector('strong, em, a, .icon'));
}

export default function buildListboxField({
  label, value, type, state, id,
}) {
  const multi = type === 'multi-select';
  const inline = state.states.has('open');
  const disabled = state.states.has('disabled');
  const placeholder = value.text || 'Select';

  const field = el('div', `field form-field form-${type} form-listbox`);
  applyStates(field, state);
  const { top, labelEl } = buildLabelRow(label, state, id, {
    tag: 'span', hide: state.states.has('hide-label'),
  });
  field.append(top);

  const control = el('div', 'form-control');
  const button = el('button', 'form-listbox-button');
  button.type = 'button';
  button.id = id;
  button.disabled = disabled;
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-controls', `${id}-menu`);
  button.setAttribute('aria-labelledby', `${labelEl.id} ${id}`);
  button.setAttribute('aria-expanded', String(inline));
  const shown = el('span', 'form-listbox-value placeholder', placeholder);
  const chevron = maskIcon('chevron-down', 'form-listbox-chevron');
  button.append(shown, chevron);
  control.append(button);

  const menu = el('ul', 'form-menu');
  menu.id = `${id}-menu`;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-labelledby', labelEl.id);
  menu.tabIndex = -1;
  if (multi) menu.setAttribute('aria-multiselectable', 'true');

  let highlighted = -1;
  const options = value.options.map((li, i) => {
    const opt = readOption(li);
    const item = el('li', 'form-option');
    item.id = `${id}-option-${i}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    if (opt.href) item.dataset.href = opt.href;
    if (opt.highlighted && highlighted < 0) highlighted = i;
    const main = el('span', 'form-option-main');
    if (multi) {
      const box = el('span', 'form-option-check');
      box.setAttribute('aria-hidden', 'true');
      main.append(box);
    }
    if (opt.lead) main.append(opt.lead);
    main.append(el('span', 'form-option-text', opt.text));
    item.append(main);
    if (opt.secondary) item.append(el('span', 'form-option-secondary', opt.secondary));
    if (opt.trail) item.append(opt.trail);
    menu.append(item);
    return item;
  });

  const highlight = (index) => {
    options.forEach((o, i) => o.classList.toggle('highlighted', i === index));
    highlighted = index;
    if (index >= 0) {
      menu.setAttribute('aria-activedescendant', options[index].id);
      options[index].scrollIntoView?.({ block: 'nearest' });
    } else menu.removeAttribute('aria-activedescendant');
  };

  const isOpen = () => inline || field.classList.contains('is-open');
  const setOpen = (open) => {
    if (inline) return;
    field.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    if (open) menu.focus();
  };

  const updateValue = () => {
    const chosen = options.filter((o) => o.getAttribute('aria-selected') === 'true');
    shown.textContent = chosen.length
      ? chosen.map((o) => o.querySelector('.form-option-text').textContent).join(', ')
      : placeholder;
    shown.classList.toggle('placeholder', !chosen.length);
  };

  const choose = (index) => {
    const option = options[index];
    if (!option) return;
    if (option.dataset.href) {
      window.location.href = option.dataset.href;
      return;
    }
    if (multi) {
      option.setAttribute('aria-selected', String(option.getAttribute('aria-selected') !== 'true'));
    } else {
      options.forEach((o) => o.setAttribute('aria-selected', String(o === option)));
      setOpen(false);
      if (!inline) button.focus();
    }
    field.dispatchEvent(new CustomEvent('change', { bubbles: true }));
    updateValue();
  };

  button.addEventListener('click', () => setOpen(!isOpen()));
  button.addEventListener('keydown', (e) => {
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
      if (e.key === 'Escape') button.focus();
      setOpen(false);
    }
  });
  document.addEventListener('click', (e) => {
    if (!field.contains(e.target)) setOpen(false);
  });

  field.append(control, menu);
  if (highlighted >= 0) highlight(highlighted);
  appendMessages(field, state, button, id);
  return field;
}
