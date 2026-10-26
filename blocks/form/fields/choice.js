/* Choice fields: checkbox, radio (single or a group from a list), toggle (switch). */
import {
  el, slug, inline, visuallyHidden, appendMessages, applyStates, readValue,
} from './util.js';

const CHECKED = ['checked', 'on', 'active'];

function choiceInput(type, id, name, states) {
  const input = el('input');
  input.type = type === 'toggle' ? 'checkbox' : type;
  input.id = id;
  input.name = name;
  input.checked = CHECKED.some((s) => states.has(s));
  input.disabled = states.has('disabled');
  if (type === 'toggle') input.setAttribute('role', 'switch');
  return input;
}

/** checkbox / single radio: input + label (rich label cell content) + optional helper text */
function buildCheck(row, type) {
  const {
    labelCell, valueCell, state, id,
  } = row;
  const { states } = state;
  const wrap = el('div', `check form-check form-${type}`);
  applyStates(wrap, state);
  const text = labelCell?.textContent.trim() || '';
  const input = choiceInput(type, id, slug(text) || id, states);
  input.required = text.endsWith('*');
  input.value = text.replace(/\s*\*$/, '') || 'on';
  const label = el('label');
  label.htmlFor = id;
  label.append(...inline(labelCell));
  wrap.append(input);
  const helper = valueCell && readValue(valueCell).text;
  if (helper) {
    const box = el('span', 'check-text');
    const help = el('span', 'check-helper', helper);
    box.append(label, help);
    wrap.append(box);
  } else wrap.append(label);
  if (states.has('hide-label')) visuallyHidden(wrap.lastElementChild);
  appendMessages(wrap, state, input, id);
  return wrap;
}

/** radio group: the label cell names the group, the list items are the options */
function buildRadioGroup(row, options) {
  const { labelCell, state, id } = row;
  const { states } = state;
  const group = el('fieldset', 'form-radio-group');
  applyStates(group, state);
  const legend = el('legend', 'form-legend');
  legend.append(...inline(labelCell));
  if (states.has('hide-label')) visuallyHidden(legend);
  group.append(legend);
  const name = slug(labelCell?.textContent) || id;
  options.forEach((li, i) => {
    const wrap = el('div', 'check form-check form-radio');
    const input = choiceInput('radio', `${id}-${i + 1}`, name, new Set());
    input.value = li.textContent.trim();
    input.checked = !!li.querySelector('strong') || (i === 0 && CHECKED.some((s) => states.has(s)));
    input.disabled = states.has('disabled');
    const label = el('label');
    label.htmlFor = input.id;
    label.append(...li.childNodes);
    wrap.append(input, label);
    group.append(wrap);
  });
  appendMessages(group, state, null, id);
  return group;
}

/** toggle: statement or bold heading (+ description) and a switch, right of the text by default */
function buildToggle(row) {
  const {
    labelCell, valueCell, state, id,
  } = row;
  const { states } = state;
  const wrap = el('label', 'form-toggle');
  applyStates(wrap, state);
  wrap.htmlFor = id;
  const input = choiceInput('toggle', id, slug(labelCell?.textContent) || id, states);
  const text = el('span', 'form-toggle-text');
  text.append(...inline(labelCell));
  const description = valueCell && readValue(valueCell).text;
  if (description) {
    const d = el('span', 'form-toggle-description', description);
    d.id = `${id}-description`;
    text.append(d);
    input.setAttribute('aria-describedby', d.id);
  }
  if (states.has('hide-label')) visuallyHidden(text);
  if (states.has('left')) wrap.append(input, text);
  else wrap.append(text, input);
  return wrap;
}

export default function buildChoiceField(row) {
  if (row.type === 'toggle') return buildToggle(row);
  const options = row.valueCell ? readValue(row.valueCell).options : [];
  if (row.type === 'radio' && options.length) return buildRadioGroup(row, options);
  return buildCheck(row, row.type);
}
