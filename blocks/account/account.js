/**
 * Account — kit ".Account summary" (12693:19254 …).
 * Content model: rows of label | value pairs. A row may hold two pairs
 * (label | value | label | value) for the left and right column; leave the
 * right pair empty when a line has only one entry. A single-cell row with a
 * button link becomes the action below the summary.
 * @param {Element} block
 */
function buildItem(labelCell, valueCell, side) {
  const item = document.createElement('div');
  item.className = `account-item account-${side}`;
  const dt = document.createElement('dt');
  dt.textContent = labelCell?.textContent.trim() || '';
  const dd = document.createElement('dd');
  dd.textContent = valueCell?.textContent.trim() || '';
  item.append(dt, dd);
  return item;
}

export default function decorate(block) {
  const list = document.createElement('dl');
  list.className = 'account-list';
  const actions = document.createElement('div');
  actions.className = 'account-actions';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const left = buildItem(cells[0], cells[1], 'left');
      const hasRight = cells.length >= 4
        && (cells[2].textContent.trim() || cells[3].textContent.trim());
      list.append(left);
      if (hasRight) list.append(buildItem(cells[2], cells[3], 'right'));
      else {
        const spacer = document.createElement('div');
        spacer.className = 'account-item account-right account-empty';
        spacer.setAttribute('aria-hidden', 'true');
        list.append(spacer);
      }
      return;
    }
    const buttons = row.querySelectorAll('.button-wrapper, a');
    if (buttons.length) actions.append(...row.querySelectorAll(':scope > div > *'));
  });

  const inner = document.createElement('div');
  inner.className = 'account-inner';
  inner.append(list);
  if (actions.children.length) inner.append(actions);
  block.replaceChildren(inner);
}
