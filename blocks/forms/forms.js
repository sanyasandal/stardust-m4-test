/**
 * Forms — kit ".Forms" (12682:15982 …).
 * Content model, one row per control:
 * - field: label (end with * for required) | placeholder | type
 *   (text, email, password, tel, number, select — or a list of options for a select)
 * - checkbox: label (may contain links) | checkbox
 * - submit: a single cell holding a button link
 * Other single-cell rows (headings, text) are kept as intro content.
 * @param {Element} block
 */
const TYPES = ['text', 'email', 'password', 'tel', 'number', 'select', 'checkbox'];
let formCount = 0;

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function splitRequired(text) {
  const t = text.trim();
  return t.endsWith('*') ? [t.slice(0, -1).trim(), true] : [t, false];
}

function buildLabel(text, required, id) {
  const label = document.createElement('label');
  label.htmlFor = id;
  label.append(text);
  if (required) {
    const star = document.createElement('span');
    star.className = 'required';
    star.textContent = '*';
    star.setAttribute('aria-hidden', 'true');
    label.append(star);
  }
  return label;
}

function buildField(labelCell, placeholderCell, typeCell, idBase) {
  const [labelText, required] = splitRequired(labelCell.textContent);
  const options = typeCell ? [...typeCell.querySelectorAll('li')].map((li) => li.textContent.trim()) : [];
  const typeText = typeCell?.textContent.trim().toLowerCase() || 'text';
  const type = options.length ? 'select' : typeText;
  const placeholder = placeholderCell?.textContent.trim() || '';
  const id = `${idBase}-${slug(labelText) || 'field'}`;

  const field = document.createElement('div');
  field.className = `field forms-field forms-${type}`;
  const control = document.createElement('div');
  control.className = 'forms-control';
  let input;
  if (type === 'select') {
    input = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder;
    empty.disabled = true;
    empty.selected = true;
    input.append(empty);
    (options.length ? options : []).forEach((o) => {
      const opt = document.createElement('option');
      opt.textContent = o;
      input.append(opt);
    });
  } else {
    input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    if (type === 'email') input.autocomplete = 'email';
    if (type === 'password') input.autocomplete = 'new-password';
  }
  input.id = id;
  input.name = slug(labelText);
  input.required = required;
  control.append(input);

  if (type === 'password') {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'forms-reveal';
    toggle.setAttribute('aria-label', `Show ${labelText.toLowerCase()}`);
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-controls', id);
    toggle.innerHTML = '<span class="icon icon-eye"><img src="/icons/eye.svg" alt="" width="20" height="20"></span>';
    toggle.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(show));
      toggle.setAttribute('aria-label', `${show ? 'Hide' : 'Show'} ${labelText.toLowerCase()}`);
      toggle.querySelector('img').src = `/icons/${show ? 'eye-slash' : 'eye'}.svg`;
    });
    control.append(toggle);
  }

  field.append(buildLabel(labelText, required, id), control);
  return field;
}

function buildCheckbox(labelCell, idBase, index) {
  const [, required] = splitRequired(labelCell.textContent);
  const id = `${idBase}-check-${index}`;
  const wrap = document.createElement('div');
  wrap.className = 'check forms-check';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.name = slug(labelCell.textContent) || id;
  input.required = required;
  const label = document.createElement('label');
  label.htmlFor = id;
  const source = labelCell.querySelector('p') || labelCell;
  label.append(...source.childNodes);
  wrap.append(input, label);
  return wrap;
}

export default function decorate(block) {
  formCount += 1;
  const idBase = `forms-${formCount}`;
  const form = document.createElement('form');
  form.className = 'forms-form';
  form.noValidate = true;
  const grid = document.createElement('div');
  grid.className = 'forms-grid';
  let checks = null;
  let checkIndex = 0;
  let submit = null;
  const intro = document.createElement('div');
  intro.className = 'forms-intro';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const last = cells[cells.length - 1];
    const lastText = last?.textContent.trim().toLowerCase();
    if (cells.length >= 2 && lastText === 'checkbox') {
      if (!checks) {
        checks = document.createElement('div');
        checks.className = 'forms-checks';
        grid.append(checks);
      }
      checkIndex += 1;
      checks.append(buildCheckbox(cells[0], idBase, checkIndex));
      return;
    }
    checks = null;
    if (cells.length >= 2) {
      const typeCell = cells.length >= 3 && (TYPES.includes(lastText) || last.querySelector('li')) ? last : null;
      grid.append(buildField(cells[0], cells[1], typeCell, idBase));
      return;
    }
    const link = row.querySelector('a');
    if (link && !submit && row.textContent.trim() === link.textContent.trim()) {
      submit = document.createElement('button');
      submit.type = 'submit';
      submit.className = 'button';
      submit.textContent = link.textContent.trim();
      if (link.getAttribute('href') && link.getAttribute('href') !== '#') form.action = link.href;
      return;
    }
    cells.forEach((cell) => intro.append(...cell.childNodes));
  });

  if (submit) {
    const line = document.createElement('div');
    line.className = 'forms-submit';
    line.append(submit);
    grid.append(line);
  }

  form.addEventListener('submit', (e) => {
    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity();
      return;
    }
    if (!form.getAttribute('action')) e.preventDefault();
  });

  form.append(grid);
  block.replaceChildren(...(intro.childNodes.length ? [intro] : []), form);
}
