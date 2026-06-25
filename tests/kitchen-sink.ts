/**
 * One mock GTM `data` object per tag type — update here when adding template Fields.
 * Used by unit tests and the Vite dev harness (index.html).
 */

import type { GeneratedGtmParameters } from '../src/generated-types';

type GtmCallbacks = {
  gtmOnSuccess: () => void;
  gtmOnFailure: () => void;
};

export type GtmRuntimeData = Partial<GeneratedGtmParameters> & GtmCallbacks;

const noop = () => undefined;

/** Init tag — Conviva-hosted SDK + replay, full device metadata sample */
export const kitchenSinkInit: GtmRuntimeData = {
  type: 'init',
  convivaCustomerKey: 'test-customer-key',
  appId: 'WEB App',
  appVersion: '1.0.0',
  scriptSource: 'conviva_hosted',
  scriptVersion: 'v2.2.0',
  initWithCohortReplay: true,
  replayScriptSource: 'conviva_hosted',
  replayScriptVersion: 'v1.0.4',
  enableClIdInCookies: true,
  initUserId: 'user-kitchen-sink',
  initClientId: 'client-abc',
  initCustomTags: [{ key: 'plan', value: 'premium' }],
  deviceBrand: 'Acme',
  deviceManufacturer: 'Acme Inc',
  deviceModel: 'Browser',
  deviceType: 'Web',
  deviceVersion: '1',
  deviceOsName: 'macOS',
  deviceOsVersion: '14.0',
  deviceCategory: 'desktop',
  deviceFrameworkName: 'React',
  deviceFrameworkVersion: '19',
  gtmOnSuccess: noop,
  gtmOnFailure: noop,
};

export const kitchenSinkSetUserId: GtmRuntimeData = {
  type: 'setUserId',
  setUserId: 'user_123',
  gtmOnSuccess: noop,
  gtmOnFailure: noop,
};

export const kitchenSinkTrackRevenue: GtmRuntimeData = {
  type: 'trackRevenue',
  revenueTotalOrderAmount: '99.5',
  revenueOrderId: 'order-42',
  revenueCurrency: 'USD',
  revenueTaxAmount: '8.5',
  revenueShippingCost: '5',
  revenueDiscount: '10',
  revenueCartSize: '3',
  revenuePaymentMethod: 'card',
  revenuePaymentProvider: 'stripe',
  revenueOrderStatus: 'completed',
  revenueItemsList: [{ productId: 'sku-1', quantity: 1 }],
  revenueExtraMetadata: [{ key: 'campaign', value: 'spring' }],
  revenueDataObject: { loyalty_tier: 'gold' },
  gtmOnSuccess: noop,
  gtmOnFailure: noop,
};
