/*
 * Block Content — kit "Block Content" (12534:1412): the content band of the form/message pages.
 * Variants (block classes): title-text, form, toggle-group, buttons, modal, dots;
 * center | center-tablet | center-mobile align the text.
 * Cell conventions (authoring):
 *   field     <p><strong>Label</strong> * [:question-circle:] [link]</p>
 *             <p>[:icon:] placeholder [:icon:]</p>
 *   checkbox  <p>[ ] label</p>          toggle  <p>[toggle] label</p>
 *   buttons   one bold (primary) / italic (secondary) link per paragraph
 */

const BREAKPOINTS = { desktop: 'd', tablet: 't', mobile: 'm' };
const SECTION_VARS = { height: 'h', padTop: 'pt', padBottom: 'pb' };
let fieldCount = 0;

/** section-metadata height-/pad-top-/pad-bottom-<bp> → CSS custom properties used by form.css */
function applySectionVars(block) {
  const section = block.closest('.section');
  if (!section) return;
  Object.entries(SECTION_VARS).forEach(([key, v]) => {
    Object.entries(BREAKPOINTS).forEach(([bp, b]) => {
      const value = Number.parseFloat(section.dataset[`${key}${bp[0].toUpperCase()}${bp.slice(1)}`]);
      if (!Number.isNaN(value)) section.style.setProperty(`--bc-${v}-${b}`, `${value}px`);
    });
  });
}

const isButtonCell = (cell) => cell.children.length > 0
  && [...cell.children].every((el) => el.matches('.button-wrapper'));

const requiredMark = () => {
  const s = document.createElement('span');
  s.className = 'required';
  s.textContent = '*';
  return s;
};

/** wraps a leading "* " or trailing " *" of a text paragraph in a magenta required marker */
function markRequired(p) {
  const first = p.firstChild;
  const last = p.lastChild;
  if (last && last.nodeType === Node.TEXT_NODE && /\s\*\s*$/.test(last.textContent)) {
    last.textContent = last.textContent.replace(/\s\*\s*$/, '');
    p.append(requiredMark());
  }
  if (first && first.nodeType === Node.TEXT_NODE && /^\s*\*\s/.test(first.textContent)) {
    first.textContent = first.textContent.replace(/^\s*\*\s/, '');
    p.prepend(requiredMark());
  }
}

function buildCheck(p, type) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'checkbox';
  const text = document.createElement('span');
  text.append(...p.childNodes);
  if (text.firstChild) {
    text.firstChild.textContent = text.firstChild.textContent.replace(/^\s*\[(toggle| )\]\s*/, '');
  }
  if (type === 'toggle') {
    label.className = 'block-content-toggle';
    input.setAttribute('role', 'switch');
    label.append(text, input);
  } else {
    label.className = 'check';
    label.append(input, text);
  }
  p.replaceWith(label);
}

const iconOf = (el) => [...el.classList].find((c) => c.startsWith('icon-'))?.slice(5);
const toName = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function buildInput(labelText, placeholder, required, trailName) {
  let input;
  if (trailName === 'chevron-down') {
    input = document.createElement('select');
    const opt = document.createElement('option');
    opt.value = '';
    opt.disabled = true;
    opt.selected = true;
    opt.hidden = true;
    opt.textContent = placeholder;
    input.append(opt);
  } else {
    input = document.createElement('input');
    if (/^\*+$/.test(placeholder) || trailName === 'eye') input.type = 'password';
    else if (/e-?mail/i.test(labelText)) input.type = 'email';
    else if (/phone/i.test(labelText)) input.type = 'tel';
    else input.type = 'text';
    input.placeholder = placeholder;
  }
  input.required = required;
  input.name = toName(labelText);
  return input;
}

function buildField(cell) {
  const [labelP, controlP, ...rest] = cell.querySelectorAll(':scope > p');
  fieldCount += 1;
  const strong = labelP.querySelector('strong');
  const labelText = (strong || labelP).textContent.trim();
  const id = `bc-${toName(labelText)}-${fieldCount}`;
  const required = [...labelP.childNodes]
    .some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.includes('*'));

  const field = document.createElement('div');
  field.className = 'field';

  const top = document.createElement('div');
  top.className = 'block-content-label';
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  if (required) label.append(requiredMark());
  top.append(label);
  const helper = labelP.querySelector('.icon');
  if (helper) {
    helper.classList.add('block-content-helper');
    label.append(helper);
  }
  const link = labelP.querySelector('a');
  if (link) {
    link.className = 'block-content-link';
    top.append(link);
  }

  const control = document.createElement('div');
  control.className = 'block-content-control';
  const icons = controlP ? [...controlP.querySelectorAll('.icon')] : [];
  const placeholder = controlP ? controlP.textContent.trim() : '';
  const lead = icons.find((ic) => ic === controlP.firstChild);
  const trail = icons.find((ic) => ic !== lead);
  const trailName = trail && iconOf(trail);

  const input = buildInput(labelText, placeholder, required, trailName);
  input.id = id;
  if (lead) {
    lead.classList.add('block-content-lead');
    control.classList.add('has-lead');
    control.append(lead);
  }
  control.append(input);
  if (trail && trailName !== 'chevron-down') {
    trail.classList.add('block-content-trail');
    control.classList.add('has-trail');
    control.append(trail);
  }
  field.append(top, control);
  rest.forEach((p) => {
    p.className = 'field-help';
    field.append(p);
  });
  cell.replaceChildren(field);
  cell.classList.add('block-content-field');
}

function decorateCell(cell, block) {
  if (!cell.textContent.trim() && !cell.querySelector('.icon, img')) {
    cell.classList.add('block-content-empty');
    return;
  }
  if (isButtonCell(cell)) {
    cell.classList.add('block-content-buttons');
    cell.querySelectorAll('a.button.primary').forEach((a) => a.parentElement.classList.add('primary'));
    return;
  }
  const close = cell.querySelector(':scope > p:only-child > a:only-child > .icon:only-child');
  if (close) {
    const a = close.parentElement;
    a.className = 'block-content-close';
    a.setAttribute('aria-label', a.title || 'Close');
    cell.classList.add('block-content-dismiss');
    return;
  }
  const paras = [...cell.querySelectorAll(':scope > p')];
  const marker = (p) => p.textContent.trim().match(/^\[(toggle| )\]/)?.[1];
  if (paras.some(marker)) {
    const kind = paras.some((p) => marker(p) === ' ') ? 'checks' : 'toggles';
    paras.forEach((p) => {
      const m = marker(p);
      if (m) buildCheck(p, m === 'toggle' ? 'toggle' : 'check');
      else markRequired(p);
    });
    cell.classList.add(`block-content-${kind}`);
    return;
  }
  const formLike = block.classList.contains('form') || block.classList.contains('modal');
  if (formLike && paras.length >= 2 && paras[0].firstElementChild?.tagName === 'STRONG') {
    buildField(cell);
    return;
  }
  cell.classList.add('block-content-text');
  paras.forEach(markRequired);
}

export default function decorate(block) {
  applySectionVars(block);
  if (block.classList.contains('dots')) {
    const dots = document.createElement('div');
    dots.className = 'block-content-dots';
    dots.setAttribute('role', 'progressbar');
    dots.setAttribute('aria-label', 'Loading');
    dots.append(document.createElement('span'), document.createElement('span'));
    block.replaceChildren(dots);
    return;
  }
  [...block.children].forEach((row) => {
    row.classList.add('block-content-row');
    const cells = [...row.children];
    if (cells.length > 1) row.classList.add('block-content-pair');
    cells.forEach((cell) => decorateCell(cell, block));
    if (cells.length === 1 && cells[0].classList.contains('block-content-field')) {
      row.classList.add('block-content-single');
    }
  });
}
