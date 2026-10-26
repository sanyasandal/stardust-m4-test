let uid = 0;

/**
 * Kit "Checkbox Input" (12265:6347) / "Checkbox Form" (12274:6373).
 * Each row is one option: cell 1 = label, optional cell 2 = helper text.
 * Classes: `radio` (radio group), `checked`/`active` (pre-checked),
 * `checkbox-input` (bare control, label kept for screen readers only), `with-helper`.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const type = block.classList.contains('radio') ? 'radio' : 'checkbox';
  const checked = block.classList.contains('checked') || block.classList.contains('active');
  const bare = block.classList.contains('checkbox-input');
  uid += 1;
  const name = `checkbox-radio-${uid}`;

  const rows = [...block.children];
  const options = rows.map((row, i) => {
    const cells = [...row.children];
    const labelText = cells[0]?.textContent.trim() || '';
    const helperText = cells[1]?.textContent.trim() || '';

    const label = document.createElement('label');
    label.className = 'check';
    const input = document.createElement('input');
    input.type = type;
    input.name = type === 'radio' ? name : `${name}-${i}`;
    input.value = labelText || 'on';
    if (checked && (type === 'checkbox' || i === 0)) input.checked = true;
    label.append(input);

    const text = document.createElement('span');
    text.className = 'check-text';
    const main = document.createElement('span');
    main.className = 'check-label';
    main.textContent = labelText || (type === 'radio' ? 'Option' : 'Select');
    text.append(main);
    if (helperText) {
      const helper = document.createElement('span');
      helper.className = 'check-helper';
      helper.textContent = helperText;
      text.append(helper);
      label.classList.add('has-helper');
    }
    label.append(text);
    return label;
  });

  if (type === 'radio' && options.length > 1) block.setAttribute('role', 'radiogroup');
  if (bare) block.classList.add('bare');
  block.replaceChildren(...options);
}
