/*
 * Table — kit "Table / Cell" (12607:*): Type icon | checkbox | radio | toggle | empty,
 * Position header | cell-light | cell-dark | highlight.
 * Content model: one block row per table row, one cell per column. The first row is the header
 * unless a body position variant (cell-light, cell-dark, highlight) is set;
 * "header" makes every row
 * a header row. Default body rows alternate light/dark.
 *   - Icons: :heart: etc. A leading icon sits before the label;
 *     :question-circle: / :sort: after it.
 *     :sort: in a header cell becomes a sort button for that column.
 *   - Variants checkbox | radio | toggle add that control to the first column; start the cell with
 *     "[x]" to have it checked ("[ ]" or nothing for unchecked).
 */

let instance = 0;
const BODY = ['cell-light', 'cell-dark', 'highlight'];
const CONTROLS = ['checkbox', 'radio', 'toggle'];

function stripMarker(cell) {
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent.trim()) node = walker.nextNode();
  if (!node) return false;
  const m = node.textContent.match(/^\s*\[( |x|X)?\]\s*/);
  if (!m) return false;
  node.textContent = node.textContent.slice(m[0].length);
  return (m[1] || '').toLowerCase() === 'x';
}

function buildCell(cellSource, opts) {
  // authors' cells usually wrap their content in a single paragraph
  const paras = [...cellSource.children].filter((c) => c.tagName === 'P');
  const source = paras.length === 1 && cellSource.children.length === 1 ? paras[0] : cellSource;
  const {
    header, control, name, rowLabel,
  } = opts;
  const cell = document.createElement(header ? 'th' : 'td');
  if (header) cell.scope = 'col';
  const checked = control ? stripMarker(source) : false;
  const inner = document.createElement('div');
  inner.className = 'table-cell';
  const label = document.createElement('div');
  label.className = 'table-label';

  if (control) {
    const input = document.createElement('input');
    input.type = control === 'radio' ? 'radio' : 'checkbox';
    input.className = `table-${control}`;
    if (control === 'toggle') input.setAttribute('role', 'switch');
    if (control === 'radio') input.name = name;
    input.checked = checked;
    input.setAttribute('aria-label', header && control === 'checkbox' ? 'Select all rows' : `Select ${rowLabel || 'row'}`);
    inner.append(input);
  }

  const nodes = [...source.childNodes];
  const firstReal = nodes.find((n) => n.nodeType !== Node.TEXT_NODE || n.textContent.trim());
  if (!control && firstReal?.classList?.contains('icon')) {
    firstReal.classList.add('table-lead');
    inner.append(firstReal);
  }
  nodes.forEach((n) => {
    if (n === firstReal && n.parentNode !== source) return;
    if (n.nodeType === Node.TEXT_NODE) {
      if (!n.textContent.trim()) return;
      const span = document.createElement('span');
      span.textContent = n.textContent.trim();
      label.append(span);
    } else label.append(n);
  });
  if (label.childNodes.length) inner.append(label);
  cell.append(inner);
  return cell;
}

function makeSortable(table, th, index) {
  const icon = th.querySelector('.icon-sort');
  if (!icon) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'table-sort';
  button.setAttribute('aria-label', `Sort by ${th.textContent.trim() || `column ${index + 1}`}`);
  icon.replaceWith(button);
  button.append(icon);
  button.addEventListener('click', () => {
    const asc = th.getAttribute('aria-sort') !== 'ascending';
    table.querySelectorAll('th[aria-sort]').forEach((h) => h.removeAttribute('aria-sort'));
    th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
    const tbody = table.tBodies[0];
    if (!tbody) return;
    const rows = [...tbody.rows];
    rows.sort((a, b) => {
      const x = a.cells[index]?.textContent.trim() || '';
      const y = b.cells[index]?.textContent.trim() || '';
      return (asc ? 1 : -1) * x.localeCompare(y, undefined, { numeric: true });
    });
    tbody.append(...rows);
  });
}

export default function decorate(block) {
  instance += 1;
  const classes = [...block.classList];
  const control = CONTROLS.find((c) => classes.includes(c));
  const allHeader = classes.includes('header');
  const noHeader = BODY.some((c) => classes.includes(c));
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const name = `table-${instance}`;

  [...block.children].forEach((row, r) => {
    const header = allHeader || (!noHeader && r === 0);
    const tr = document.createElement('tr');
    const rowLabel = row.textContent.replace(/\[( |x|X)?\]/g, '').trim();
    [...row.children].forEach((source, c) => {
      tr.append(buildCell(source, {
        header, control: c === 0 ? control : null, name, rowLabel,
      }));
    });
    (header ? thead : tbody).append(tr);
  });

  if (thead.rows.length) table.append(thead);
  if (tbody.rows.length) table.append(tbody);
  if (thead.rows.length && tbody.rows.length) {
    [...thead.rows[thead.rows.length - 1].cells].forEach((th, i) => makeSortable(table, th, i));
  }

  if (control === 'checkbox' && thead.rows.length) {
    const all = thead.querySelector('.table-checkbox');
    const rows = () => [...tbody.querySelectorAll('.table-checkbox')];
    all?.addEventListener('change', () => rows().forEach((cb) => { cb.checked = all.checked; }));
    tbody.addEventListener('change', () => {
      if (!all) return;
      const checked = rows().filter((cb) => cb.checked).length;
      all.checked = checked === rows().length && checked > 0;
      all.indeterminate = checked > 0 && checked < rows().length;
    });
  }

  block.replaceChildren(table);
}
