// Polyfill of GTM's setInWindow API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#setinwindow
//
// Sets window[key] = value. By default refuses to overwrite an existing
// non-null value; pass overrideExisting=true to force.

function setInWindow(key: string, value: any, overrideExisting?: boolean): boolean {
  const win = window as any;
  if (key in win && win[key] != null && !overrideExisting) {
    return false;
  }
  win[key] = value;
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = setInWindow;
}

export default setInWindow;
