/* Text-like fields (text, email, tel, password, number, amount) and the native select. */
import {
  el, slug, iconName, maskIcon, buildLabelRow, appendMessages, applyStates,
} from './util.js';

const FILLED = ['filled', 'focus', 'read-only', 'non-editable'];
const AUTOCOMPLETE = { email: 'email', tel: 'tel', password: 'current-password' };

function buildReveal(input, labelText, name, disabled) {
  const toggle = el('button', 'form-reveal');
  toggle.type = 'button';
  toggle.disabled = disabled;
  toggle.setAttribute('aria-label', `Show ${labelText.toLowerCase()}`);
  toggle.setAttribute('aria-pressed', 'false');
  toggle.setAttribute('aria-controls', input.id);
  let icon = maskIcon(name);
  toggle.append(icon);
  toggle.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(show));
    toggle.setAttribute('aria-label', `${show ? 'Hide' : 'Show'} ${labelText.toLowerCase()}`);
    const next = maskIcon(show === (name === 'eye') ? 'eye-slash' : 'eye');
    icon.replaceWith(next);
    icon = next;
  });
  return toggle;
}

function buildSelect(value, filled) {
  const select = el('select');
  const empty = el('option', '', filled ? '' : value.text);
  empty.value = '';
  empty.disabled = true;
  empty.hidden = true;
  select.append(empty);
  const options = value.options.map((li) => li.textContent.trim()).filter(Boolean);
  if (filled && value.text && !options.includes(value.text)) options.unshift(value.text);
  options.forEach((o) => select.append(el('option', '', o)));
  if (filled && value.text) select.value = value.text;
  else empty.selected = true;
  return select;
}

function buildInput(type, value, filled) {
  const input = el('input');
  input.type = ['email', 'tel', 'password', 'number'].includes(type) ? type : 'text';
  if (type === 'amount') input.inputMode = 'decimal';
  if (AUTOCOMPLETE[type]) input.autocomplete = AUTOCOMPLETE[type];
  // a password shown as literal asterisks stays a placeholder: the kit draws the mask as text
  if (filled && !(type === 'password' && /^\*+$/.test(value.text))) input.value = value.text;
  else input.placeholder = value.text;
  return input;
}

/**
 * @param {object} row { label, value, type, unit, state, id }
 * @returns {Element} the field
 */
export default function buildInputField({
  label, value, type, unit, state, id,
}) {
  const { states } = state;
  const nonEditable = states.has('non-editable');
  const filled = FILLED.some((s) => states.has(s));
  const disabled = states.has('disabled');

  const field = el('div', `field form-field form-${type}`);
  applyStates(field, state);
  const { top } = buildLabelRow(label, state, id, {
    tag: nonEditable ? 'span' : 'label', hide: states.has('hide-label'),
  });
  field.append(top);

  const control = el('div', 'form-control');
  if (nonEditable) {
    control.append(el('p', 'form-value', value.text));
    if (states.has('horizontal') && label.link) control.append(label.link);
    field.append(control);
    return field;
  }

  const input = type === 'select' ? buildSelect(value, filled) : buildInput(type, value, filled);
  input.id = id;
  input.name = slug(label.text) || id;
  input.required = label.required;
  input.disabled = disabled;
  if (states.has('read-only')) input.setAttribute('readonly', '');
  if (!label.text) input.setAttribute('aria-label', value.text || type);

  if (value.lead) {
    control.classList.add('has-lead');
    control.append(maskIcon(iconName(value.lead), 'form-lead'));
  }
  control.append(input);
  if (states.has('focus')) {
    const shown = type === 'select' ? input.value : input.value || input.placeholder;
    const mirror = el('span', 'form-mirror', shown);
    mirror.setAttribute('aria-hidden', 'true');
    control.append(mirror);
  }
  const trail = iconName(value.trail);
  if (type === 'select') {
    control.classList.add('has-trail');
    control.append(maskIcon('chevron-down', 'form-trail'));
  } else if (type === 'password' && /^eye(-slash)?$/.test(trail)) {
    control.classList.add('has-trail');
    control.append(buildReveal(input, label.text || 'password', trail, disabled));
  } else if (trail) {
    control.classList.add('has-trail');
    control.append(maskIcon(trail, 'form-trail'));
  }
  if (unit) {
    control.classList.add('has-unit');
    control.append(el('span', 'form-unit', unit));
  }
  field.append(control);
  appendMessages(field, state, input, id);
  return field;
}
