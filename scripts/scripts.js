import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  getMetadata,
  readBlockConfig,
  toCamelCase,
  toClassName,
} from './aem.js';

/* page templates with their own stylesheet in /styles/templates/ */
const TEMPLATES = ['form', 'login', 'email', 'overlay', 'library'];

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/* section styles that restyle the default-content buttons of their section (kit "Button") */
const BUTTON_SIZES = ['large', 'small'];
const BUTTON_TYPES = ['tertiary', 'link'];

/**
 * Default-content buttons pick up their section's size / type styles; their icons become
 * currentcolor masks and a button without text is an icon-only button.
 * @param {Element} a The button link
 */
function decorateDefaultContentButton(a) {
  const section = a.closest('.section');
  if (section) {
    BUTTON_SIZES.filter((s) => section.classList.contains(s)).forEach((s) => a.classList.add(s));
    const type = BUTTON_TYPES.find((t) => section.classList.contains(t));
    if (type) a.classList.replace(a.classList.contains('secondary') ? 'secondary' : 'primary', type);
  }
  a.querySelectorAll('.icon').forEach((icon) => {
    const name = [...icon.classList].find((c) => c.startsWith('icon-'))?.slice(5);
    if (name) icon.style.setProperty('--icon', `url('${window.hlx.codeBasePath}/icons/${name}.svg')`);
    icon.classList.add('button-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.replaceChildren();
  });
  if (!a.textContent.trim()) {
    a.classList.add('icon-only');
    a.setAttribute('aria-label', a.title || 'Button');
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();
    const inBlock = !!a.closest('.block');

    // quick structural checks (icons are fine in default-content buttons, other images are not)
    const img = inBlock ? a.querySelector('img') : a.querySelector('img:not(.icon img)');
    if (img || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
    if (!inBlock) decorateDefaultContentButton(a);
  });
}

const SECTION_VAR = /^(height|pad-top|pad-bottom)-(desktop|tablet|mobile)$/;

/**
 * `height-<bp>` / `pad-top-<bp>` / `pad-bottom-<bp>` section metadata (px, bp = desktop | tablet |
 * mobile) → --section-{h,pt,pb}-{d,t,m}, which the page templates use for the section box.
 * @param {Element} section The section element
 * @param {string} key The metadata key
 * @param {string} value The metadata value
 */
function applySectionVar(section, key, value) {
  const [, prop, bp] = key.match(SECTION_VAR) || [];
  const px = Number.parseFloat(value);
  if (!prop || Number.isNaN(px)) return;
  const name = { height: 'h', 'pad-top': 'pt', 'pad-bottom': 'pb' }[prop];
  section.style.setProperty(`--section-${name}-${bp[0]}`, `${px}px`);
}

/**
 * Applies section-metadata: `style` becomes section classes, every other key a data attribute
 * (e.g. `kit-component` → data-kit-component, the hook of the kit library pages).
 * @param {Element} main The main element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll(':scope > .section .section-metadata').forEach((meta) => {
    const section = meta.closest('.section');
    Object.entries(readBlockConfig(meta)).forEach(([key, value]) => {
      if (key === 'style') {
        String(value).split(',').map((s) => toClassName(s.trim())).filter(Boolean)
          .forEach((c) => section.classList.add(c));
      } else {
        section.dataset[toCamelCase(key)] = value;
      }
    });
    const wrapper = meta.parentElement;
    meta.remove();
    if (wrapper && !wrapper.children.length) wrapper.remove();
  });
  // the delivery pipeline applies section metadata server-side as section data attributes
  main.querySelectorAll(':scope > .section').forEach((section) => {
    Object.entries(section.dataset).forEach(([camel, value]) => {
      const key = camel.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      applySectionVar(section, key, value);
      if (key === 'kit-width' && Number.parseFloat(value)) section.style.setProperty('--kit-w', `${Number.parseFloat(value)}px`);
    });
  });
}

const BLOCK_LEVEL = 'P,H1,H2,H3,H4,H5,H6,UL,OL,DIV,TABLE,BLOCKQUOTE,PRE,HR'.split(',');

/**
 * The content pipeline unwraps a block cell's lone paragraph and drops sections
 * that only held page metadata. Restore the authored shape so block decorators
 * (and decorateButtons) can rely on `cell > p`.
 * @param {Element} main The container element
 */
function normalizeContent(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    if (!section.children.length && !section.textContent.trim()) section.remove();
  });
  main.querySelectorAll(':scope > div > div[class]').forEach((block) => {
    if (block.matches('.section-metadata, .metadata')) return;
    block.querySelectorAll(':scope > div > div').forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('img, picture')) return;
      if ([...cell.children].some((el) => BLOCK_LEVEL.includes(el.tagName))) return;
      const p = document.createElement('p');
      p.append(...cell.childNodes);
      cell.append(p);
    });
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  normalizeContent(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionMetadata(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const template = toClassName(getMetadata('template'));
  const templateCSS = TEMPLATES.includes(template)
    ? loadCSS(`${window.hlx.codeBasePath}/styles/templates/${template}.css`) : null;
  const main = doc.querySelector('main');
  if (main) {
    await templateCSS;
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
