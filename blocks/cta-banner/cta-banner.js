/**
 * CTA Banner — kit "CTA Banner" (13370:1909 …).
 * Content model (rows, in order):
 * - an image row (picture)
 * - content rows: heading, text, button paragraphs (bold link = primary,
 *   italic link = secondary, plain link = tertiary text link)
 * - field rows with 2+ cells: label (end with * for required, may hold a help icon)
 *   | placeholder (may start with a leading icon) | supportive text | optional option list
 * @param {Element} block
 */
let fieldCount = 0;

function buildField(cells) {
  const [labelCell, placeholderCell, supportCell, optionsCell] = cells;
  fieldCount += 1;
  const id = `cta-banner-field-${fieldCount}`;
  const field = document.createElement('div');
  field.className = 'field';

  const label = document.createElement('label');
  label.htmlFor = id;
  const labelIcons = [...labelCell.querySelectorAll('.icon')];
  labelIcons.forEach((icon) => icon.remove());
  let labelText = labelCell.textContent.trim();
  const required = labelText.endsWith('*');
  if (required) labelText = labelText.slice(0, -1).trim();
  label.append(labelText);
  if (required) {
    const star = document.createElement('span');
    star.className = 'required';
    star.textContent = '*';
    label.append(star);
  }
  labelIcons.forEach((icon) => {
    icon.classList.add('cta-banner-help');
    icon.setAttribute('aria-hidden', 'true');
    label.append(icon);
  });

  const control = document.createElement('div');
  control.className = 'cta-banner-control';
  const leading = placeholderCell?.querySelector('.icon');
  if (leading) {
    leading.remove();
    leading.classList.add('cta-banner-leading');
    control.classList.add('has-leading');
    control.append(leading);
  }
  const placeholder = placeholderCell?.textContent.trim() || '';
  const options = optionsCell ? [...optionsCell.querySelectorAll('li')].map((li) => li.textContent.trim()) : [];
  let input;
  if (options.length) {
    input = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder;
    empty.disabled = true;
    empty.selected = true;
    input.append(empty, ...options.map((o) => {
      const opt = document.createElement('option');
      opt.textContent = o;
      return opt;
    }));
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
  }
  input.id = id;
  input.name = labelText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (required) input.required = true;
  control.prepend(input);
  field.append(label, control);

  const support = supportCell?.textContent.trim();
  if (support) {
    const help = document.createElement('p');
    help.className = 'field-help';
    help.id = `${id}-help`;
    help.textContent = support;
    input.setAttribute('aria-describedby', help.id);
    field.append(help);
  }
  return field;
}

export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'cta-banner-media';
  const content = document.createElement('div');
  content.className = 'cta-banner-content';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const picture = row.querySelector('picture');
    if (picture && !media.children.length) {
      media.append(picture);
      cells.forEach((cell) => cell.querySelector(':scope > p:empty')?.remove());
    }
    if (cells.length >= 2 && !picture) {
      content.append(buildField(cells));
      return;
    }
    cells.forEach((cell) => {
      [...cell.children].forEach((child) => {
        if (child.matches('p') && !child.textContent.trim() && !child.querySelector('img')) return;
        content.append(child);
      });
      if (!cell.children.length && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = cell.textContent.trim();
        content.append(p);
      }
    });
  });

  // group consecutive button / link paragraphs into one actions row
  let actions = null;
  [...content.children].forEach((child) => {
    const link = child.matches('p') && child.children.length === 1 && child.querySelector(':scope > a');
    const isAction = child.classList.contains('button-wrapper') || (link && child.textContent.trim() === link.textContent.trim());
    if (!isAction) {
      actions = null;
      return;
    }
    if (!child.classList.contains('button-wrapper')) {
      link.classList.add('button', 'link');
      child.classList.add('button-wrapper');
    }
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'cta-banner-actions';
      child.before(actions);
    }
    actions.append(child);
  });

  const inner = document.createElement('div');
  inner.className = 'cta-banner-inner';
  if (media.children.length) inner.append(media);
  inner.append(content);
  block.replaceChildren(inner);
}
