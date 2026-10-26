/* Shared helpers of the form block's field builders. */

export const TYPES = ['text', 'email', 'tel', 'password', 'number', 'amount', 'select', 'multi-select',
  'checkbox', 'radio', 'toggle', 'range', 'divider'];

const usedIds = new Set();

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export const slug = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const iconName = (node) => [...(node?.classList || [])].find((c) => c.startsWith('icon-'))?.slice(5);

export const isEmpty = (node) => !node || (!node.textContent.trim() && !node.querySelector('.icon, img'));

/** a unique element id from a base and a label */
export function uniqueId(base, label) {
  let id = `${base}-${slug(label) || 'field'}`;
  if (document.getElementById(id) || usedIds.has(id)) id = `${id}-${usedIds.size + 1}`;
  usedIds.add(id);
  return id;
}

/** an icon drawn in currentcolor, so field states can recolour it */
export function maskIcon(name, className = '') {
  const icon = el('span', `form-icon icon-${name}${className ? ` ${className}` : ''}`);
  icon.style.setProperty('--icon', `url('${window.hlx?.codeBasePath || ''}/icons/${name}.svg')`);
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

export function requiredMark() {
  const star = el('span', 'required', '*');
  star.setAttribute('aria-hidden', 'true');
  return star;
}

export function visuallyHidden(node) {
  node.classList.add('form-sr-only');
  return node;
}

/** the inline content of a cell (its lone paragraph unwrapped) */
export function inline(cell) {
  if (!cell) return [];
  const p = cell.querySelector(':scope > p');
  if (p && cell.children.length === 1) return [...p.childNodes];
  return [...cell.childNodes];
}

/** label cell → { text, required, link, helper } (a trailing * marks it required) */
export function readLabel(cell) {
  const link = cell?.querySelector('a') || null;
  const helper = cell?.querySelector('.icon-question-circle') || null;
  const copy = cell ? cell.cloneNode(true) : document.createElement('div');
  copy.querySelectorAll('a, .icon').forEach((n) => n.remove());
  const raw = copy.textContent.replace(/\s+/g, ' ').trim();
  const required = raw.endsWith('*');
  return {
    text: required ? raw.slice(0, -1).trim() : raw, required, link, helper,
  };
}

/**
 * value cell → { text, lead, trail, options[] }: the text before an optional list, the icons
 * before / after that text, and the list items (options of a select or radio group).
 */
export function readValue(cell) {
  const out = {
    text: '', lead: null, trail: null, options: [],
  };
  if (!cell) return out;
  const list = cell.querySelector(':scope > ul, :scope > ol');
  if (list) out.options = [...list.children];
  const source = cell.querySelector(':scope > p') || (list ? null : cell);
  if (!source) return out;
  [...source.childNodes].forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('icon')) {
      if (out.text) out.trail = node;
      else out.lead = node;
    } else {
      out.text = `${out.text}${node.textContent}`.replace(/^\s+/, '');
    }
  });
  out.text = out.text.trim();
  return out;
}

const MESSAGE = /\b(help|error|tooltip)\s*:/i;

/**
 * state cell → { states:Set, help, error, tooltip }: comma-separated keywords, then optional
 * `help: …`, `error: …`, `tooltip: …` messages (each runs to the next message or line end).
 */
export function readState(cell) {
  const out = {
    states: new Set(), help: '', error: '', tooltip: '',
  };
  if (!cell) return out;
  const lines = [...cell.querySelectorAll(':scope > p')].map((p) => p.textContent);
  (lines.length ? lines : [cell.textContent]).forEach((line) => {
    const at = line.search(MESSAGE);
    const keywords = at < 0 ? line : line.slice(0, at);
    keywords.split(',').map((k) => k.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean)
      .forEach((k) => out.states.add(k));
    if (at < 0) return;
    line.slice(at).split(/(?=\b(?:help|error|tooltip)\s*:)/i).forEach((m) => {
      const match = m.match(/^(help|error|tooltip)\s*:\s*([\s\S]*?)[\s,]*$/i);
      if (!match) return;
      const [, key, text] = match;
      out[key.toLowerCase()] = text;
    });
  });
  if (out.error) out.states.add('error');
  return out;
}

/** the label row: label (+ required mark, tooltip icon) and an optional link */
export function buildLabelRow(label, state, id, { tag = 'label', hide = false } = {}) {
  const top = el('div', 'form-label');
  const labelEl = el(tag, tag === 'label' ? '' : 'label');
  if (tag === 'label' && id) labelEl.htmlFor = id;
  else if (id) labelEl.id = `${id}-label`;
  labelEl.append(label.text);
  if (label.required) labelEl.append(requiredMark());
  if (label.helper || state.tooltip) {
    const tip = maskIcon('question-circle', 'form-helper');
    const text = state.tooltip || 'More information';
    tip.removeAttribute('aria-hidden');
    tip.setAttribute('role', 'img');
    tip.setAttribute('aria-label', text);
    tip.title = text;
    labelEl.append(tip);
  }
  top.append(labelEl);
  if (label.link) {
    label.link.className = 'form-link';
    label.link.removeAttribute('title');
    top.append(label.link);
  }
  if (hide) visuallyHidden(top);
  return { top, labelEl };
}

/** the supportive / error text under a field, wired to the control with aria-describedby */
export function appendMessages(field, state, control, id) {
  const ids = [];
  ['error', 'help'].forEach((key) => {
    if (!state[key]) return;
    const p = el('p', `field-help form-${key}`, state[key]);
    p.id = `${id}-${key}`;
    ids.push(p.id);
    field.append(p);
  });
  if (control && ids.length) control.setAttribute('aria-describedby', ids.join(' '));
  if (control && state.states.has('error')) control.setAttribute('aria-invalid', 'true');
}

/** the state keywords become classes of the field */
export function applyStates(field, state) {
  state.states.forEach((s) => field.classList.add(s));
}
