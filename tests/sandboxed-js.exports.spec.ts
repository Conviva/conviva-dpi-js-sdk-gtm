import { loadExportsOnly, loadSandbox } from './helpers/sandbox-test-env';
import { kitchenSinkInit, kitchenSinkTrackRevenue } from './kitchen-sink';

describe('sandboxed-js __EXPORTS__', () => {
  it('exposes SDK version constants', () => {
    const exp = loadExportsOnly();
    expect(exp.SDK_VERSION).toBe('v2.2.0');
    expect(exp.REPLAY_SDK_VERSION).toBe('v1.0.4');
  });

  it('getMainScriptUrl — Conviva-hosted default version', () => {
    const exp = loadExportsOnly();
    expect(exp.getMainScriptUrl({ scriptSource: 'conviva_hosted' }).url).toBe(
      'https://sensor.conviva.com/dpi/releases/v2.2.0/convivaAppTracker.js',
    );
  });

  it('getMainScriptUrl — custom version override', () => {
    const exp = loadExportsOnly();
    expect(
      exp.getMainScriptUrl({
        scriptSource: 'conviva_hosted',
        scriptVersionCustom: 'v9.9.9',
      }).url,
    ).toContain('/v9.9.9/');
  });

  it('getMainScriptUrl — customer-hosted requires URL', () => {
    const exp = loadExportsOnly();
    expect(exp.getMainScriptUrl({ scriptSource: 'customer_hosted' }).error).toMatch(/Script URL/);
    expect(
      exp.getMainScriptUrl({
        scriptSource: 'customer_hosted',
        scriptUrl: 'https://cdn.example.com/convivaAppTracker.js',
      }).url,
    ).toBe('https://cdn.example.com/convivaAppTracker.js');
  });

  it('getReplayScriptUrl — Conviva-hosted and customer-hosted', () => {
    const exp = loadExportsOnly();
    expect(exp.getReplayScriptUrl({ replayScriptSource: 'conviva_hosted' }).url).toContain(
      '/replay/releases/',
    );
    expect(exp.getReplayScriptUrl({ replayScriptSource: 'customer_hosted' }).error).toMatch(/Replay/);
  });

  it('buildInitConfig matches kitchen-sink init snapshot fields', () => {
    const exp = loadExportsOnly();
    const config = exp.buildInitConfig(kitchenSinkInit);
    expect(config).toMatchSnapshot();
  });

  it('buildInitConfig — enableClIdInCookies false when opted out', () => {
    const exp = loadExportsOnly();
    const config = exp.buildInitConfig({
      appId: 'a',
      convivaCustomerKey: 'k',
      enableClIdInCookies: false,
    });
    expect((config.configs as { enableClIdInCookies: boolean }).enableClIdInCookies).toBe(false);
  });

  it('buildRevenueData — valid kitchen-sink payload', () => {
    const exp = loadExportsOnly();
    const result = exp.buildRevenueData(kitchenSinkTrackRevenue);
    expect(result.error).toBeUndefined();
    expect(result.revenueData).toMatchSnapshot();
  });

  it('buildRevenueData — rejects invalid amount, order id, and currency', () => {
    const exp = loadExportsOnly();
    expect(exp.buildRevenueData({ revenueTotalOrderAmount: 'nope', revenueOrderId: '1', revenueCurrency: 'USD' }).error).toMatch(/totalOrderAmount/);
    expect(exp.buildRevenueData({ revenueTotalOrderAmount: '1', revenueOrderId: '', revenueCurrency: 'USD' }).error).toMatch(/transactionId/);
    expect(exp.buildRevenueData({ revenueTotalOrderAmount: '1', revenueOrderId: '1', revenueCurrency: '' }).error).toMatch(/currency/);
  });

  it('stringToArrayAndTrim splits and trims', () => {
    const exp = loadExportsOnly();
    expect(exp.stringToArrayAndTrim(' a , b ,, c ')).toEqual(['a', 'b', 'c']);
    expect(exp.stringToArrayAndTrim('')).toEqual([]);
  });
});

describe('sandboxed-js runtime', () => {
  it('setUserId calls apptracker and gtmOnSuccess', () => {
    const { data } = loadSandbox({ type: 'setUserId', setUserId: 'u1' });
    const tracker = (globalThis as { apptracker?: jest.Mock }).apptracker;
    expect(tracker).toHaveBeenCalledWith('setUserId', 'u1');
    expect(data.gtmOnSuccess).toHaveBeenCalled();
  });

  it('unknown tag type calls gtmOnFailure', () => {
    const { data } = loadSandbox({ type: 'not-a-real-type' as 'setUserId' });
    expect(data.gtmOnFailure).toHaveBeenCalled();
  });

  it('trackRevenue failure calls gtmOnFailure', () => {
    const win = globalThis as { apptracker?: jest.Mock };
    win.apptracker = jest.fn();
    const { data } = loadSandbox({
      type: 'trackRevenue',
      revenueTotalOrderAmount: 'bad',
      revenueOrderId: '1',
      revenueCurrency: 'USD',
    });
    expect(data.gtmOnFailure).toHaveBeenCalled();
  });
});
