/**
 * Dev harness entry — wires kitchen-sink init mock + env customer key onto window.data.
 */

import { kitchenSinkInit } from './kitchen-sink';

const win = globalThis as typeof globalThis & {
  CONVIVA_CUSTOMER_KEY?: string;
  data?: typeof kitchenSinkInit;
};

const data = {
  ...kitchenSinkInit,
  convivaCustomerKey:
    win.CONVIVA_CUSTOMER_KEY ??
    import.meta.env.VITE_CONVIVA_CUSTOMER_KEY ??
    '<set VITE_CONVIVA_CUSTOMER_KEY in .env>',
  gtmOnSuccess: () => console.log('[harness] gtmOnSuccess'),
  gtmOnFailure: () => console.log('[harness] gtmOnFailure'),
};

win.data = data;
