// Polyfill of GTM's makeNumber API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#makenumber

function makeNumber(value: any): number {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = makeNumber;
}

export default makeNumber;
