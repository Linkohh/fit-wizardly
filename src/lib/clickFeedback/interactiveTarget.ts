const CLICK_FEEDBACK_ATTRIBUTE = 'data-click-feedback';

type ClickFeedbackOverride = 'on' | 'off';

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'summary',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
].join(',');

function asElement(target: EventTarget | null): Element | null {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

function getNearestOverrideElement(element: Element): Element | null {
  return element.closest(`[${CLICK_FEEDBACK_ATTRIBUTE}]`);
}

function getOverrideValue(element: Element): ClickFeedbackOverride | null {
  const raw = element.getAttribute(CLICK_FEEDBACK_ATTRIBUTE);
  if (raw === 'on' || raw === 'off') return raw;
  return null;
}

function isDisabled(element: Element): boolean {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  if (element.hasAttribute('data-disabled')) return true;

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLOptionElement
  ) {
    return element.disabled;
  }

  return false;
}

/**
 * Finds the closest element that should trigger click feedback (sound/haptics).
 *
 * Defaults to semantic interactive elements and common ARIA roles.
 * For custom click targets, add `data-click-feedback="on"` to opt in, or
 * `data-click-feedback="off"` to opt out for a subtree.
 */
export function getClickFeedbackTarget(target: EventTarget | null): Element | null {
  const element = asElement(target);
  if (!element) return null;

  const overrideElement = getNearestOverrideElement(element);
  if (overrideElement) {
    const overrideValue = getOverrideValue(overrideElement);
    if (overrideValue === 'off') return null;
    if (overrideValue === 'on') {
      return isDisabled(overrideElement) ? null : overrideElement;
    }
  }

  const interactive = element.closest(INTERACTIVE_SELECTOR);
  if (!interactive) return null;

  return isDisabled(interactive) ? null : interactive;
}

