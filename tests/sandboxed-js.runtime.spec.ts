import { loadSandbox } from './helpers/sandbox-test-env';

function getInjectMock(): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('injectScript');
}

describe('sandboxed-js tag runtime', () => {
  beforeEach(() => {
    getInjectMock().mockClear();
    const win = globalThis as {
      apptracker?: jest.Mock;
      ConvivaReplay?: { init: jest.Mock };
      GlobalConvivaNamespace?: unknown;
    };
    delete win.apptracker;
    delete win.GlobalConvivaNamespace;
    win.ConvivaReplay = { init: jest.fn() };
  });

  it('init — Conviva-hosted injects SDK script URL', () => {
    const { data } = loadSandbox({
      type: 'init',
      convivaCustomerKey: 'key',
      appId: 'app',
      scriptSource: 'conviva_hosted',
      scriptVersion: 'v2.2.0',
      initClientId: '  cid-9  ',
    });
    expect(getInjectMock()).toHaveBeenCalledWith(
      'https://sensor.conviva.com/dpi/releases/v2.2.0/convivaAppTracker.js',
      expect.any(Function),
      expect.any(Function),
      'conviva_appanalytics',
    );
    const tracker = (globalThis as { apptracker?: jest.Mock }).apptracker;
    expect(tracker).toHaveBeenCalledWith('setClientId', 'cid-9');
    expect(data.gtmOnSuccess).toHaveBeenCalled();
  });

  it('init — with cohort replay injects replay then SDK', () => {
    loadSandbox({
      type: 'init',
      convivaCustomerKey: 'key',
      appId: 'app',
      scriptSource: 'conviva_hosted',
      initWithCohortReplay: true,
      replayScriptSource: 'conviva_hosted',
    });
    const inject = getInjectMock();
    expect(inject).toHaveBeenCalledTimes(2);
    expect(inject.mock.calls[0][0]).toContain('/replay/releases/');
  });

  it('trackPageView without title', () => {
    const { data } = loadSandbox({ type: 'trackPageView' });
    const tracker = (globalThis as { apptracker?: jest.Mock }).apptracker;
    expect(tracker).toHaveBeenCalledWith('trackPageView');
    expect(data.gtmOnSuccess).toHaveBeenCalled();
  });

  it('trackPageView with title', () => {
    loadSandbox({ type: 'trackPageView', trackPageViewTitle: 'Home' });
    const tracker = (globalThis as { apptracker?: jest.Mock }).apptracker;
    expect(tracker).toHaveBeenCalledWith('trackPageView', { title: 'Home' });
  });

  it('trackCustomEvent merges table and object', () => {
    loadSandbox({
      type: 'trackCustomEvent',
      eventName: 'click',
      eventData: [{ name: 'k', value: 'v' }],
      eventDataObject: { extra: true },
    });
    const tracker = (globalThis as { apptracker?: jest.Mock }).apptracker;
    expect(tracker).toHaveBeenCalledWith('trackCustomEvent', {
      name: 'click',
      data: expect.objectContaining({ k: 'v', extra: true }),
    });
  });

  it('setCustomTags merges table and object', () => {
    loadSandbox({
      type: 'setCustomTags',
      setCustomTagsTable: [{ key: 'a', value: '1' }],
      setCustomTagsObject: { b: '2' },
    });
    const tracker = (globalThis as { apptracker?: jest.Mock }).apptracker;
    expect(tracker).toHaveBeenCalledWith('setCustomTags', { a: '1', b: '2' });
  });

  it('unsetCustomTags', () => {
    loadSandbox({ type: 'unsetCustomTags', unsetCustomTagsKeys: 'x, y' });
    const tracker = (globalThis as { apptracker?: jest.Mock }).apptracker;
    expect(tracker).toHaveBeenCalledWith('unsetCustomTags', ['x', 'y']);
  });

  it('trackError with optional fields', () => {
    loadSandbox({
      type: 'trackError',
      trackErrorMessage: 'boom',
      trackErrorFilename: 'app.js',
      trackErrorObject: new Error('x'),
    });
    const tracker = (globalThis as { apptracker?: jest.Mock }).apptracker;
    expect(tracker).toHaveBeenCalledWith(
      'trackError',
      expect.objectContaining({ message: 'boom', filename: 'app.js' }),
    );
  });

  it('trackRevenue success path', () => {
    const { data } = loadSandbox({
      type: 'trackRevenue',
      revenueTotalOrderAmount: '10',
      revenueOrderId: 'o1',
      revenueCurrency: 'USD',
    });
    expect(data.gtmOnSuccess).toHaveBeenCalled();
  });

});
