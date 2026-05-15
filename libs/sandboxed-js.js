// APIs
const copyFromWindow = require('copyFromWindow');
const getType = require('getType');
const injectScript = require('injectScript');
const createQueue = require('createQueue');
const setInWindow = require('setInWindow');
const callInWindow = require('callInWindow');
const log = require('logToConsole');
const makeNumber = require('makeNumber');
const makeString = require('makeString');
const makeTableMap = require('makeTableMap');
const Object = require('Object');

// Constants – Conviva script creates window.apptracker; Conviva-hosted URL built from version (sensor.conviva.com)
const CONVIVA_SCRIPT_BASE = 'https://sensor.conviva.com/dpi/releases/';
const CONVIVA_SCRIPT_FILE = '/convivaAppTracker.js';
const DEFAULT_VERSION = 'v2.1.0';
const LOG_PREFIX = '[Conviva DPI JS SDK / GTM] ';
// Cohort Replay – must load and init before main SDK (same Conviva CDN pattern)
const REPLAY_SCRIPT_BASE = 'https://sensor.conviva.com/replay/releases/';
const REPLAY_SCRIPT_FILE = '/conviva-replay.umd.min.js';
const REPLAY_DEFAULT_VERSION = 'v1.0.3';
const REPLAY_NAMESPACE = 'ConvivaReplay';

// Ensures apptracker queue stub and GlobalConvivaNamespace exist (sandbox: use createQueue/createArgumentsQueue only).
const enablePreLoad = function() {

  const apptracker = copyFromWindow('apptracker');
  if (apptracker) {
    return apptracker;
  }
  const globalNamespace = createQueue('GlobalConvivaNamespace');
  globalNamespace('apptracker');

  setInWindow('apptracker', function() {
    callInWindow('apptracker.q.push', arguments);
  });
  createQueue('apptracker.q');
  return copyFromWindow('apptracker');
};
const apptracker = enablePreLoad();
const fail = function(msg) {
  log(LOG_PREFIX + 'Error: ' + msg);
  return data.gtmOnFailure();
};

const isObject = function(input) {
  return input !== null && getType(input) === 'object';
};

// Parse comma-separated keys into array of trimmed strings
const stringToArrayAndTrim = function(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ''; });
};

const onScriptFailure = function() {
  return fail('Failed to load Conviva DPI JS SDK script');
};

const onReplayFailure = function() {
  return fail('Failed to load Conviva Replay script');
};

const runNonInit = function() {
  if (!apptracker || typeof apptracker !== 'function') {
    return fail('Conviva apptracker not found. Ensure the Initialize tag has run.');
  }

  switch (data.type) {
    case 'setUserId':
      apptracker('setUserId', data.setUserId);
      break;
    case 'trackPageView':
      if (data.trackPageViewTitle) {
        apptracker('trackPageView', { title: data.trackPageViewTitle });
      } else {
        apptracker('trackPageView');
      }
      break;
    case 'trackCustomEvent': {
      const tableData = makeTableMap(data.eventData || [], 'name', 'value');
      let eventDataObj = tableData && isObject(tableData) ? tableData : {};
      if (data.eventDataObject && isObject(data.eventDataObject)) {
        const obj = data.eventDataObject;
        for (var k in obj) { eventDataObj[k] = obj[k]; }
      }
      apptracker('trackCustomEvent', { name: data.eventName, data: eventDataObj });
      break;
    }
    case 'trackRevenue': {
      // ── Required fields: validate, cast to correct types, bail if invalid ──
      var totalOrderAmount = makeNumber(data.revenueTotalOrderAmount);
      if (totalOrderAmount !== totalOrderAmount) { // NaN check
        return fail('trackRevenue: invalid totalOrderAmount "' + data.revenueTotalOrderAmount + '". Must be a finite number.');
      }
      var transactionId = data.revenueOrderId != null ? makeString(data.revenueOrderId).trim() : '';
      if (transactionId === '') {
        return fail('trackRevenue: invalid transactionId. Must be a non-empty string.');
      }
      var currency = data.revenueCurrency != null ? makeString(data.revenueCurrency).trim() : '';
      if (currency === '') {
        return fail('trackRevenue: invalid currency. Must be a non-empty string.');
      }

      const revenueData = {
        totalOrderAmount: totalOrderAmount,
        transactionId: transactionId,
        currency: currency
      };

      // ── Optional numeric fields: cast to number, skip if invalid ──
      if (data.revenueTaxAmount != null && makeString(data.revenueTaxAmount).trim() !== '') {
        var taxAmount = makeNumber(data.revenueTaxAmount);
        if (taxAmount === taxAmount) { revenueData.taxAmount = taxAmount; }
        else { log(LOG_PREFIX + 'trackRevenue: invalid taxAmount "' + data.revenueTaxAmount + '". Must be a number. Ignoring.'); }
      }
      if (data.revenueShippingCost != null && makeString(data.revenueShippingCost).trim() !== '') {
        var shippingCost = makeNumber(data.revenueShippingCost);
        if (shippingCost === shippingCost) { revenueData.shippingCost = shippingCost; }
        else { log(LOG_PREFIX + 'trackRevenue: invalid shippingCost "' + data.revenueShippingCost + '". Must be a number. Ignoring.'); }
      }
      if (data.revenueDiscount != null && makeString(data.revenueDiscount).trim() !== '') {
        var disc = makeNumber(data.revenueDiscount);
        if (disc === disc) { revenueData.discount = disc; }
        else { log(LOG_PREFIX + 'trackRevenue: invalid discount "' + data.revenueDiscount + '". Must be a number. Ignoring.'); }
      }
      if (data.revenueCartSize != null && makeString(data.revenueCartSize).trim() !== '') {
        var cartSz = makeNumber(data.revenueCartSize);
        if (cartSz === cartSz) { revenueData.cartSize = cartSz; }
        else { log(LOG_PREFIX + 'trackRevenue: invalid cartSize "' + data.revenueCartSize + '". Must be a number. Ignoring.'); }
      }

      // ── Optional string fields: cast to string, skip if empty ──
      if (data.revenuePaymentMethod != null) {
        var pm = makeString(data.revenuePaymentMethod).trim();
        if (pm !== '') revenueData.paymentMethod = pm;
      }
      if (data.revenuePaymentProvider != null) {
        var pp = makeString(data.revenuePaymentProvider).trim();
        if (pp !== '') revenueData.paymentProvider = pp;
      }
      if (data.revenueOrderStatus != null) {
        var os = makeString(data.revenueOrderStatus).trim();
        if (os !== '') revenueData.orderStatus = os;
      }

      // ── Items: must be an array, skip if not ──
      if (data.revenueItemsList != null) {
        if (getType(data.revenueItemsList) === 'array' && data.revenueItemsList.length > 0) {
          revenueData.items = data.revenueItemsList;
        } else if (getType(data.revenueItemsList) !== 'array') {
          log(LOG_PREFIX + 'trackRevenue: items must be an array, received "' + getType(data.revenueItemsList) + '". Ignoring.');
        }
      }

      // ── extraMetadata: merge table + variable into nested object (matches SDK API) ──
      var extraMetadata = {};
      var tableMeta = makeTableMap(data.revenueExtraMetadata || [], 'key', 'value');
      if (tableMeta && isObject(tableMeta)) {
        for (var ek in tableMeta) { extraMetadata[ek] = tableMeta[ek]; }
      }
      if (data.revenueDataObject != null) {
        if (isObject(data.revenueDataObject)) {
          var robj = data.revenueDataObject;
          for (var rk in robj) { extraMetadata[rk] = robj[rk]; }
        } else {
          log(LOG_PREFIX + 'trackRevenue: revenueDataObject must be a plain object, received "' + getType(data.revenueDataObject) + '". Ignoring.');
        }
      }
      if (Object.keys(extraMetadata).length > 0) {
        revenueData.extraMetadata = extraMetadata;
      }

      apptracker('trackCustomEvent', { name: 'conviva_revenue_event', data: revenueData });
      break;
    }
    case 'setCustomTags': {
      var tags = makeTableMap(data.setCustomTagsTable || [], 'key', 'value') || {};
      if (!isObject(tags)) tags = {};
      if (data.setCustomTagsObject && isObject(data.setCustomTagsObject)) {
        var cobj = data.setCustomTagsObject;
        for (var ck in cobj) { tags[ck] = cobj[ck]; }
      }
      if (Object.keys(tags).length > 0) apptracker('setCustomTags', tags);
      break;
    }
    case 'unsetCustomTags': {
      const keys = stringToArrayAndTrim(data.unsetCustomTagsKeys || '');
      if (keys.length > 0) apptracker('unsetCustomTags', keys);
      break;
    }
    case 'trackError': {
      const errPayload = { message: data.trackErrorMessage };
      if (data.trackErrorFilename) errPayload.filename = data.trackErrorFilename;
      if (data.trackErrorObject != null) errPayload.error = data.trackErrorObject;
      apptracker('trackError', errPayload);
      break;
    }
    default:
      return fail('Unknown tag type: ' + data.type);
  }
  data.gtmOnSuccess();
};

// Build init config: appId, convivaCustomerKey, appVersion, optional configs.enableClIdInCookies, optional deviceMetadata
const buildInitConfig = function() {
  const config = {
    appId: data.appId,
    convivaCustomerKey: data.convivaCustomerKey,
    appVersion: data.appVersion || undefined
  };
  if (data.enableClIdInCookies === true) {
    config.configs = config.configs || {};
    config.configs.enableClIdInCookies = true;
  }
  const deviceMetadata = {};
  if (data.deviceBrand) deviceMetadata.DeviceBrand = data.deviceBrand;
  if (data.deviceManufacturer) deviceMetadata.DeviceManufacturer = data.deviceManufacturer;
  if (data.deviceModel) deviceMetadata.DeviceModel = data.deviceModel;
  if (data.deviceType) deviceMetadata.DeviceType = data.deviceType;
  if (data.deviceVersion) deviceMetadata.DeviceVersion = data.deviceVersion;
  if (data.deviceOsName) deviceMetadata.OperatingSystemName = data.deviceOsName;
  if (data.deviceOsVersion) deviceMetadata.OperatingSystemVersion = data.deviceOsVersion;
  if (data.deviceCategory) deviceMetadata.DeviceCategory = data.deviceCategory;
  if (data.deviceFrameworkName) deviceMetadata.FrameworkName = data.deviceFrameworkName;
  if (data.deviceFrameworkVersion) deviceMetadata.FrameworkVersion = data.deviceFrameworkVersion;
  if (Object.keys(deviceMetadata).length > 0) config.deviceMetadata = deviceMetadata;
  return config;
};

const onScriptSuccess = function() {
  if (!apptracker || typeof apptracker !== 'function') return fail('Conviva apptracker not loaded');

  var initClientIdStr = data.initClientId ? makeString(data.initClientId).trim() : '';
  if (initClientIdStr !== '') {
    apptracker('setClientId', initClientIdStr);
  }
  // Init: call convivaAppTracker with config, then optional setUserId and setCustomTags
  apptracker('convivaAppTracker', buildInitConfig());

  if (data.initUserId) apptracker('setUserId', data.initUserId);
  const initTags = makeTableMap(data.initCustomTags || [], 'key', 'value');
  if (initTags && isObject(initTags) && Object.keys(initTags).length > 0) apptracker('setCustomTags', initTags);

  data.gtmOnSuccess();
};

if (data.type === 'init') {
  var scriptUrl;
  if (data.scriptSource === 'customer_hosted') {
    scriptUrl = data.scriptUrl;
    if (!scriptUrl) return fail('Script URL is required for Customer-hosted source');
  } else {
    var version = (data.scriptVersionCustom && data.scriptVersionCustom.trim() !== '') ? data.scriptVersionCustom.trim() : (data.scriptVersion || DEFAULT_VERSION);
    scriptUrl = CONVIVA_SCRIPT_BASE + version + CONVIVA_SCRIPT_FILE;
  }
  if (data.initWithCohortReplay === true) {
    var replayUrl;
    if (data.replayScriptSource === 'customer_hosted') {
      replayUrl = data.replayScriptUrl;
      if (!replayUrl) return fail('Replay script URL is required for Customer-hosted Replay source');
    } else {
      var replayVersion = (data.replayScriptVersionCustom && data.replayScriptVersionCustom.trim() !== '') ? data.replayScriptVersionCustom.trim() : (data.replayScriptVersion || REPLAY_DEFAULT_VERSION);
      replayUrl = REPLAY_SCRIPT_BASE + replayVersion + REPLAY_SCRIPT_FILE;
    }
    var onReplaySuccess = function() {
      var ConvivaReplay = copyFromWindow(REPLAY_NAMESPACE);
      if (ConvivaReplay && typeof ConvivaReplay.init === 'function') {
        ConvivaReplay.init(data.convivaCustomerKey);
      }
      injectScript(scriptUrl, onScriptSuccess, onScriptFailure, 'conviva_appanalytics');
    };
    injectScript(replayUrl, onReplaySuccess, onReplayFailure, 'conviva_replay');
  } else {
    injectScript(scriptUrl, onScriptSuccess, onScriptFailure, 'conviva_appanalytics');
  }
} else {
  runNonInit();
}
