/* Range field (slider): `value of min-max`, two thumbs `low-high of min-max`, or just `min-max`. */
import {
  el, slug, visuallyHidden, buildLabelRow, appendMessages, applyStates, readValue,
} from './util.js';

const NUM = '(-?\\d+(?:\\.\\d+)?)';

/** "42 of 0-100" | "20-80 of 0-100" | "0-100" | "42" → { values[], min, max } */
export function parseRange(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  const pair = (s) => s.match(new RegExp(`^${NUM} ?(?:-|–|to) ?${NUM}$`));
  const [value, bounds] = t.split(/ of /i);
  let min = 0;
  let max = 100;
  const b = bounds ? pair(bounds.trim()) : null;
  if (b) [min, max] = [Number(b[1]), Number(b[2])];
  if (!bounds && pair(value)) {
    const [, lo, hi] = pair(value);
    return { values: [(Number(lo) + Number(hi)) / 2], min: Number(lo), max: Number(hi) };
  }
  const v = pair(value || '');
  if (v) return { values: [Number(v[1]), Number(v[2])], min, max };
  const n = parseFloat(value);
  return { values: [Number.isFinite(n) ? n : (min + max) / 2], min, max };
}

export default function buildRangeField({
  label, valueCell, state, id,
}) {
  const { states } = state;
  const field = el('div', 'field form-field form-range');
  applyStates(field, state);

  // kit swatch: the slider thumb on its own
  if (states.has('thumb')) {
    const thumb = el('span', 'form-range-thumb');
    thumb.setAttribute('aria-hidden', 'true');
    field.append(thumb);
    return field;
  }

  const { top } = buildLabelRow(label, state, id, { hide: states.has('hide-label') });
  field.append(top);
  const { values, min, max } = parseRange(readValue(valueCell).text);
  const slider = el('div', 'form-range-track');
  const inputs = values.map((v, i) => {
    const input = el('input');
    input.type = 'range';
    input.id = i ? `${id}-${i + 1}` : id;
    input.name = `${slug(label.text) || id}${values.length > 1 ? `-${i ? 'max' : 'min'}` : ''}`;
    input.min = min;
    input.max = max;
    input.value = v;
    input.disabled = states.has('disabled');
    if (values.length > 1) input.setAttribute('aria-label', `${label.text} ${i ? 'maximum' : 'minimum'}`);
    slider.append(input);
    return input;
  });
  const update = () => {
    const pct = (v) => (max > min ? (v - min) / (max - min) : 0);
    if (inputs.length > 1) {
      const [lo, hi] = inputs.map((i) => Number(i.value)).sort((a, b) => a - b);
      slider.style.setProperty('--from', pct(lo));
      slider.style.setProperty('--fill', pct(hi));
    } else slider.style.setProperty('--fill', pct(Number(inputs[0].value)));
  };
  inputs.forEach((i) => i.addEventListener('input', update));
  update();
  if (inputs.length > 1) slider.classList.add('two-thumbs');

  const labels = el('div', 'form-range-labels');
  labels.setAttribute('aria-hidden', 'true');
  labels.append(el('span', '', String(min)), el('span', '', String(max)));
  field.append(slider, labels);
  if (states.has('hide-label')) visuallyHidden(top);
  appendMessages(field, state, inputs[0], id);
  return field;
}
