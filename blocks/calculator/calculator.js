/**
 * Calculator — kit "Calculator" (weight-conversion 15163:14797 …,
 * dosing-calculator 15021:12810 …, risk-calculator 15170:17990 …).
 * Content model, one row per item:
 *  - text row (headings / paragraphs): intro, sub-title, or (after the button) footnote.
 *  - field row: label (trailing * = required, 2nd paragraph = supportive text)
 *    | placeholder | unit text, or a list of units (renders a unit select).
 *  - choice row: label | list of choices (bold choice = selected) → toggle buttons.
 *  - button row: a link → submit button.
 *  - rows after the button with label | value → read-only result fields.
 * Consecutive field rows form a two-column group (filled column by column).
 * Variant "weight-conversion" adds a swap control between paired fields and
 * converts values between their units.
 */
const UNIT_FACTORS = {
  kg: 1, g: 0.001, lb: 0.45359237, lbs: 0.45359237, st: 6.35029318, oz: 0.0283495231,
};
let fieldCount = 0;

const nextId = (prefix) => {
  fieldCount += 1;
  return `calculator-${prefix}-${fieldCount}`;
};

function buildLabel(cell, tag, id) {
  const paras = [...cell.querySelectorAll('p')];
  const labelText = (paras[0] || cell).textContent.trim();
  const label = document.createElement(tag);
  if (tag === 'label') label.htmlFor = id;
  else {
    label.className = 'label';
    label.id = id;
  }
  const required = labelText.endsWith('*');
  label.textContent = required ? labelText.slice(0, -1).trim() : labelText;
  if (required) {
    const star = document.createElement('span');
    star.className = 'required';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '*';
    label.append(star);
  }
  const support = paras[1]?.textContent.trim();
  return { label, required, support };
}

function buildSupport(text, id) {
  const p = document.createElement('p');
  p.className = 'calculator-support';
  p.id = id;
  p.textContent = text;
  return p;
}

function buildField(cells) {
  const id = nextId('input');
  const field = document.createElement('div');
  field.className = 'field calculator-field';
  const { label, required, support } = buildLabel(cells[0], 'label', id);
  field.append(label);
  const control = document.createElement('div');
  control.className = 'calculator-control';
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'decimal';
  input.id = id;
  input.name = id;
  input.placeholder = cells[1]?.textContent.trim() || '';
  if (required) input.required = true;
  if (support) {
    field.append(buildSupport(support, `${id}-support`));
    input.setAttribute('aria-describedby', `${id}-support`);
  }
  control.append(input);
  const unitCell = cells[2];
  const units = unitCell?.querySelector('ul, ol');
  if (units) {
    const select = document.createElement('select');
    select.setAttribute('aria-label', `${label.textContent.replace('*', '').trim()} unit`);
    select.className = 'calculator-unit-select';
    [...units.children].forEach((li) => {
      const option = document.createElement('option');
      option.textContent = li.textContent.trim();
      option.value = option.textContent;
      select.append(option);
    });
    control.append(select);
    control.classList.add('has-select');
    field.dataset.unit = select.value;
  } else if (unitCell?.textContent.trim()) {
    const unit = document.createElement('span');
    unit.className = 'calculator-unit';
    unit.textContent = unitCell.textContent.trim();
    control.append(unit);
    control.classList.add('has-unit');
    field.dataset.unit = unit.textContent;
    input.setAttribute('aria-label', `${label.textContent.replace('*', '').trim()} (${unit.textContent})`);
  }
  field.append(control);
  return field;
}

function selectChoice(group, choice) {
  group.querySelectorAll('[role="radio"]').forEach((b) => {
    const on = b === choice;
    b.setAttribute('aria-checked', on);
    b.tabIndex = on ? 0 : -1;
    b.classList.toggle('secondary', !on);
  });
}

function buildChoices(cells, list) {
  const id = nextId('choice');
  const field = document.createElement('div');
  field.className = 'field calculator-field calculator-choice';
  const { label, support } = buildLabel(cells[0], 'span', id);
  field.append(label);
  if (support) field.append(buildSupport(support, `${id}-support`));
  const group = document.createElement('div');
  group.className = 'calculator-choices';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', id);
  const items = [...list.children];
  let selected = items.findIndex((li) => li.querySelector('strong, b'));
  if (selected < 0) selected = 0;
  items.forEach((li, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button large';
    button.setAttribute('role', 'radio');
    button.textContent = li.textContent.trim();
    button.value = button.textContent;
    button.addEventListener('click', () => selectChoice(group, button));
    button.addEventListener('keydown', (e) => {
      const keys = {
        ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1,
      };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const all = [...group.children];
      const next = all[(all.indexOf(button) + keys[e.key] + all.length) % all.length];
      selectChoice(group, next);
      next.focus();
    });
    group.append(button);
    if (i === selected) button.dataset.selected = 'true';
  });
  selectChoice(group, group.children[selected]);
  field.append(group);
  return field;
}

function buildOutput(cells) {
  const id = nextId('output');
  const field = document.createElement('div');
  field.className = 'field calculator-field calculator-result';
  const { label } = buildLabel(cells[0], 'span', id);
  const output = document.createElement('output');
  output.setAttribute('aria-labelledby', id);
  output.setAttribute('aria-live', 'polite');
  output.textContent = cells[1]?.textContent.trim() || '';
  field.append(label, output);
  return field;
}

function fieldUnit(field) {
  return field.querySelector('select')?.value || field.dataset.unit || '';
}

function convert(from, to) {
  const value = parseFloat(from.querySelector('input').value.replace(',', '.'));
  const target = to.querySelector('input');
  if (Number.isNaN(value)) {
    target.value = '';
    return;
  }
  const a = UNIT_FACTORS[fieldUnit(from).toLowerCase()] ?? 1;
  const b = UNIT_FACTORS[fieldUnit(to).toLowerCase()] ?? 1;
  target.value = String(Math.round(((value * a) / b) * 100) / 100);
}

function addSwap(group) {
  const fields = [...group.querySelectorAll(':scope > .calculator-field')];
  if (fields.length !== 2) return;
  const [first, second] = fields;
  const swap = document.createElement('button');
  swap.type = 'button';
  swap.className = 'calculator-swap';
  swap.setAttribute('aria-label', 'Swap values');
  const img = document.createElement('img');
  img.src = `${window.hlx?.codeBasePath || ''}/icons/convert.svg`;
  img.alt = '';
  img.width = 20;
  img.height = 20;
  swap.append(img);
  first.after(swap);
  group.classList.add('has-swap');
  [first, second].forEach((field) => {
    const other = field === first ? second : first;
    field.querySelector('input').addEventListener('input', () => convert(field, other));
    field.querySelector('select')?.addEventListener('change', () => convert(other, field));
  });
  swap.addEventListener('click', () => {
    const a = first.querySelector('input');
    const b = second.querySelector('input');
    [a.value, b.value] = [b.value, a.value];
    const sa = first.querySelector('select');
    const sb = second.querySelector('select');
    if (sa && sb) [sa.value, sb.value] = [sb.value, sa.value];
  });
}

export default function decorate(block) {
  const form = document.createElement('form');
  form.className = 'calculator-form';
  form.noValidate = true;
  let group = null;
  let afterButton = false;

  const addToGroup = (field) => {
    if (!group) {
      group = document.createElement('div');
      group.className = 'calculator-group';
      form.append(group);
    }
    group.append(field);
  };

  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('picture'));
    const link = row.querySelector('a');
    if (cells.length === 1 && link && link.textContent.trim() === row.textContent.trim()) {
      group = null;
      afterButton = true;
      const actions = document.createElement('div');
      actions.className = 'calculator-actions';
      const button = document.createElement('button');
      button.type = 'submit';
      button.className = 'button';
      button.textContent = link.textContent.trim();
      actions.append(button);
      form.append(actions);
      return;
    }
    if (cells.length >= 2) {
      const list = cells[1].querySelector('ul, ol');
      let field;
      if (list) field = buildChoices(cells, list);
      else if (afterButton) field = buildOutput(cells);
      else field = buildField(cells);
      addToGroup(field);
      return;
    }
    group = null;
    const text = document.createElement('div');
    text.className = afterButton ? 'calculator-text calculator-note' : 'calculator-text';
    if (cells[0]) text.append(...cells[0].childNodes);
    form.append(text);
  });

  form.querySelectorAll('.calculator-group').forEach((g) => {
    const count = g.children.length;
    g.style.setProperty('--rows', Math.ceil(count / 2));
    if (block.classList.contains('weight-conversion')) addSwap(g);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = {};
    form.querySelectorAll('.calculator-field').forEach((field) => {
      const name = field.querySelector('label, .label')?.textContent.replace('*', '').trim();
      const input = field.querySelector('input');
      const choice = field.querySelector('[aria-checked="true"]');
      if (input) values[name] = input.value;
      else if (choice) values[name] = choice.value;
    });
    block.dispatchEvent(new CustomEvent('calculator:submit', { detail: { values }, bubbles: true }));
  });

  block.replaceChildren(form);
}
