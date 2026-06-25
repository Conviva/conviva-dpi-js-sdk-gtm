import copyFromWindow from '../../src/gtm-polyfills/copy-from-window';

describe('copyFromWindow polyfill', () => {
  afterEach(() => {
    delete (window as any).__cfwTest;
  });

  it('returns the window value when the key exists', () => {
    (window as any).__cfwTest = 'hello';
    expect(copyFromWindow('__cfwTest')).toBe('hello');
  });

  it('returns undefined when the key does not exist', () => {
    expect(copyFromWindow('__definitelyNotInWindow')).toBeUndefined();
  });
});
