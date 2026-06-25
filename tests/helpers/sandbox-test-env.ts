/**
 * Loads libs/sandboxed-js.js in Jest with GTM polyfills and a mock `data` object.
 */

type GtmData = Record<string, unknown> & {
  gtmOnSuccess?: () => void;
  gtmOnFailure?: () => void;
  __testExportsOnly?: boolean;
};

export type SandboxExports = {
  SDK_VERSION: string;
  REPLAY_SDK_VERSION: string;
  getMainScriptUrl: (d: GtmData) => { url?: string; error?: string };
  getReplayScriptUrl: (d: GtmData) => { url?: string; error?: string };
  buildInitConfig: (d: GtmData) => Record<string, unknown>;
  buildRevenueData: (d: GtmData) => { revenueData?: Record<string, unknown>; error?: string };
  stringToArrayAndTrim: (str: string) => string[];
  isObject: (input: unknown) => boolean;
  onScriptSuccess: () => void;
  onScriptFailure: () => void;
  onReplayFailure: () => void;
  enablePreLoad: () => (...args: unknown[]) => void;
};

export function getExports(): SandboxExports {
  const win = globalThis as typeof globalThis & { __EXPORTS__?: SandboxExports };
  if (!win.__EXPORTS__) {
    throw new Error('__EXPORTS__ not set — call loadSandbox or loadExportsOnly first');
  }
  return win.__EXPORTS__;
}

export function loadSandbox(partial: GtmData): {
  data: GtmData;
  exports: SandboxExports;
} {
  jest.resetModules();
  const win = globalThis as typeof globalThis & {
    data?: GtmData;
    apptracker?: (...args: unknown[]) => void;
    ConvivaReplay?: { init: (key: string) => void };
  };

  win.data = {
    gtmOnSuccess: jest.fn(),
    gtmOnFailure: jest.fn(),
    ...partial,
  };

  win.apptracker = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../libs/sandboxed-js.js');

  return { data: win.data!, exports: getExports() };
}

export function loadExportsOnly(): SandboxExports {
  loadSandbox({ __testExportsOnly: true });
  return getExports();
}
