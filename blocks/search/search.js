/*
 * Search bar — kit "Search bar" (12686:17308 default, 12686:17318 expanded).
 * Content model:
 *   row 1: placeholder text (a link here sets the form action, default /search)
 *          | optional prefilled query
 *   rows 2…n: suggestion terms (filtered while typing)
 *   a row holding a link: "Show more" button under the suggestions
 * Variant class "expanded" opens the suggestion list on load.
 */

let instance = 0;

function text(el) {
  return el ? el.textContent.trim() : '';
}

export default function decorate(block) {
  instance += 1;
  const uid = `search-${instance}`;
  const rows = [...block.children];
  const first = rows.shift();
  const cells = first ? [...first.children] : [];
  const actionLink = cells[0]?.querySelector('a');
  const placeholder = text(cells[0]) || 'Search';
  const value = text(cells[1]);

  const suggestions = [];
  let more = null;
  rows.forEach((row) => {
    const link = row.querySelector('a');
    if (link) more = link;
    else if (text(row)) suggestions.push(text(row));
  });

  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.method = 'get';
  form.action = actionLink?.getAttribute('href') || '/search';

  const field = document.createElement('div');
  field.className = 'search-field';
  const icon = document.createElement('span');
  icon.className = 'search-icon';
  icon.setAttribute('aria-hidden', 'true');

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = placeholder;
  input.value = value;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', placeholder.replace(/\.+$/, ''));

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'search-clear';
  clear.setAttribute('aria-label', 'Clear search');

  field.append(icon, input, clear);
  form.append(field);

  const list = document.createElement('ul');
  list.className = 'search-suggestions';
  list.id = `${uid}-list`;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Suggestions');
  const options = suggestions.map((term, i) => {
    const li = document.createElement('li');
    li.id = `${uid}-option-${i}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.textContent = term;
    list.append(li);
    return li;
  });

  if (options.length) {
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');
    form.append(list);
    if (more) {
      const footer = document.createElement('div');
      footer.className = 'search-more';
      more.className = 'button secondary small';
      footer.append(more);
      form.append(footer);
    }
  }

  let active = -1;
  const visible = () => options.filter((o) => !o.hidden);
  const setActive = (index) => {
    const shown = visible();
    options.forEach((o) => o.setAttribute('aria-selected', 'false'));
    active = shown.length && index !== null ? (index + shown.length) % shown.length : -1;
    if (active >= 0) {
      shown[active].setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', shown[active].id);
    } else input.removeAttribute('aria-activedescendant');
  };
  const open = (state) => {
    const isOpen = state && visible().length > 0;
    block.classList.toggle('open', isOpen);
    if (options.length) input.setAttribute('aria-expanded', String(isOpen));
    if (!isOpen) setActive(null);
  };
  const filter = () => {
    const q = input.value.trim().toLowerCase();
    options.forEach((o) => { o.hidden = Boolean(q) && !o.textContent.toLowerCase().includes(q); });
    open(Boolean(q));
  };
  const choose = (option) => {
    input.value = option.textContent;
    open(false);
    form.submit();
  };

  input.addEventListener('input', filter);
  input.addEventListener('keydown', (e) => {
    if (!options.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!block.classList.contains('open')) open(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive(active < 0 && step < 0 ? -1 : active + step);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(visible()[active]);
    } else if (e.key === 'Escape') {
      open(false);
    }
  });
  list.addEventListener('mousedown', (e) => e.preventDefault());
  list.addEventListener('click', (e) => {
    const option = e.target.closest('[role="option"]');
    if (option) choose(option);
  });
  form.addEventListener('focusout', (e) => {
    if (!form.contains(e.relatedTarget) && !block.classList.contains('expanded')) open(false);
  });
  clear.addEventListener('click', () => {
    input.value = '';
    filter();
    input.focus();
  });
  form.addEventListener('submit', (e) => {
    if (!input.value.trim()) e.preventDefault();
  });

  block.replaceChildren(form);
  if (block.classList.contains('expanded')) open(true);
}
