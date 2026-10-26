const TYPES = ['primary', 'secondary', 'tertiary', 'link'];
const SIZES = ['small', 'large'];

function toMaskIcon(span) {
  const name = [...span.classList].find((c) => c.startsWith('icon-'))?.slice(5);
  const icon = document.createElement('span');
  icon.className = 'button-icon';
  icon.setAttribute('aria-hidden', 'true');
  if (name) icon.style.setProperty('--icon', `url('${window.hlx?.codeBasePath || ''}/icons/${name}.svg')`);
  return icon;
}

/**
 * Kit "Button" (12084:109164): one or more authored links become `.button` anchors
 * (type primary|secondary|tertiary|link, size small|large, medium by default).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const type = TYPES.find((t) => block.classList.contains(t))
    || (block.querySelector('em a, a.secondary') ? 'secondary' : 'primary');
  const size = SIZES.find((s) => block.classList.contains(s));
  const links = [...block.querySelectorAll('a[href]')];

  const buttons = links.map((a) => {
    a.querySelectorAll('.icon').forEach((span) => span.replaceWith(toMaskIcon(span)));
    [...a.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      if (!node.textContent.trim()) {
        node.remove();
        return;
      }
      const text = document.createElement('span');
      text.className = 'button-text';
      text.textContent = node.textContent.trim();
      node.replaceWith(text);
    });
    const label = a.textContent.trim();
    a.className = ['button', type, size].filter(Boolean).join(' ');
    if (!label) {
      a.classList.add('icon-only');
      if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', a.title || 'Button');
      a.removeAttribute('title');
    } else {
      a.title = a.title || label;
    }
    if (block.classList.contains('disabled')) {
      a.setAttribute('aria-disabled', 'true');
      a.tabIndex = -1;
    }
    return a;
  });

  block.replaceChildren(...buttons);
}
