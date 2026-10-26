/*
 * Login — kit "Login" (12643:9460): a sign-in card over a full-bleed image.
 * Authoring, one row each (any may be omitted):
 *   image                                  → full-bleed background
 *   heading (+ intro text)                 → card title
 *   Label* | placeholder | optional link   → input field (password when the label says so)
 *   **link** / _link_                      → primary / secondary full-width button
 *   checkbox | label                       → checkbox
 *   divider | text                         → "Or" divider; later buttons form the alternative group
 *   plain link                             → centred text link
 *   text + link                            → bottom band ("Don't have an account? Create account")
 */
const iconSrc = (name) => `${window.hlx?.codeBasePath || ''}/icons/${name}.svg`;
let uid = 0;

function cellsOf(row) {
  return [...row.children];
}

function buildField(cells) {
  uid += 1;
  const raw = cells[0].textContent.trim();
  const required = /\*\s*$/.test(raw);
  const labelText = raw.replace(/\s*\*\s*$/, '');
  let type = 'text';
  if (/password/i.test(labelText)) type = 'password';
  else if (/e-?mail/i.test(labelText)) type = 'email';
  const id = `login-${type}-${uid}`;

  const field = document.createElement('div');
  field.className = 'field';
  const top = document.createElement('div');
  top.className = 'login-label-row';
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  if (required) {
    const star = document.createElement('span');
    star.className = 'required';
    star.textContent = '*';
    star.setAttribute('aria-hidden', 'true');
    label.append(star);
  }
  top.append(label);
  const link = cells[2]?.querySelector('a');
  if (link) {
    link.className = 'login-aside';
    top.append(link);
  }

  const wrap = document.createElement('div');
  wrap.className = 'login-input';
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.name = type;
  input.placeholder = cells[1]?.textContent.trim() || '';
  if (required) input.required = true;
  if (type === 'email') input.autocomplete = 'username';
  if (type === 'password') input.autocomplete = 'current-password';
  wrap.append(input);

  if (type === 'password') {
    const eye = document.createElement('button');
    eye.type = 'button';
    eye.className = 'login-eye';
    eye.setAttribute('aria-label', 'Show password');
    eye.innerHTML = `<img src="${iconSrc('eye-slash')}" alt="" width="20" height="20">`;
    eye.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      eye.querySelector('img').src = iconSrc(show ? 'eye' : 'eye-slash');
    });
    wrap.append(eye);
  }
  field.append(top, wrap);
  return field;
}

function buildCheckbox(text) {
  uid += 1;
  const row = document.createElement('div');
  row.className = 'login-check';
  const label = document.createElement('label');
  label.className = 'check';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = `remember-${uid}`;
  label.append(input, text);
  row.append(label);
  return row;
}

export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'login-media';
  const head = document.createElement('div');
  head.className = 'login-head';
  const form = document.createElement('div');
  form.className = 'login-form';
  const alt = document.createElement('div');
  alt.className = 'login-alt';
  const band = document.createElement('div');
  band.className = 'login-band';
  let divider = null;
  let group = form;

  [...block.children].forEach((row) => {
    const cells = cellsOf(row);
    const key = cells.length > 1 ? cells[0].textContent.trim().toLowerCase() : '';
    const pic = row.querySelector('picture, img');
    const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
    if (pic && !heading && !row.textContent.trim()) {
      media.append(pic.closest('picture') || pic);
    } else if (heading) {
      head.append(...cells.flatMap((c) => [...c.childNodes]));
    } else if (key === 'checkbox') {
      group.append(buildCheckbox(cells[1].textContent.trim()));
    } else if (key === 'divider') {
      divider = document.createElement('div');
      divider.className = 'login-divider';
      const span = document.createElement('span');
      span.textContent = cells[1].textContent.trim();
      divider.append(span);
      group = alt;
    } else if (cells.length > 1) {
      group.append(buildField(cells));
    } else {
      const cell = cells[0];
      if (!cell) return;
      const buttons = cell.querySelectorAll('a.button');
      const links = cell.querySelectorAll('a');
      if (buttons.length) {
        buttons.forEach((a) => {
          const p = document.createElement('p');
          p.className = 'button-wrapper';
          p.append(a);
          group.append(p);
        });
      } else if (links.length === 1 && cell.textContent.trim() === links[0].textContent.trim()) {
        const p = document.createElement('p');
        p.className = 'login-link';
        p.append(links[0]);
        group.append(p);
      } else if (cell.textContent.trim()) {
        band.append(...[...cell.querySelectorAll(':scope > p')].flatMap((p) => [...p.childNodes]));
        if (!band.childNodes.length) band.append(...cell.childNodes);
      }
    }
  });

  [...band.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      if (!n.textContent.trim()) {
        n.remove();
        return;
      }
      const span = document.createElement('span');
      span.textContent = n.textContent.trim();
      n.replaceWith(span);
    }
  });

  const main = document.createElement('div');
  main.className = 'login-main';
  [head, form].forEach((el) => { if (el.childNodes.length) main.append(el); });
  if (divider) main.append(divider);
  if (alt.childNodes.length) main.append(alt);

  const card = document.createElement('div');
  card.className = 'login-card';
  card.append(main);
  if (band.childNodes.length) {
    card.append(band);
    block.classList.add('has-band');
  }

  block.replaceChildren();
  if (media.childNodes.length) {
    const img = media.querySelector('img');
    if (img) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
    block.append(media);
  }
  block.append(card);
}
