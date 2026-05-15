// Polyfill of GTM's makeString API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#makestring

function makeString(value: any): string {
  return value !== null ? String(value) : '';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = makeString;
}

export default makeString;
