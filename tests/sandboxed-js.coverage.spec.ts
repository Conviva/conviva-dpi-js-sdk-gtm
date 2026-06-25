import { loadExportsOnly, loadSandbox } from './helpers/sandbox-test-env';

describe('sandboxed-js coverage gaps', () => {
  it('getReplayScriptUrl — customer-hosted success', () => {
    const exp = loadExportsOnly();
    expect(
      exp.getReplayScriptUrl({
        replayScriptSource: 'customer_hosted',
        replayScriptUrl: 'https://cdn.example.com/replay.js',
      }).url,
    ).toBe('https://cdn.example.com/replay.js');
  });

  it('buildRevenueData — logs and skips invalid optional numerics', () => {
    const exp = loadExportsOnly();
    const result = exp.buildRevenueData({
      revenueTotalOrderAmount: '1',
      revenueOrderId: 'o',
      revenueCurrency: 'USD',
      revenueTaxAmount: 'not-a-number',
      revenueShippingCost: 'not-a-number',
      revenueDiscount: 'not-a-number',
      revenueCartSize: 'not-a-number',
    });
    expect(result.revenueData?.taxAmount).toBeUndefined();
    expect(result.revenueData?.shippingCost).toBeUndefined();
  });

  it('buildRevenueData — non-array items logs and ignores', () => {
    const exp = loadExportsOnly();
    const result = exp.buildRevenueData({
      revenueTotalOrderAmount: '1',
      revenueOrderId: 'o',
      revenueCurrency: 'USD',
      revenueItemsList: 'not-array',
    });
    expect(result.revenueData?.items).toBeUndefined();
  });

  it('buildRevenueData — invalid revenueDataObject type', () => {
    const exp = loadExportsOnly();
    const result = exp.buildRevenueData({
      revenueTotalOrderAmount: '1',
      revenueOrderId: 'o',
      revenueCurrency: 'USD',
      revenueDataObject: 'nope',
    });
    expect(result.revenueData?.extraMetadata).toBeUndefined();
  });

  it('init — missing customer script URL fails', () => {
    const { data } = loadSandbox({
      type: 'init',
      scriptSource: 'customer_hosted',
      convivaCustomerKey: 'k',
      appId: 'a',
    });
    expect(data.gtmOnFailure).toHaveBeenCalled();
  });

  it('init — missing replay URL when cohort replay enabled fails', () => {
    const { data } = loadSandbox({
      type: 'init',
      convivaCustomerKey: 'k',
      appId: 'a',
      scriptSource: 'conviva_hosted',
      initWithCohortReplay: true,
      replayScriptSource: 'customer_hosted',
    });
    expect(data.gtmOnFailure).toHaveBeenCalled();
  });

  it('init — script inject failure calls gtmOnFailure', () => {
    const { data } = loadSandbox({
      type: 'init',
      convivaCustomerKey: 'k',
      appId: 'a',
      scriptSource: 'customer_hosted',
      scriptUrl: 'https://cdn.example.com/fail-script.js',
    });
    expect(data.gtmOnFailure).toHaveBeenCalled();
  });

  it('init — replay inject failure calls gtmOnFailure', () => {
    const { data } = loadSandbox({
      type: 'init',
      convivaCustomerKey: 'k',
      appId: 'a',
      scriptSource: 'conviva_hosted',
      initWithCohortReplay: true,
      replayScriptSource: 'customer_hosted',
      replayScriptUrl: 'https://cdn.example.com/fail-script.js',
    });
    expect(data.gtmOnFailure).toHaveBeenCalled();
  });

  it('init — cohort replay calls ConvivaReplay.init then loads SDK', () => {
    const replayInit = jest.fn();
    (globalThis as { ConvivaReplay?: { init: jest.Mock } }).ConvivaReplay = { init: replayInit };
    const { data } = loadSandbox({
      type: 'init',
      convivaCustomerKey: 'key-1',
      appId: 'a',
      scriptSource: 'conviva_hosted',
      initWithCohortReplay: true,
      replayScriptSource: 'conviva_hosted',
    });
    expect(replayInit).toHaveBeenCalledWith('key-1');
    expect(data.gtmOnSuccess).toHaveBeenCalled();
  });

  it('onScriptFailure and onReplayFailure invoke gtmOnFailure', () => {
    loadExportsOnly();
    const win = globalThis as {
      data: { gtmOnSuccess: jest.Mock; gtmOnFailure: jest.Mock };
    };
    win.data = { gtmOnSuccess: jest.fn(), gtmOnFailure: jest.fn() };
    const exp = (globalThis as { __EXPORTS__: { onScriptFailure: () => void; onReplayFailure: () => void } }).__EXPORTS__;
    exp.onScriptFailure();
    expect(win.data.gtmOnFailure).toHaveBeenCalled();
    win.data.gtmOnFailure.mockClear();
    exp.onReplayFailure();
    expect(win.data.gtmOnFailure).toHaveBeenCalled();
  });

  it('enablePreLoad bootstraps apptracker queue when window has no stub', () => {
    jest.resetModules();
    const win = globalThis as {
      apptracker?: unknown;
      data?: Record<string, unknown>;
    };
    delete win.apptracker;
    win.data = {
      __testExportsOnly: true,
      gtmOnSuccess: jest.fn(),
      gtmOnFailure: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../libs/sandboxed-js.js');
    expect(typeof win.apptracker).toBe('function');
    (win.apptracker as (...args: unknown[]) => void)('queued', 'arg');
  });

  it('runNonInit default branch fails unknown tag types', () => {
    const { data } = loadSandbox({ type: 'unknown-tag-xyz' });
    expect(data.gtmOnFailure).toHaveBeenCalled();
  });

  it('runNonInit fails when apptracker is not a function', () => {
    jest.resetModules();
    const win = globalThis as {
      apptracker?: unknown;
      data?: Record<string, unknown>;
    };
    win.apptracker = 'not-a-function';
    win.data = {
      type: 'setUserId',
      setUserId: 'u',
      gtmOnSuccess: jest.fn(),
      gtmOnFailure: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../libs/sandboxed-js.js');
    expect(win.data!.gtmOnFailure).toHaveBeenCalled();
  });

  it('runNonInit — empty setCustomTags does not call apptracker', () => {
    const { data } = loadSandbox({ type: 'setCustomTags' });
    const tracker = (globalThis as { apptracker?: jest.Mock }).apptracker;
    expect(tracker).not.toHaveBeenCalledWith('setCustomTags', expect.anything());
    expect(data.gtmOnSuccess).toHaveBeenCalled();
  });
});
