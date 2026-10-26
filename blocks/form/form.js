/*
 * Form — the Block Collection `form`: one block, one row per field.
 *
 *   Label | value | type | state
 *
 * - Label  the field label; a trailing * marks it required; :question-circle: adds a tooltip icon;
 *          a link sits at the right of the label ("Forgot your password?").
 * - value  the placeholder, with optional :icons: before / after it (a trailing :eye: or
 *          :eye-slash: on a password adds the show-password button); a list holds the options
 *          of a select / multi-select / radio group. checkbox: helper text; toggle: description;
 *          range: `42 of 0-100`, two thumbs `20-80 of 0-100`, or just `0-100`.
 * - type   text | email | tel | password | number | amount (unit) | select | multi-select |
 *          checkbox | radio | toggle | range | divider. Without a type it is inferred
 *          (asterisks → password, "email" / "phone" labels, a list → select). Rows without a
 *          value may skip that cell: `Remember me | checkbox`, `Or | divider`.
 * - state  optional, comma separated: filled (the value cell is the value), hover, focus,
 *          read-only, disabled, non-editable (+ horizontal), checked, open (list shown),
 *          left (switch before the text), hide-label, thumb + pressed (range swatch);
 *          then messages `help: …`, `error: …`, `tooltip: …`.
 * A row of buttons only (bold link submits, italic links are secondary) is the button line,
 * an empty row a spacer, any other single-cell row is text. Select options render as a native
 * <select> unless they carry formatting (bold = highlighted, italic = secondary text, icons,
 * links).
 * Block classes (layout only): `narrow` one centred column; `login` a sign-in card over an image
 * (picture row = background, heading row = card title, rows after the divider = alternatives,
 * a text + link row = bottom band).
 */
import {
  TYPES, el, iconName, isEmpty, uniqueId, readLabel, readValue, readState,
} from './fields/util.js';
import buildInputField from './fields/input.js';
import buildListboxField, { needsListbox } from './fields/listbox.js';
import buildChoiceField from './fields/choice.js';
import buildRangeField from './fields/range.js';

const CHOICES = ['checkbox', 'radio', 'toggle'];
let formCount = 0;

/** "amount (kg)" → { type: 'amount', unit: 'kg' } when the cell names a known type */
function parseType(cell) {
  if (!cell || cell.querySelector('ul, ol')) return null;
  const match = cell.textContent.trim().match(/^([a-z-]+)\s*(?:\((.*)\))?$/i);
  if (!match || !TYPES.includes(match[1].toLowerCase())) return null;
  return { type: match[1].toLowerCase(), unit: match[2]?.trim() || '' };
}

function inferType(label, value) {
  const trail = iconName(value.trail) || '';
  if (/^\*+$/.test(value.text) || /^eye(-slash)?$/.test(trail)) return 'password';
  if (trail === 'chevron-down' || value.options.length) return 'select';
  if (/e-?mail/i.test(label.text)) return 'email';
  if (/phone/i.test(label.text)) return 'tel';
  return 'text';
}

/** cells → the row model; the type cell is cell 3 (or cell 2 when there is no value) */
function readRow(cells, idBase) {
  const [labelCell] = cells;
  const typeAt = [2, 1].find((i) => parseType(cells[i]));
  const parsed = typeAt ? parseType(cells[typeAt]) : null;
  const valueCell = typeAt === 1 ? null : cells[1];
  const label = readLabel(labelCell);
  const value = readValue(valueCell);
  const type = parsed?.type || inferType(label, value);
  return {
    labelCell,
    valueCell,
    label,
    value,
    type,
    unit: parsed?.unit || '',
    state: readState(typeAt ? cells[typeAt + 1] : null),
    id: uniqueId(idBase, label.text || type),
  };
}

function buildField(row) {
  if (CHOICES.includes(row.type)) return buildChoiceField(row);
  if (row.type === 'range') return buildRangeField(row);
  if (row.type === 'divider') {
    const divider = el('div', 'form-divider');
    divider.setAttribute('role', 'separator');
    divider.append(el('span', '', row.label.text));
    return divider;
  }
  if (row.type === 'multi-select' || (row.type === 'select' && needsListbox(row.type, row.value, row.state.states))) {
    return buildListboxField(row);
  }
  return buildInputField(row);
}

function buildButtons(cell, form) {
  const line = el('div', 'form-buttons');
  let submit = null;
  cell.querySelectorAll('.button-wrapper').forEach((p) => {
    const a = p.querySelector('a.button');
    if (a && !submit && a.classList.contains('primary')) {
      submit = el('button', a.className, a.textContent.trim());
      submit.type = 'submit';
      const href = a.getAttribute('href');
      if (href && href !== '#') form.action = a.href;
      a.replaceWith(submit);
    }
    line.append(p);
  });
  return line;
}

/** wraps a leading "* " or trailing " *" of a text paragraph in a magenta required marker */
function markRequired(p) {
  const { firstChild: first, lastChild: last } = p;
  if (last?.nodeType === Node.TEXT_NODE && /\s\*\s*$/.test(last.textContent)) {
    last.textContent = last.textContent.replace(/\s\*\s*$/, '');
    p.append(el('span', 'required', '*'));
  }
  if (first?.nodeType === Node.TEXT_NODE && /^\s*\*\s/.test(first.textContent)) {
    first.textContent = first.textContent.replace(/^\s*\*\s/, '');
    p.prepend(el('span', 'required', '*'));
  }
}

/** a single-cell row → { kind, node }: spacer, buttons, media, heading, link or note */
function readSingle(cell, form) {
  if (isEmpty(cell)) {
    const spacer = el('div', 'form-spacer');
    spacer.setAttribute('aria-hidden', 'true');
    return { kind: 'spacer', node: spacer };
  }
  if ([...cell.children].every((c) => c.matches('.button-wrapper'))) {
    return { kind: 'buttons', node: buildButtons(cell, form) };
  }
  const note = el('div', 'form-note');
  let kind = 'note';
  if (!cell.textContent.trim() && cell.querySelector('picture, img')) kind = 'media';
  else if (cell.querySelector('h1, h2, h3, h4, h5, h6')) kind = 'heading';
  else {
    cell.querySelectorAll(':scope > p').forEach(markRequired);
    const links = cell.querySelectorAll('a');
    if (links.length === 1 && cell.textContent.trim() === links[0].textContent.trim()) kind = 'link';
  }
  note.append(...cell.childNodes);
  return { kind, node: note };
}

function readItems(block, form, idBase) {
  return [...block.children].map((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return readSingle(cells[0], form);
    const model = readRow(cells, idBase);
    return { kind: CHOICES.includes(model.type) ? model.type : 'field', node: buildField(model) };
  });
}

/**
 * consecutive checkbox / radio / toggle rows share a group; text rows touching a run of
 * toggles (a heading above, a note below) join it
 */
function group(items) {
  const out = [];
  let current = null;
  let toggles = false;
  items.forEach((item, i) => {
    const nextToggle = items[i + 1]?.kind === 'toggle';
    const note = item.kind === 'note';
    if (!CHOICES.includes(item.kind) && !(note && (nextToggle || toggles))) {
      current = null;
      toggles = false;
      out.push(item.node);
      return;
    }
    if (!current) {
      current = el('div', 'form-checks');
      out.push(current);
    }
    if (item.kind === 'toggle') toggles = true;
    current.append(item.node);
    if (note && toggles && !nextToggle) {
      current = null;
      toggles = false;
    }
  });
  return out;
}

function layoutLogin(block, form, items) {
  const media = el('div', 'login-media');
  const head = el('div', 'login-head');
  const fields = el('div', 'login-form');
  const alt = el('div', 'login-alt');
  const band = el('div', 'login-band');
  let divider = null;
  let target = fields;
  items.forEach(({ kind, node }) => {
    if (kind === 'media') {
      const img = node.querySelector('img');
      if (img) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      }
      media.append(node.querySelector('picture') || img);
    } else if (kind === 'heading') {
      const p = node.querySelector(':scope > p:only-child');
      head.append(...(p ? p.childNodes : node.childNodes));
    } else if (node.classList.contains('form-divider')) {
      divider = node;
      divider.classList.add('login-divider');
      target = alt;
    } else if (kind === 'link') {
      node.classList.add('login-link');
      target.append(node);
    } else if (kind === 'note') {
      const paras = [...node.querySelectorAll(':scope > p')];
      band.append(...(paras.length ? paras.flatMap((p) => [...p.childNodes]) : node.childNodes));
    } else if (CHOICES.includes(kind)) {
      const checks = el('div', 'form-checks');
      checks.append(node);
      target.append(checks);
    } else if (kind !== 'spacer') target.append(node);
  });
  // band text nodes become spans so the band can stack its parts
  [...band.childNodes].forEach((n) => {
    if (n.nodeType !== Node.TEXT_NODE) return;
    if (n.textContent.trim()) n.replaceWith(el('span', '', n.textContent.trim()));
    else n.remove();
  });

  form.classList.add('login-main');
  [head, fields].forEach((part) => { if (part.childNodes.length) form.append(part); });
  if (divider) form.append(divider);
  if (alt.childNodes.length) form.append(alt);
  const card = el('div', 'login-card');
  card.append(form);
  if (band.childNodes.length) {
    card.append(band);
    block.classList.add('has-band');
  }
  block.replaceChildren(...(media.childNodes.length ? [media] : []), card);
}

export default function decorate(block) {
  formCount += 1;
  const form = el('form');
  form.noValidate = true;
  form.addEventListener('submit', (e) => {
    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity();
      return;
    }
    if (!form.getAttribute('action')) e.preventDefault();
  });
  const items = readItems(block, form, `form-${formCount}`);

  if (block.classList.contains('login')) {
    layoutLogin(block, form, items);
    return;
  }
  const fields = el('div', 'form-fields');
  fields.append(...group(items));
  form.append(fields);
  block.replaceChildren(form);
}
