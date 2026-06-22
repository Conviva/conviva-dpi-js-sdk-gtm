// Polyfill of GTM's makeNumber API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#makenumber

function makeNumber(value: any): number {
  return Number(value);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = makeNumber;
}

export default makeNumber;
