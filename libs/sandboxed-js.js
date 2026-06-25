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
const SDK_VERSION = 'v2.2.0';
const LOG_PREFIX = '[Conviva DPI JS SDK / GTM] ';
// Cohort Replay – must load and init before main SDK (same Conviva CDN pattern)
const REPLAY_SCRIPT_BASE = 'https://sensor.conviva.com/replay/releases/';
const REPLAY_SCRIPT_FILE = '/conviva-replay.umd.min.js';
const REPLAY_SDK_VERSION = 'v1.0.4';
const REPLAY_NAMESPACE = 'ConvivaReplay';

const getMainScriptUrl = function(d) {
  if (d.scriptSource === 'customer_hosted') {
    if (!d.scriptUrl) {
      return { error: 'Script URL is required for Customer-hosted source' };
    }
    return { url: d.scriptUrl };
  }
  var version = (d.scriptVersionCustom && d.scriptVersionCustom.trim() !== '') ?
    d.scriptVersionCustom.trim() : (d.scriptVersion || SDK_VERSION);
  return { url: CONVIVA_SCRIPT_BASE + version + CONVIVA_SCRIPT_FILE };
};

const getReplayScriptUrl = function(d) {
  if (d.replayScriptSource === 'customer_hosted') {
    if (!d.replayScriptUrl) {
      return { error: 'Replay script URL is required for Customer-hosted Replay source' };
    }
    return { url: d.replayScriptUrl };
  }
  var replayVersion = (d.replayScriptVersionCustom && d.replayScriptVersionCustom.trim() !== '') ?
    d.replayScriptVersionCustom.trim() : (d.replayScriptVersion || REPLAY_SDK_VERSION);
  return { url: REPLAY_SCRIPT_BASE + replayVersion + REPLAY_SCRIPT_FILE };
};

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

const buildRevenueData = function(d) {
  var totalOrderAmount = makeNumber(d.revenueTotalOrderAmount);
  if (totalOrderAmount !== totalOrderAmount) {
    return { error: 'trackRevenue: invalid totalOrderAmount "' + d.revenueTotalOrderAmount + '". Must be a finite number.' };
  }
  var transactionId = d.revenueOrderId != null ? makeString(d.revenueOrderId).trim() : '';
  if (transactionId === '') {
    return { error: 'trackRevenue: invalid transactionId. Must be a non-empty string.' };
  }
  var currency = d.revenueCurrency != null ? makeString(d.revenueCurrency).trim() : '';
  if (currency === '') {
    return { error: 'trackRevenue: invalid currency. Must be a non-empty string.' };
  }

  const revenueData = {
    totalOrderAmount: totalOrderAmount,
    transactionId: transactionId,
    currency: currency
  };

  if (d.revenueTaxAmount != null && makeString(d.revenueTaxAmount).trim() !== '') {
    var taxAmount = makeNumber(d.revenueTaxAmount);
    if (taxAmount === taxAmount) { revenueData.taxAmount = taxAmount; }
    else { log(LOG_PREFIX + 'trackRevenue: invalid taxAmount "' + d.revenueTaxAmount + '". Must be a number. Ignoring.'); }
  }
  if (d.revenueShippingCost != null && makeString(d.revenueShippingCost).trim() !== '') {
    var shippingCost = makeNumber(d.revenueShippingCost);
    if (shippingCost === shippingCost) { revenueData.shippingCost = shippingCost; }
    else { log(LOG_PREFIX + 'trackRevenue: invalid shippingCost "' + d.revenueShippingCost + '". Must be a number. Ignoring.'); }
  }
  if (d.revenueDiscount != null && makeString(d.revenueDiscount).trim() !== '') {
    var disc = makeNumber(d.revenueDiscount);
    if (disc === disc) { revenueData.discount = disc; }
    else { log(LOG_PREFIX + 'trackRevenue: invalid discount "' + d.revenueDiscount + '". Must be a number. Ignoring.'); }
  }
  if (d.revenueCartSize != null && makeString(d.revenueCartSize).trim() !== '') {
    var cartSz = makeNumber(d.revenueCartSize);
    if (cartSz === cartSz) { revenueData.cartSize = cartSz; }
    else { log(LOG_PREFIX + 'trackRevenue: invalid cartSize "' + d.revenueCartSize + '". Must be a number. Ignoring.'); }
  }

  if (d.revenuePaymentMethod != null) {
    var pm = makeString(d.revenuePaymentMethod).trim();
    if (pm !== '') revenueData.paymentMethod = pm;
  }
  if (d.revenuePaymentProvider != null) {
    var pp = makeString(d.revenuePaymentProvider).trim();
    if (pp !== '') revenueData.paymentProvider = pp;
  }
  if (d.revenueOrderStatus != null) {
    var os = makeString(d.revenueOrderStatus).trim();
    if (os !== '') revenueData.orderStatus = os;
  }

  if (d.revenueItemsList != null) {
    if (getType(d.revenueItemsList) === 'array' && d.revenueItemsList.length > 0) {
      revenueData.items = d.revenueItemsList;
    } else if (getType(d.revenueItemsList) !== 'array') {
      log(LOG_PREFIX + 'trackRevenue: items must be an array, received "' + getType(d.revenueItemsList) + '". Ignoring.');
    }
  }

  var extraMetadata = {};
  var tableMeta = makeTableMap(d.revenueExtraMetadata || [], 'key', 'value');
  if (tableMeta && isObject(tableMeta)) {
    for (var ek in tableMeta) { extraMetadata[ek] = tableMeta[ek]; }
  }
  if (d.revenueDataObject != null) {
    if (isObject(d.revenueDataObject)) {
      var robj = d.revenueDataObject;
      for (var rk in robj) { extraMetadata[rk] = robj[rk]; }
    } else {
      log(LOG_PREFIX + 'trackRevenue: revenueDataObject must be a plain object, received "' + getType(d.revenueDataObject) + '". Ignoring.');
    }
  }
  if (Object.keys(extraMetadata).length > 0) {
    revenueData.extraMetadata = extraMetadata;
  }

  return { revenueData: revenueData };
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
      const built = buildRevenueData(data);
      if (built.error) {
        return fail(built.error);
      }
      apptracker('trackCustomEvent', { name: 'conviva_revenue_event', data: built.revenueData });
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

// Build init config: appId, convivaCustomerKey, appVersion, configs.enableClIdInCookies (default true unless explicitly false), optional deviceMetadata
const buildInitConfig = function(d) {
  const config = {
    appId: d.appId,
    convivaCustomerKey: d.convivaCustomerKey,
    appVersion: d.appVersion || undefined
  };
  config.configs = config.configs || {};
  config.configs.enableClIdInCookies = d.enableClIdInCookies !== false;
  const deviceMetadata = {};
  if (d.deviceBrand) deviceMetadata.DeviceBrand = d.deviceBrand;
  if (d.deviceManufacturer) deviceMetadata.DeviceManufacturer = d.deviceManufacturer;
  if (d.deviceModel) deviceMetadata.DeviceModel = d.deviceModel;
  if (d.deviceType) deviceMetadata.DeviceType = d.deviceType;
  if (d.deviceVersion) deviceMetadata.DeviceVersion = d.deviceVersion;
  if (d.deviceOsName) deviceMetadata.OperatingSystemName = d.deviceOsName;
  if (d.deviceOsVersion) deviceMetadata.OperatingSystemVersion = d.deviceOsVersion;
  if (d.deviceCategory) deviceMetadata.DeviceCategory = d.deviceCategory;
  if (d.deviceFrameworkName) deviceMetadata.FrameworkName = d.deviceFrameworkName;
  if (d.deviceFrameworkVersion) deviceMetadata.FrameworkVersion = d.deviceFrameworkVersion;
  if (Object.keys(deviceMetadata).length > 0) config.deviceMetadata = deviceMetadata;
  return config;
};

const onScriptSuccess = function() {
  if (!apptracker || typeof apptracker !== 'function') return fail('Conviva apptracker not loaded');

  var initClientIdStr = data.initClientId ? makeString(data.initClientId).trim() : '';
  if (initClientIdStr !== '') {
    apptracker('setClientId', initClientIdStr);
  }
  apptracker('convivaAppTracker', buildInitConfig(data));

  if (data.initUserId) apptracker('setUserId', data.initUserId);
  const initTags = makeTableMap(data.initCustomTags || [], 'key', 'value');
  if (initTags && isObject(initTags) && Object.keys(initTags).length > 0) apptracker('setCustomTags', initTags);

  data.gtmOnSuccess();
};

// exports:start
setInWindow('__EXPORTS__', {
  SDK_VERSION: SDK_VERSION,
  REPLAY_SDK_VERSION: REPLAY_SDK_VERSION,
  getMainScriptUrl: getMainScriptUrl,
  getReplayScriptUrl: getReplayScriptUrl,
  buildInitConfig: buildInitConfig,
  buildRevenueData: buildRevenueData,
  stringToArrayAndTrim: stringToArrayAndTrim,
  isObject: isObject,
  onScriptSuccess: onScriptSuccess,
  onScriptFailure: onScriptFailure,
  onReplayFailure: onReplayFailure,
  enablePreLoad: enablePreLoad,
});
// exports:end

if (typeof data !== 'undefined' && !data.__testExportsOnly) {
  if (data.type === 'init') {
    var scriptResolved = getMainScriptUrl(data);
    if (scriptResolved.error) {
      fail(scriptResolved.error);
    } else {
      var scriptUrl = scriptResolved.url;
      if (data.initWithCohortReplay === true) {
        var replayResolved = getReplayScriptUrl(data);
        if (replayResolved.error) {
          fail(replayResolved.error);
        } else {
          var replayUrl = replayResolved.url;
          var onReplaySuccess = function() {
            var ConvivaReplay = copyFromWindow(REPLAY_NAMESPACE);
            if (ConvivaReplay && typeof ConvivaReplay.init === 'function') {
              ConvivaReplay.init(data.convivaCustomerKey);
            }
            injectScript(scriptUrl, onScriptSuccess, onScriptFailure, 'conviva_appanalytics');
          };
          injectScript(replayUrl, onReplaySuccess, onReplayFailure, 'conviva_replay');
        }
      } else {
        injectScript(scriptUrl, onScriptSuccess, onScriptFailure, 'conviva_appanalytics');
      }
    }
  } else {
    runNonInit();
  }
}
