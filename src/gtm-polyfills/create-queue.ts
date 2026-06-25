// Polyfill of GTM's createQueue API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#createqueue
//
// Initialises window[propName] as an array if it doesn't already exist,
// and returns a function that pushes its arguments onto that array.

function createQueue(propName: string): (...args: any[]) => number {
  const win = window as any;
  if (!Array.isArray(win[propName])) {
    win[propName] = [];
  }
  const queue = win[propName] as any[];
  return (...args: any[]) => queue.push(...args);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = createQueue;
}

export default createQueue;
