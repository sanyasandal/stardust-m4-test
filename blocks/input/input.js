import { readBlockConfig } from '../../scripts/aem.js';

const TYPES = ['password', 'amount', 'simple'];
const STATES = ['hovered', 'focus-typing', 'active', 'disabled', 'read-only',
  'non-editable-vertical', 'non-editable-horizontal'];
let uid = 0;

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

function maskIcon(name, className = 'field-icon') {
  const icon = el('span', `${className} field-icon-${name}`);
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

/** link cell from the original DOM (readBlockConfig flattens links to href) */
function findLink(block) {
  const row = [...block.children].find((r) => r.children[0]?.textContent.trim().toLowerCase() === 'link');
  return row?.querySelector('a[href]') || null;
}

function buildEye(input, disabled) {
  const eye = el('button', 'field-eye');
  eye.type = 'button';
  eye.disabled = disabled;
  eye.setAttribute('aria-label', 'Show password');
  eye.setAttribute('aria-pressed', 'false');
  eye.append(maskIcon('eye'));
  eye.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(show));
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    eye.replaceChildren(maskIcon(show ? 'eye-slash' : 'eye'));
  });
  return eye;
}

function buildControl(type, state, cfg, id) {
  const value = String(cfg.value ?? '').trim();
  const placeholder = String(cfg.placeholder ?? '').trim();
  const disabled = state === 'disabled';
  let control;

  if (type === 'select') {
    control = el('select');
    const first = el('option', '', placeholder || 'Select');
    first.value = '';
    first.disabled = true;
    control.append(first);
    const options = String(cfg.options ?? '').split(/\n|,/).map((o) => o.trim()).filter(Boolean);
    if (value && !options.includes(value)) options.unshift(value);
    options.forEach((o) => control.append(el('option', '', o)));
    control.value = value;
    if (!value) first.selected = true;
  } else {
    control = el('input');
    control.type = type === 'password' ? 'password' : 'text';
    if (type === 'amount') control.inputMode = 'decimal';
    if (type === 'password') control.autocomplete = 'current-password';
    // the kit draws a filled password as literal asterisks: keep them as the visible mask
    if (type === 'password' && /^\*+$/.test(value)) control.placeholder = value;
    else {
      control.value = value;
      control.placeholder = placeholder;
    }
  }
  control.id = id;
  control.name = String(cfg.name || id);
  if (cfg.required) control.required = true;
  if (disabled) control.disabled = true;
  if (state === 'read-only') control.setAttribute('readonly', '');
  return control;
}

/**
 * Kit "Input Field" (12160:3287). Rows are key/value pairs: label, required, tooltip, link,
 * placeholder, value, unit, icon, options, help. Classes: type (password | amount | simple;
 * default = select with chevron) and state (hovered, focus-typing, active, disabled, read-only,
 * non-editable-vertical, non-editable-horizontal).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cfg = readBlockConfig(block);
  const link = findLink(block);
  const kind = TYPES.find((t) => block.classList.contains(t));
  const type = kind || 'select';
  const state = STATES.find((s) => block.classList.contains(s)) || 'default';
  const nonEditable = state.startsWith('non-editable');
  uid += 1;
  const id = `input-${uid}`;

  const field = el('div', `field field-${type}`);
  const top = el('div', 'field-top');
  const label = el(nonEditable ? 'span' : 'label', 'label', String(cfg.label || '').trim());
  if (!nonEditable) label.htmlFor = id;
  if (cfg.required && !nonEditable) {
    const star = el('span', 'required', '*');
    star.setAttribute('aria-hidden', 'true');
    label.append(star);
  }
  top.append(label);
  if (cfg.tooltip) {
    const tip = maskIcon('question-circle', 'field-tooltip');
    tip.removeAttribute('aria-hidden');
    tip.setAttribute('role', 'img');
    tip.setAttribute('aria-label', String(cfg.tooltip));
    tip.title = String(cfg.tooltip);
    top.append(tip);
  }
  if (link) {
    link.className = 'field-link';
    link.removeAttribute('title');
  }
  field.append(top);

  const control = el('div', 'field-control');
  if (nonEditable) {
    const value = el('p', 'field-value', String(cfg.value ?? '').trim());
    if (state === 'non-editable-horizontal') {
      control.append(value);
      if (link) control.append(link);
    } else {
      control.append(value);
      if (link) top.append(link);
    }
    field.append(control);
  } else {
    if (link) top.append(link);
    if (cfg.icon) {
      control.classList.add('has-icon');
      control.append(maskIcon(String(cfg.icon).trim().toLowerCase()));
    }
    const input = buildControl(type, state, cfg, id);
    control.append(input);
    if (state === 'focus-typing') {
      const mirror = el('span', 'field-mirror', input.value || input.placeholder);
      mirror.setAttribute('aria-hidden', 'true');
      control.append(mirror);
    }
    if (type === 'select') control.append(maskIcon('chevron-down'));
    if (type === 'password') control.append(buildEye(input, state === 'disabled'));
    if (cfg.unit) control.append(el('span', 'field-unit', String(cfg.unit).trim()));
    field.append(control);
    if (cfg.help) {
      const help = el('p', 'field-help', String(cfg.help).trim());
      help.id = `${id}-help`;
      input.setAttribute('aria-describedby', help.id);
      field.append(help);
    }
  }

  if (state !== 'default') field.classList.add(state);
  block.replaceChildren(field);
}
