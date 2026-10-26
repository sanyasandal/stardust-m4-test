/**
 * Quiz — kit "Quiz" (Type=Question 13422:2865 … / Type=Results 13424:4795 …).
 * Content model (one row per item, any order):
 *  - "n/m" (single cell): progress stepper. Before the content it renders as the
 *    full-width top stepper, after it as an inline stepper inside the card.
 *  - heading / paragraphs: question or result text.
 *  - a list: answer options (single choice).
 *  - links: actions (bold = primary, italic = secondary, plain = text link).
 *  - picture + text: "Powered by" badge below the card.
 */
const STEP = /^\s*(\d+)\s*\/\s*(\d+)\s*$/;
let quizCount = 0;

function buildStepper(current, total) {
  const stepper = document.createElement('div');
  stepper.className = 'quiz-stepper';
  stepper.setAttribute('role', 'progressbar');
  stepper.setAttribute('aria-valuemin', '1');
  stepper.setAttribute('aria-valuemax', total);
  stepper.setAttribute('aria-valuenow', current);
  stepper.setAttribute('aria-label', `Step ${current} of ${total}`);
  stepper.style.setProperty('--quiz-progress', Math.min(current / total, 1));
  const fill = document.createElement('div');
  fill.className = 'quiz-stepper-fill';
  const label = document.createElement('span');
  label.textContent = `${current}/${total}`;
  fill.append(label);
  stepper.append(fill);
  return stepper;
}

function buildOptions(list, name, labelledBy) {
  const group = document.createElement('div');
  group.className = 'quiz-options';
  group.setAttribute('role', 'radiogroup');
  if (labelledBy) group.setAttribute('aria-labelledby', labelledBy);
  [...list.children].forEach((li, i) => {
    const option = document.createElement('label');
    option.className = 'check quiz-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = String(i + 1);
    const text = document.createElement('span');
    text.append(...li.childNodes);
    option.append(input, text);
    group.append(option);
  });
  return group;
}

function decorateActions(container) {
  container.querySelectorAll('a').forEach((a) => {
    if (!a.classList.contains('button')) {
      const strong = a.closest('strong');
      const em = a.closest('em');
      let variant = 'link';
      if (strong) variant = 'primary';
      else if (em) variant = 'secondary';
      a.classList.add('button', variant);
      const wrapper = strong || em;
      if (wrapper) wrapper.replaceWith(a);
      if (a.parentElement?.tagName === 'P') a.parentElement.className = 'button-wrapper';
    }
    const icon = a.querySelector('.icon');
    if (icon) a.classList.add(icon === a.firstElementChild ? 'icon-before' : 'icon-after');
  });
}

export default function decorate(block) {
  quizCount += 1;
  const name = `quiz-${quizCount}`;
  const card = document.createElement('div');
  card.className = 'quiz-card';
  const content = document.createElement('div');
  content.className = 'quiz-content';
  const actions = document.createElement('div');
  actions.className = 'quiz-actions';
  let top = null;
  let powered = null;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const text = row.textContent.trim();
    const step = text.match(STEP);
    if (step && !row.querySelector('a, picture')) {
      const stepper = buildStepper(Number(step[1]), Number(step[2]));
      if (!content.children.length && !top) {
        stepper.classList.add('quiz-stepper-top');
        top = stepper;
      } else content.append(stepper);
      return;
    }
    if (row.querySelector('picture')) {
      powered = document.createElement('div');
      powered.className = 'quiz-powered';
      cells.forEach((cell) => powered.append(...cell.childNodes));
      return;
    }
    const links = row.querySelectorAll('a');
    const linkText = [...links].map((a) => a.textContent).join('').replace(/\s/g, '');
    if (links.length && linkText === text.replace(/\s/g, '')) {
      cells.forEach((cell) => actions.append(...cell.childNodes));
      return;
    }
    cells.forEach((cell) => {
      [...cell.children].forEach((el) => {
        if (el.matches('ul, ol')) {
          const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
          if (heading && !heading.id) heading.id = `${name}-question`;
          content.append(buildOptions(el, name, heading?.id));
        } else content.append(el);
      });
      if (!cell.children.length && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = cell.textContent.trim();
        content.append(p);
      }
    });
  });

  decorateActions(actions);
  card.append(content);
  if (actions.children.length) card.append(actions);
  const body = document.createElement('div');
  body.className = 'quiz-body';
  body.append(card);
  block.replaceChildren(...[top, body, powered].filter(Boolean));
}
