/*
 * Toggle — kit "Toggle switches" (12287:8485 …) and "Toggle group" (12287:8715 …).
 * Content model (all optional): row 1 = heading, row 2 (or cell 2) = description. Without text the
 * switch renders alone (variant "switches"); its accessible name then comes from
 * the heading or "Toggle".
 * Variants: true|checked|on (initially on), disabled, right (switch after the text),
 * heading-description (description line under the heading).
 */

let instance = 0;

export default function decorate(block) {
  instance += 1;
  const id = `toggle-${instance}`;
  const texts = [...block.querySelectorAll(':scope > div > div')]
    .map((c) => c.textContent.trim()).filter(Boolean);
  const [heading, description] = texts;
  const has = (...names) => names.some((n) => block.classList.contains(n));

  const label = document.createElement('label');
  label.className = 'toggle-control';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.setAttribute('role', 'switch');
  input.checked = has('true', 'checked', 'on');
  input.disabled = has('disabled');
  input.name = (heading || 'toggle').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const track = document.createElement('span');
  track.className = 'toggle-switch';
  track.setAttribute('aria-hidden', 'true');

  if (heading) {
    const text = document.createElement('span');
    text.className = 'toggle-text';
    const h = document.createElement('span');
    h.className = 'toggle-heading';
    h.textContent = heading;
    text.append(h);
    if (description) {
      const d = document.createElement('span');
      d.className = 'toggle-description';
      d.id = `${id}-description`;
      d.textContent = description;
      text.append(d);
      input.setAttribute('aria-describedby', d.id);
    }
    if (has('right')) label.append(text, input, track);
    else label.append(input, track, text);
  } else {
    input.setAttribute('aria-label', 'Toggle');
    label.append(input, track);
  }
  block.replaceChildren(label);
}
