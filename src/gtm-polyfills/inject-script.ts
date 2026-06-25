// Polyfill of GTM's injectScript API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#injectscript
//
// Conviva's sandboxed JS calls this with a fourth arg (cacheToken) used by
// real GTM to dedupe injections. The harness ignores the token and uses
// a Set keyed by URL to avoid double-injecting in the same page session.

const injected = new Set<string>();

function injectScript(
  url: string,
  onSuccess?: () => void,
  onFailure?: () => void,
  _cacheToken?: string,
): void {
  if (typeof document === 'undefined') {
    console.warn('[GTM polyfill] injectScript called outside a browser:', url);
    if (onFailure) onFailure();
    return;
  }
  if (injected.has(url)) {
    if (onSuccess) onSuccess();
    return;
  }
  injected.add(url);
  const script = document.createElement('script');
  script.src = url;
  script.onload = () => onSuccess && onSuccess();
  script.onerror = () => onFailure && onFailure();
  document.head.appendChild(script);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = injectScript;
}

export default injectScript;
