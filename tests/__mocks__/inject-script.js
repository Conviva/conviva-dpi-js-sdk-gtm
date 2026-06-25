/** Jest mock for GTM injectScript — calls onSuccess unless URL contains "fail-script". */
const injectScript = jest.fn((url, onSuccess, onFailure) => {
  if (String(url).includes('fail-script')) {
    if (onFailure) onFailure();
    return;
  }
  if (onSuccess) onSuccess();
});

module.exports = injectScript;
