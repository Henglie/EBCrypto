import { getMotionSpeed } from './motionPreferences.js';

// Existing product preference is authoritative; OS motion does not override it.
export const motionAllowed = () => !document.documentElement.classList.contains('reduce-motion')
  && document.documentElement.classList.contains('spring-motion');
const disclosures = new WeakMap();
const running = new Set();
const surfaces = new WeakMap();
const surfaceDefaults = new WeakMap();
const detailsStates = new WeakMap();
const controls = 'button, .act-btn, .nav-item, .nav-subitem, summary, a.home-tool-card';
export function finishExpressiveMotion() { for (const entry of [...running]) entry.stop(); }

export const MOTION = Object.freeze({
  enter: 200, exit: 150, disclosure: 200,
  enterEase: 'cubic-bezier(.05,.7,.1,1)', exitEase: 'cubic-bezier(.3,0,.8,.15)',
  stateEase: 'cubic-bezier(.2,0,0,1)',
});

/** Height belongs only to the small disclosure being changed, never the page.
 * A new intent samples the current frame before cancelling the previous one. */
export function setDisclosure(node, expanded) {
  const old = disclosures.get(node);
  const currentHeight = node.hidden ? 0 : node.getBoundingClientRect().height;
  const currentOpacity = node.hidden ? 0 : Number(getComputedStyle(node).opacity);
  old?.cancel();
  node.hidden = false;
  node.removeAttribute('inert');
  const targetHeight = expanded ? node.scrollHeight : 0;
  let animation = null, done = false;
  const finish = () => {
    if (done) return;
    done = true;
    animation?.cancel();
    node.hidden = !expanded;
    node.style.removeProperty('overflow');
    if (disclosures.get(node) === entry) disclosures.delete(node);
    running.delete(entry);
    node.removeAttribute('inert');
  };
  const entry = { cancel() { if (done) return; done = true; animation?.cancel(); running.delete(entry); }, stop: finish };
  if (!motionAllowed() || !node.animate || !node.isConnected) { finish(); return; }
  if (!expanded) node.setAttribute('inert', '');
  // Large algorithm grids fade; do not repeatedly lay out thousands of pixels.
  const frames = Math.max(currentHeight, targetHeight) <= 900
    ? [{ height: `${currentHeight}px`, opacity: currentOpacity }, { height: `${targetHeight}px`, opacity: expanded ? 1 : 0 }]
    : [{ opacity: currentOpacity }, { opacity: expanded ? 1 : 0 }];
  node.style.overflow = 'hidden';
  animation = node.animate(frames, { duration: MOTION.disclosure * getMotionSpeed(), easing: MOTION.stateEase });
  disclosures.set(node, entry); running.add(entry);
  animation.onfinish = finish;
  animation.oncancel = () => { running.delete(entry); };
}

/** One owner per surface. Retarget from the presented frame before cancelling.
 * Only the latest intent may complete; closing surfaces stop accepting input now. */
function surfaceMotion(node, entering, distance, complete, duration) {
  node.setAttribute('data-m3-surface', '');
  const old = surfaces.get(node);
  const css = getComputedStyle(node);
  const from = old || !entering ? { opacity: css.opacity, transform: css.transform }
    : { opacity: 0, transform: distance ? `translateY(${distance}px)` : 'none' };
  const saved = surfaceDefaults.get(node) || { inert: node.inert, pointerEvents: node.style.pointerEvents };
  surfaceDefaults.set(node, saved);
  old?.cancel();
  if (entering) { node.inert = saved.inert; node.style.pointerEvents = saved.pointerEvents; }
  else { node.inert = true; node.style.pointerEvents = 'none'; }
  let animation = null, done = false;
  const entry = {
    saved,
    cancel() {
      if (done) return;
      done = true; animation?.cancel(); running.delete(entry);
      if (surfaces.get(node) === entry) surfaces.delete(node);
    },
    stop() {
      if (done) return;
      entry.cancel();
      if (entering) { node.inert = saved.inert; node.style.pointerEvents = saved.pointerEvents; }
      complete?.();
    },
  };
  surfaces.set(node, entry);
  if (!motionAllowed() || !node.animate || !node.isConnected) { entry.stop(); return; }
  // Rapid reversal travels only the remaining distance, without another full wait.
  const remaining = old ? Math.max(.2, Math.min(1, Math.abs((entering ? 1 : 0) - Number(from.opacity)))) : 1;
  animation = node.animate([from, { opacity: entering ? 1 : 0,
    transform: entering || !distance ? 'none' : `translateY(${distance}px)` }],
  { duration: (duration ?? (entering ? MOTION.enter : MOTION.exit)) * remaining * getMotionSpeed(),
    easing: entering ? MOTION.enterEase : MOTION.exitEase, fill: 'both' });
  running.add(entry);
  animation.onfinish = () => entry.stop();
  animation.oncancel = () => { running.delete(entry); };
}

/** Anchored surfaces move a few pixels, never scale their text or curve. */
export function enterSurface(node, distance = 8, { duration } = {}) { surfaceMotion(node, true, distance, null, duration); }
export function exitSurface(node, complete, distance = 4) { surfaceMotion(node, false, distance, complete); }

/** Native details stay native: no content wrappers, editor DOM or value changes. */
export function setDetailsExpanded(node, expanded) {
  const summary = node.querySelector(':scope > summary');
  if (!summary) return;
  const old = detailsStates.get(node);
  const height = node.getBoundingClientRect().height;
  const children = old?.children || [...node.children].filter(child => child !== summary).map(child => [child, child.inert]);
  old?.cancel();
  node.open = true;
  const css = getComputedStyle(node);
  const padding = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((n, key) => n + (parseFloat(css[key]) || 0), 0);
  const target = expanded ? node.scrollHeight + (parseFloat(css.borderTopWidth) || 0) + (parseFloat(css.borderBottomWidth) || 0)
    : summary.getBoundingClientRect().height + padding;
  const overflow = old?.overflow ?? node.style.overflow;
  for (const [child, inert] of children) child.inert = expanded ? inert : true;
  summary.setAttribute('aria-expanded', String(expanded));
  let animation = null, done = false;
  const entry = { expanded, children, overflow,
    cancel() { if (done) return; done = true; animation?.cancel(); running.delete(entry); detailsStates.delete(node); },
    stop() {
      if (done) return;
      entry.cancel(); node.open = expanded; node.style.overflow = overflow;
      for (const [child, inert] of children) child.inert = inert;
    },
  };
  detailsStates.set(node, entry);
  if (!motionAllowed() || !node.animate || !node.isConnected) { entry.stop(); return; }
  node.style.overflow = 'hidden';
  const frames = Math.max(height, target) <= 900
    ? [{ height: `${height}px` }, { height: `${target}px` }]
    : [{ opacity: 1 }, { opacity: expanded ? 1 : .5 }];
  animation = node.animate(frames, { duration: MOTION.disclosure * getMotionSpeed(), easing: MOTION.stateEase, fill: 'both' });
  running.add(entry); animation.onfinish = () => entry.stop();
}

let installed = false;
export function initExpressiveMotion() {
  if (installed) return;
  installed = true;
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button > 0) return;
    const summary = event.target.closest?.('summary');
    const details = summary?.parentElement;
    if (details?.tagName !== 'DETAILS' || details.matches('.io-tools-more, [data-motion="native"]')
      || event.target.closest('a, button, input, select, textarea') || details.closest('.cm-editor')) return;
    event.preventDefault();
    setDetailsExpanded(details, !(detailsStates.get(details)?.expanded ?? details.open));
  });
  const pressed = new Map();
  const eligible = target => {
    const node = target?.closest?.(controls);
    return node && !node.disabled && node.getAttribute('aria-disabled') !== 'true' ? node : null;
  };
  const clear = key => { const node = pressed.get(key); if (node) { pressed.delete(key); if (![...pressed.values()].includes(node)) node.removeAttribute('data-m3-pressed'); } };
  const clearAll = () => { for (const key of [...pressed.keys()]) clear(key); };
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const node = eligible(event.target); if (!node) return;
    clear(event.pointerId); pressed.set(event.pointerId, node); node.setAttribute('data-m3-pressed', 'true');
  }, true);
  for (const name of ['pointerup', 'pointercancel']) document.addEventListener(name, event => clear(event.pointerId), true);
  document.addEventListener('pointerout', event => {
    const node = pressed.get(event.pointerId);
    if (node && !node.contains(event.relatedTarget)) clear(event.pointerId);
  }, true);
  document.addEventListener('keydown', event => {
    if (event.repeat || event.isComposing || ![' ', 'Enter'].includes(event.key) || !event.target.matches?.('button, summary, [role="button"]')) return;
    const node = eligible(event.target); if (node) { pressed.set('keyboard', node); node.setAttribute('data-m3-pressed', 'true'); }
  }, true);
  document.addEventListener('keyup', () => clear('keyboard'), true);
  document.addEventListener('focusout', () => clear('keyboard'), true);
  window.addEventListener('blur', clearAll);
  window.addEventListener('pagehide', clearAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearAll(); finishExpressiveMotion(); } });
  new MutationObserver(() => {
    if (!motionAllowed()) finishExpressiveMotion();
    for (const [key, node] of pressed) if (!node.isConnected || node.disabled) clear(key);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}
