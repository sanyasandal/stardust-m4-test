/*
 * Accordion — kit "Accordion" (12360:10305).
 * Content model: one row per item; cell 1 = title, cell 2 = panel content (headings, text, …).
 * Block variant `expanded` opens every item initially (`closed` / none: all collapsed).
 */
export default function decorate(block) {
  const openAll = block.classList.contains('expanded');
  const items = [...block.children].map((row) => {
    const cells = [...row.children];
    const [titleCell, ...bodyCells] = cells.length ? cells : [row];

    const details = document.createElement('details');
    details.className = 'accordion-item';
    if (openAll) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    const title = document.createElement('span');
    title.className = 'accordion-item-title';
    const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6, p');
    if (heading && titleCell.children.length === 1) title.append(...heading.childNodes);
    else title.append(...titleCell.childNodes);
    const icon = document.createElement('span');
    icon.className = 'accordion-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    summary.append(title, icon);

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    bodyCells.forEach((cell) => body.append(...cell.childNodes));
    // a bare text cell becomes a paragraph so it picks up the body text style
    [...body.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
        const p = document.createElement('p');
        n.replaceWith(p);
        p.append(n);
      }
    });

    details.append(summary);
    if (body.childNodes.length) details.append(body);
    return details;
  });
  block.replaceChildren(...items);
}
