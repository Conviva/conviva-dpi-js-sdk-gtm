// Polyfill of GTM's logToConsole API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#logtoconsole

function logToConsole(...args: any[]): void {
  console.log('[Conviva GTM]', ...args);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = logToConsole;
}

export default logToConsole;
