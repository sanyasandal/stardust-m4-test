/*
 * Back to top — kit "Back to top" (12522:1040).
 * Content model: one cell holding the link text (optionally a link). The link scrolls the page
 * back to the top and moves focus to the start of the main content.
 * Variants: `light` (default, magenta link) and `dark` (white link, for dark sections).
 */
export default function decorate(block) {
  const authored = block.querySelector('a');
  const label = (authored || block).textContent.trim() || 'Back to top';
  const link = document.createElement('a');
  link.className = 'back-to-top-link';
  link.href = '#';
  link.textContent = label;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const target = document.querySelector('main') || document.body;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
  block.replaceChildren(link);
}
