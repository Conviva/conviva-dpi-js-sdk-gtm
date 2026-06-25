// Polyfill of GTM's callInWindow API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#callinwindow
//
// Resolves a dot-separated path against window, then invokes it as a
// function with the supplied args. Returns the function's return value
// (or undefined if the path doesn't resolve to a function).

function callInWindow(path: string, ...args: any[]): any {
  const segments = path.split('.');
  let context: any = window;
  let parent: any = null;
  for (const seg of segments) {
    if (context == null) return undefined;
    parent = context;
    context = context[seg];
  }
  if (typeof context !== 'function') return undefined;
  return context.apply(parent, args);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = callInWindow;
}

export default callInWindow;
