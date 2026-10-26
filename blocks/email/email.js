/*
 * Email — kit "Email" (12712:21024): brand logo, white message card, optional footer links.
 * Authoring: rows in any order — a logo row (image or :az-logo: icon), the message row
 * (heading, text, bold link = button, optional image) and an optional links row.
 * Variant: mobile (the 343-wide kit layout at any viewport).
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cardRow = rows.find((row) => row.querySelector('h1, h2, h3, h4, h5, h6')) || rows[0];
  if (!cardRow) return;
  const before = rows.slice(0, rows.indexOf(cardRow));
  const after = rows.slice(rows.indexOf(cardRow) + 1);

  const logo = document.createElement('div');
  logo.className = 'email-logo';
  const logoImg = before.map((row) => row.querySelector('img, .icon')).find(Boolean);
  if (logoImg) {
    logo.append(logoImg.closest('picture, .icon') || logoImg);
  } else {
    logo.innerHTML = `<img src="${window.hlx?.codeBasePath || ''}/icons/az-email-logo.svg" alt="AstraZeneca" width="202" height="48">`;
  }
  const img = logo.querySelector('img');
  if (img && !img.alt) img.alt = 'AstraZeneca';
  if (img) img.loading = 'eager';

  const card = document.createElement('div');
  card.className = 'email-card';
  card.append(...[...cardRow.children].flatMap((cell) => [...cell.children]));
  card.querySelectorAll('p > picture, p > img').forEach((media) => media.parentElement.classList.add('email-image'));

  block.replaceChildren(logo, card);

  const linksRow = after.find((row) => row.querySelector('a'));
  if (linksRow) {
    const nav = document.createElement('nav');
    nav.className = 'email-links';
    nav.setAttribute('aria-label', 'Email footer');
    const list = document.createElement('ul');
    linksRow.querySelectorAll('a').forEach((a) => {
      const li = document.createElement('li');
      li.append(a);
      list.append(li);
    });
    nav.append(list);
    block.append(nav);
  }
}
