// Polyfill of GTM's copyFromWindow API for the local dev harness.
// https://developers.google.com/tag-platform/tag-manager/templates/api#copyfromwindow

function copyFromWindow(key: string): any {
  if (typeof window !== 'undefined' && key in window) {
    return (window as any)[key];
  }
  return undefined;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = copyFromWindow;
}

export default copyFromWindow;
