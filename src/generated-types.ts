// This file is auto-generated from libs/template-parameters.json.
// Do not edit manually — run `pnpm build` to regenerate.

export interface GeneratedGtmParameters {
  type?: 'init' | 'setUserId' | 'trackPageView' | 'trackCustomEvent' | 'setCustomTags' | 'unsetCustomTags' | 'trackError' | 'trackRevenue';
  convivaCustomerKey: string;
  appId: string;
  appVersion?: string;
  scriptSource?: 'conviva_hosted' | 'customer_hosted';
  scriptVersion?: 'v2.1.0' | 'v2.0.2' | 'v2.0.1' | 'v2.0.0' | 'v1.5.5';
  scriptVersionCustom?: string;
  scriptUrl: string;
  initWithCohortReplay?: boolean;
  replayScriptSource?: 'conviva_hosted' | 'customer_hosted';
  replayScriptVersion?: 'v1.0.3' | 'v1.0.2' | 'v1.0.1';
  replayScriptVersionCustom?: string;
  replayScriptUrl: string;
  initUserId?: string;
  initClientId?: string;
  initCustomTags?: Array<{key: string; value: string}>;
  enableClIdInCookies?: boolean;
  deviceBrand?: string;
  deviceManufacturer?: string;
  deviceModel?: string;
  deviceType?: '' | 'DESKTOP' | 'Console' | 'Settop' | 'Mobile' | 'Tablet' | 'SmartTV' | 'Vehicle' | 'Other';
  deviceVersion?: string;
  deviceOsName?: string;
  deviceOsVersion?: string;
  deviceCategory?: '' | 'AND' | 'APL' | 'CHR' | 'DSKAPP' | 'SIMULATOR' | 'LGTV' | 'NINTENDO' | 'PS' | 'RK' | 'SAMSUNGTV' | 'TV' | 'STB' | 'TIVO' | 'WEB' | 'WIN' | 'XB' | 'KAIOS' | 'LNX';
  deviceFrameworkName?: string;
  deviceFrameworkVersion?: string;
  setUserId: string;
  trackPageViewTitle?: string;
  eventName: string;
  eventData?: Array<{name: string; value: string}>;
  eventDataObject?: Record<string, string>;
  revenueTotalOrderAmount: string;
  revenueOrderId: string;
  revenueCurrency: string;
  revenueTaxAmount?: string;
  revenueShippingCost?: string;
  revenueDiscount?: string;
  revenueCartSize?: string;
  revenueItemsList?: Record<string, string>;
  revenuePaymentMethod?: string;
  revenuePaymentProvider?: string;
  revenueOrderStatus?: string;
  revenueExtraMetadata?: Array<{key: string; value: string}>;
  revenueDataObject?: Record<string, string>;
  setCustomTagsTable?: Array<{key: string; value: string}>;
  setCustomTagsObject?: Record<string, string>;
  unsetCustomTagsKeys?: string;
  trackErrorMessage: string;
  trackErrorFilename?: string;
  trackErrorObject?: Record<string, string>;
}
