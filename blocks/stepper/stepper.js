/*
 * Stepper — kit "Stepper" (13121:3063 / 3065 / 3072): progress through a multi-step flow.
 * Content model: one cell "current/total" (e.g. "1/3"). Without it the step-N variant class and a
 * total of 3 are used. An optional second cell is the accessible label (default "Progress").
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const raw = cells[0]?.textContent.trim() || '';
  const match = raw.match(/(\d+)\s*\/\s*(\d+)/);
  const classStep = [...block.classList].map((c) => c.match(/^step-(\d+)$/)).find(Boolean);
  const total = Math.max(1, match ? Number(match[2]) : 3);
  const n = match ? Number(match[1]) : Number(classStep?.[1] || 1);
  const current = Math.min(total, Math.max(0, n));
  const label = cells[1]?.textContent.trim() || 'Progress';

  const track = document.createElement('div');
  track.className = 'stepper-track';
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-label', label);
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', String(total));
  track.setAttribute('aria-valuenow', String(current));
  track.setAttribute('aria-valuetext', `Step ${current} of ${total}`);

  const fill = document.createElement('div');
  fill.className = 'stepper-fill';
  fill.style.setProperty('--progress', current / total);
  if (current >= total) fill.classList.add('complete');
  const text = document.createElement('span');
  text.className = 'stepper-label';
  text.textContent = `${current}/${total}`;
  fill.append(text);
  track.append(fill);
  block.replaceChildren(track);
}
