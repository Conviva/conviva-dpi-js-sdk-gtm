// Minimal "init" tag mock so the dev harness has something to feed into
// libs/sandboxed-js.js. Expanded in TOOLING_PLAN.md item #16 to cover every
// Field across every tag type.
//
// At runtime: window.data is read by the sandboxed JS as the GTM `data`
// object. Customer key comes from VITE_CONVIVA_CUSTOMER_KEY at build time
// (see scripts/setup-env.js + .env.example).

import type { GeneratedGtmParameters } from '../generated-types';

const win: any = typeof globalThis !== 'undefined' ? globalThis : window;

type GtmCallbacks = {
  gtmOnSuccess: () => void;
  gtmOnFailure: () => void;
};

// `Partial` because a single tag type (here: init) doesn't populate
// every NON_EMPTY-validated field across the whole template — those
// only become required on the tag type that actually uses them.
type GtmRuntimeData = Partial<GeneratedGtmParameters> & GtmCallbacks;

const data: GtmRuntimeData = {
  type: 'init',
  convivaCustomerKey: win.CONVIVA_CUSTOMER_KEY ?? '<set VITE_CONVIVA_CUSTOMER_KEY in .env>',
  appId: 'conviva-gtm-dev-harness',
  appVersion: '1.0.0',
  scriptSource: 'conviva_hosted',
  scriptVersion: 'v2.1.0',
  replayScriptSource: 'conviva_hosted',
  replayScriptVersion: 'v1.0.3',
  enableClIdInCookies: true,
  gtmOnSuccess: () => console.log('[harness] gtmOnSuccess'),
  gtmOnFailure: () => console.log('[harness] gtmOnFailure'),
};

win.data = data;
